import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import Groq from 'groq-sdk'

// Cache is valid for 24 hours
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

function getGroq() {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new Error('GROQ_API_KEY is not set in environment variables')
  return new Groq({ apiKey: key })
}

function normaliseSubjectsLocal(raw: unknown): Array<{ name: string; max_marks: number }> {
  if (!Array.isArray(raw)) return []
  return raw.map((item) => {
    if (typeof item === 'string') return { name: item, max_marks: 0 }
    if (item && typeof item === 'object' && 'name' in item) {
      return {
        name: String((item as { name: unknown }).name ?? ''),
        max_marks: Number((item as { max_marks?: unknown }).max_marks ?? 0),
      }
    }
    return { name: String(item ?? ''), max_marks: 0 }
  })
}

export async function GET(req: NextRequest) {
  const studentId = req.nextUrl.searchParams.get('student_id')

  if (!studentId) {
    return NextResponse.json({ error: 'student_id required' }, { status: 400 })
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => [], setAll: () => {} } }
  )

  // --- 1. Check cache first ---
  const { data: cached } = await supabase
    .from('student_insights')
    .select('ai_summary, last_generated_at')
    .eq('student_id', studentId)
    .single()

  if (cached?.ai_summary) {
    const age = Date.now() - new Date(cached.last_generated_at).getTime()
    if (age < CACHE_TTL_MS) {
      return NextResponse.json({ summary: cached.ai_summary, cached: true })
    }
  }

  // --- 2. Fetch student ---
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('name, batch, coaching_center_id')
    .eq('id', studentId)
    .single()

  if (studentError || !student) {
    console.error('[AI Insights] Student fetch error:', studentError)
    return NextResponse.json({ error: `Student not found: ${studentError?.message}` }, { status: 404 })
  }

  // --- 3. Fetch last 5 test scores ---
  const { data: rawScores, error: scoresError } = await supabase
    .from('scores')
    .select('total, percentage, rank, is_absent, subject_scores, test_id, tests ( test_name, test_date, max_marks, subjects )')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (scoresError) {
    console.error('[AI Insights] Scores fetch error:', scoresError)
    return NextResponse.json({ error: `Scores fetch failed: ${scoresError.message}` }, { status: 500 })
  }

  const scores = rawScores || []

  // --- 4. Fetch attendance ---
  const { data: attendance, error: attError } = await supabase
    .from('attendance')
    .select('is_present')
    .eq('student_id', studentId)

  if (attError) {
    console.warn('[AI Insights] Attendance fetch warning:', attError)
  }

  const totalDays = attendance?.length || 0
  const presentDays = attendance?.filter((r) => r.is_present).length || 0
  const attendancePct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : null

  // --- 5. Build enriched context for the AI ---

  // Label a percentage with honest but kind language
  function scoreLabel(pct: number): string {
    if (pct >= 85) return 'excellent'
    if (pct >= 70) return 'good'
    if (pct >= 50) return 'average'
    if (pct >= 35) return 'below average'
    return 'needs significant effort'
  }

  // Compute overall trend across available scores (oldest → newest)
  const presentScores = [...scores].reverse().filter((s: any) => !s.is_absent)
  let trendDirection = 'stable'
  if (presentScores.length >= 2) {
    const first = presentScores[0].percentage
    const last = presentScores[presentScores.length - 1].percentage
    const diff = last - first
    if (diff >= 5) trendDirection = 'improving'
    else if (diff <= -5) trendDirection = 'declining'
    else trendDirection = 'consistent'
  }

  // Find best and weakest subject from the most recent non-absent test
  const latestPresent = scores.find((s: any) => !s.is_absent) as any
  let bestSubject = ''
  let weakSubject = ''
  if (latestPresent?.subject_scores && latestPresent?.tests?.subjects) {
    const subs = normaliseSubjectsLocal(latestPresent.tests.subjects)
    const withPct = subs
      .filter((sub) => sub.max_marks > 0)
      .map((sub) => ({
        name: sub.name,
        pct: Math.round(((latestPresent.subject_scores[sub.name] ?? 0) / sub.max_marks) * 100),
      }))
    if (withPct.length > 0) {
      withPct.sort((a, b) => b.pct - a.pct)
      bestSubject = `${withPct[0].name} (${withPct[0].pct}% — ${scoreLabel(withPct[0].pct)})`
      if (withPct.length > 1) {
        weakSubject = `${withPct[withPct.length - 1].name} (${withPct[withPct.length - 1].pct}% — ${scoreLabel(withPct[withPct.length - 1].pct)})`
      }
    }
  }

  const testLines = scores.map((s: any, i: number) => {
    if (s.is_absent) {
      return `Test ${i + 1} (${s.tests?.test_name || 'Unknown'}): ABSENT`
    }
    const subjects = normaliseSubjectsLocal(s.tests?.subjects)
    const subjectBreakdown = subjects.length > 0
      ? subjects
          .map((sub) => {
            const subScore = s.subject_scores?.[sub.name] ?? 'N/A'
            const pct = sub.max_marks > 0 && typeof subScore === 'number'
              ? Math.round((subScore / sub.max_marks) * 100)
              : '?'
            return `${sub.name}: ${subScore}${sub.max_marks > 0 ? `/${sub.max_marks}` : ''} (${pct}% — ${typeof pct === 'number' ? scoreLabel(pct) : '?'})`
          })
          .join(', ')
      : 'No subject breakdown available'
    return `Test ${i + 1} (${s.tests?.test_name || 'Test'}): Total ${s.total}/${s.tests?.max_marks || '?'}, Rank ${s.rank ?? 'N/A'} | ${subjectBreakdown}`
  })

  const dataContext = `
Student Name: ${student.name}
Batch: ${student.batch}
Overall Trend: ${trendDirection}
Best Subject in Latest Test: ${bestSubject || 'N/A'}
Subject Needing Focus: ${weakSubject || 'N/A'}
Attendance: ${attendancePct !== null ? `${attendancePct}% (${presentDays} of ${totalDays} days)` : 'No attendance records yet'}

Recent test performance (most recent first):
${testLines.length > 0 ? testLines.join('\n') : 'No test results available yet.'}
  `.trim()

  // --- 6. Call Groq ---
  let summary = ''
  try {
    const groq = getGroq()
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are a warm, encouraging teacher writing a quick Performance Summary for a parent in India. The parent wants to know how their child is doing — keep it honest but always supportive and motivating.

Write 2 to 3 natural, flowing sentences. Rules:
- Always write in third person using the student's name (never "you" or "your").
- Use the Overall Trend field to describe progress — do not guess or contradict it.
- For subjects: use the exact score labels provided (e.g. "good", "average", "needs significant effort") — do not call a low score "exceptional" or "excellent".
- Mention the subject doing best and the one needing the most attention.
- Mention attendance naturally in the last sentence.
- End with one warm, motivating line specific to the student's situation — not a generic platitude.
- Write like a real teacher — natural, warm, conversational. No bullet points, no markdown, no jargon.`,
        },
        {
          role: 'user',
          content: `Student data:\n\n${dataContext}\n\nWrite the Performance Summary now.`,
        },
      ],
      temperature: 0.75,
      max_tokens: 220,
    })

    summary = completion.choices[0]?.message?.content?.trim() || ''
  } catch (err: any) {
    console.error('[AI Insights] Groq API error:', err?.message || err)
    return NextResponse.json(
      { error: `Groq API failed: ${err?.message || 'Unknown error'}` },
      { status: 500 }
    )
  }

  if (!summary) {
    return NextResponse.json({ error: 'AI returned empty response' }, { status: 500 })
  }

  // --- 7. Cache the result ---
  const { error: upsertError } = await supabase.from('student_insights').upsert(
    {
      student_id: studentId,
      coaching_center_id: student.coaching_center_id,
      ai_summary: summary,
      last_generated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id' }
  )

  if (upsertError) {
    console.warn('[AI Insights] Cache upsert warning:', upsertError.message)
    // Don't fail — still return the summary even if caching fails
  }

  return NextResponse.json({ summary, cached: false })
}
