import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Centralized scoring engine.
 *
 * Call `recalculateTestStats` after ANY score insert / update / delete —
 * whether from CSV upload, batch grader, or single-score form.
 *
 * It will:
 *  1. Re-fetch all present scores for the test.
 *  2. Assign dense ranks (ties share the same rank).
 *  3. Persist updated ranks to the scores table.
 *  4. Update highest_score, average_score, students_appeared on the tests row.
 */
export async function recalculateTestStats(
  supabase: SupabaseClient,
  testId: string
): Promise<void> {
  // 1. Fetch all present scores, ordered by total desc
  const { data } = await supabase
    .from('scores')
    .select('id, total')
    .eq('test_id', testId)
    .eq('is_absent', false)
    .order('total', { ascending: false })

  const scores = data ?? []

  if (scores.length === 0) {
    // No present students — wipe aggregates
    await supabase
      .from('tests')
      .update({ highest_score: null, average_score: null, students_appeared: null })
      .eq('id', testId)
    return
  }

  // 2. Assign dense ranks — ties share the same rank
  let currentRank = 1
  const withRanks = scores.map((s, idx) => {
    if (idx === 0) {
      currentRank = 1
    } else if ((s.total as number) < (scores[idx - 1].total as number)) {
      currentRank = idx + 1
    }
    return { id: s.id as string, rank: currentRank }
  })

  // 3. Persist ranks (parallel)
  await Promise.all(
    withRanks.map((r) =>
      supabase.from('scores').update({ rank: r.rank }).eq('id', r.id)
    )
  )

  // 4. Compute + persist test aggregates
  const totals = scores.map((s) => s.total as number)
  const highestScore = Math.max(...totals)
  const averageScore = parseFloat(
    (totals.reduce((a, b) => a + b, 0) / totals.length).toFixed(2)
  )

  await supabase
    .from('tests')
    .update({
      highest_score: highestScore,
      average_score: averageScore,
      students_appeared: scores.length,
    })
    .eq('id', testId)
}
