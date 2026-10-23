'use client'

import { useState, useMemo } from 'react'
import { GraduationCap, Award, Target, CheckCircle2, TrendingUp, TrendingDown, Clock, Languages } from 'lucide-react'

interface PerformanceSummaryProps {
  studentName?: string
  studentId?: string
  latestScore?: any
  previousScore?: any
  scores?: any[]
  dailyAttendancePercentage?: number
  presentDays?: number
  totalDays?: number
}

type Language = 'en' | 'mr' | 'hi'

export default function PerformanceSummary({
  studentName = 'Student',
  latestScore,
  previousScore,
  scores = [],
  dailyAttendancePercentage = 100,
  presentDays = 0,
  totalDays = 0
}: PerformanceSummaryProps) {
  const [selectedLang, setSelectedLang] = useState<Language>('en')

  // Subject performance analysis
  const { bestSubject, weakSubject, trend } = useMemo(() => {
    let best: { name: string; pct: number } | null = null
    let weak: { name: string; pct: number } | null = null

    if (latestScore?.subject_scores && latestScore?.tests?.subjects) {
      const subs = Array.isArray(latestScore.tests.subjects) ? latestScore.tests.subjects : []
      const metrics: { name: string; pct: number }[] = []

      subs.forEach((sub: any) => {
        const name = typeof sub === 'string' ? sub : sub.name
        const max = typeof sub === 'string' ? 0 : sub.max_marks || (latestScore.tests.max_marks ? latestScore.tests.max_marks / subs.length : 0)
        const score = latestScore.subject_scores[name] ?? 0
        if (max > 0) {
          const pct = Math.round((score / max) * 100)
          metrics.push({ name, pct })
        }
      })

      if (metrics.length > 0) {
        metrics.sort((a, b) => b.pct - a.pct)
        best = metrics[0]
        if (metrics.length > 1) {
          weak = metrics[metrics.length - 1]
        }
      }
    }

    let trajectory = 'consistent'
    if (latestScore && previousScore && !latestScore.is_absent && !previousScore.is_absent) {
      const diff = (latestScore.percentage || 0) - (previousScore.percentage || 0)
      if (diff >= 4) trajectory = 'improving'
      else if (diff <= -4) trajectory = 'needs_focus'
    }

    return { bestSubject: best, weakSubject: weak, trend: trajectory }
  }, [latestScore, previousScore])

  // Construct teacher-to-parent constructive message in EN, MR, HI
  const messages = useMemo(() => {
    const sName = studentName.split(' ')[0] || studentName
    const testName = latestScore?.tests?.test_name || 'the latest test'
    const scoreVal = latestScore?.total ?? 0
    const maxVal = latestScore?.tests?.max_marks || 0
    const rankVal = latestScore?.rank ? `#${latestScore.rank}` : null

    // Helper subject name translations
    const subjectTranslations: Record<string, { mr: string; hi: string }> = {
      physics: { mr: 'भौतिकशास्त्र (Physics)', hi: 'भौतिक विज्ञान (Physics)' },
      chemistry: { mr: 'रसायनशास्त्र (Chemistry)', hi: 'रसायन विज्ञान (Chemistry)' },
      maths: { mr: 'गणित (Mathematics)', hi: 'गणित (Mathematics)' },
      mathematics: { mr: 'गणित (Mathematics)', hi: 'गणित (Mathematics)' },
      biology: { mr: 'जीवशास्त्र (Biology)', hi: 'जीव विज्ञान (Biology)' },
    }

    const formatSubName = (name: string, lang: Language) => {
      const key = name.toLowerCase().trim()
      if (lang === 'mr') return subjectTranslations[key]?.mr || name
      if (lang === 'hi') return subjectTranslations[key]?.hi || name
      return name.charAt(0).toUpperCase() + name.slice(1)
    }

    if (!latestScore) {
      return {
        en: `${sName} is actively attending classroom sessions. Subject-wise performance reviews and faculty feedback will be updated here as upcoming test marks are recorded.`,
        mr: `${sName} नियमितपणे वर्ग तासिकांना उपस्थित राहत आहे. पुढील परीक्षांचे गुण नोंदवले जाताच सविस्तर मूल्यमापन आणि शिक्षकांचे मार्गदर्शन येथे उपलब्ध होईल.`,
        hi: `${sName} नियमित रूप से कक्षाओं में उपस्थित हो रहे हैं। आगामी परीक्षाओं के अंक दर्ज होते ही विस्तृत विषयवार समीक्षा यहाँ उपलब्ध होगी।`
      }
    }

    if (latestScore.is_absent) {
      return {
        en: `${sName} was marked absent for '${testName}'. We encourage parents to help ${sName} review this test paper with faculty during doubt-clearing sessions to catch up on evaluated topics.`,
        mr: `${sName} अलीकडील '${testName}' परीक्षेसाठी अनुपस्थित होता/होती. पालकांनी विद्यार्थ्यांना शिक्षकांसोबत शंका निरसन तासिकेत ही प्रश्नपत्रिका सोडवून घेण्यास मार्गदर्शन करावे.`,
        hi: `${sName} हाल ही में आयोजित '${testName}' परीक्षा में अनुपस्थित रहे। अभिभावकों से अनुरोध है कि वे शंका समाधान सत्र में शिक्षकों से इस प्रश्नपत्र को हल करने के लिए प्रेरित करें।`
      }
    }

    // ── ENGLISH ─────────────────────────────────────────────────────────────
    let enText = `${sName} scored ${scoreVal}/${maxVal}${rankVal ? ` (Rank ${rankVal})` : ''} in ${testName}. `
    if (bestSubject) {
      enText += `Demonstrating strong understanding and confidence in ${formatSubName(bestSubject.name, 'en')} (${bestSubject.pct}%). `
    }
    if (weakSubject && weakSubject.name !== bestSubject?.name) {
      enText += `In ${formatSubName(weakSubject.name, 'en')} (${weakSubject.pct}%), regular daily problem solving and concept revision will help boost overall test marks. `
    }
    if (dailyAttendancePercentage < 75 && totalDays > 0) {
      enText += `Current classroom attendance is ${dailyAttendancePercentage}% — ensuring regular attendance in all upcoming lectures will reinforce exam consistency.`
    } else {
      enText += `Good attendance consistency (${dailyAttendancePercentage}%) is supporting steady academic progress.`
    }

    // ── MARATHI ─────────────────────────────────────────────────────────────
    let mrText = `${sName}ने '${testName}' परीक्षेत ${maxVal} पैकी ${scoreVal} गुण${rankVal ? ` (रँक ${rankVal})` : ''} मिळवले आहेत. `
    if (bestSubject) {
      mrText += `${formatSubName(bestSubject.name, 'mr')} या विषयामध्ये ${bestSubject.pct}% गुणांसह चांगली तयारी व पकड दिसून येत आहे. `
    }
    if (weakSubject && weakSubject.name !== bestSubject?.name) {
      mrText += `${formatSubName(weakSubject.name, 'mr')} (${weakSubject.pct}%) या विषयात अधिक सराव आणि सूत्रे नियमित सोडवण्याची आवश्यकता आहे. `
    }
    if (dailyAttendancePercentage < 75 && totalDays > 0) {
      mrText += `सध्याची उपस्थिती ${dailyAttendancePercentage}% आहे; पुढील सर्व तासिकांमध्ये नियमित उपस्थिती राखल्यास परीक्षेच्या निकालात नक्कीच लक्षणीय वाढ होईल.`
    } else {
      mrText += `उत्तम उपस्थितीमुळे (${dailyAttendancePercentage}%) संकल्पना स्पष्ट होण्यास चांगली मदत होत आहे.`
    }

    // ── HINDI ───────────────────────────────────────────────────────────────
    let hiText = `${sName} ने '${testName}' परीक्षा में ${maxVal} में से ${scoreVal} अंक${rankVal ? ` (रैंक ${rankVal})` : ''} प्राप्त किए हैं। `
    if (bestSubject) {
      hiText += `${formatSubName(bestSubject.name, 'hi')} में ${bestSubject.pct}% अंकों के साथ उत्कृष्ट समझ और आत्मविश्वास दिख रहा है। `
    }
    if (weakSubject && weakSubject.name !== bestSubject?.name) {
      hiText += `${formatSubName(weakSubject.name, 'hi')} (${weakSubject.pct}%) में बेहतर परिणाम के लिए प्रतिदिन नियमित अभ्यास और सूत्रों का रिवीजन आवश्यक है। `
    }
    if (dailyAttendancePercentage < 75 && totalDays > 0) {
      hiText += `वर्तमान में उपस्थिति ${dailyAttendancePercentage}% है; आने वाली सभी कक्षाओं में नियमित उपस्थिति बनाए रखने से प्रदर्शन में निश्चित सुधार होगा।`
    } else {
      hiText += `नियमित उपस्थिति (${dailyAttendancePercentage}%) से विषयों की तैयारी सुचारू रूप से आगे बढ़ रही है।`
    }

    return { en: enText.trim(), mr: mrText.trim(), hi: hiText.trim() }
  }, [studentName, latestScore, bestSubject, weakSubject, dailyAttendancePercentage, totalDays])

  return (
    <div className="relative rounded-3xl overflow-hidden border border-slate-800/80 bg-[#131b2e] shadow-sm">
      {/* Subtle Ambient Glow */}
      <div className="absolute inset-0 rounded-3xl pointer-events-none">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/5 rounded-full blur-[80px]" />
      </div>

      {/* Header with Title and Language Switcher */}
      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-6 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">Coaching Faculty Remarks</h2>
            <p className="text-xs text-slate-400">
              Academic observation &amp; practical advice for parents
            </p>
          </div>
        </div>

        {/* Language Switcher Pills */}
        <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Languages className="w-3.5 h-3.5 text-slate-400 ml-1.5 mr-0.5" />
          <button
            onClick={() => setSelectedLang('en')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLang === 'en'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            English
          </button>
          <button
            onClick={() => setSelectedLang('mr')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLang === 'mr'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            मराठी
          </button>
          <button
            onClick={() => setSelectedLang('hi')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              selectedLang === 'hi'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Message Content */}
      <div className="relative p-6 space-y-4">
        {/* Quote Card */}
        <div className="bg-[#0b0f19] p-4 sm:p-5 rounded-2xl border border-slate-800/80 relative">
          <p className="text-sm sm:text-[15px] text-slate-200 leading-relaxed font-normal">
            "{messages[selectedLang]}"
          </p>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60 text-xs text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Institute Academic Faculty</span>
          </div>
        </div>

        {/* Key Highlights Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Top Subject */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Strongest Subject</p>
              <p className="text-xs font-semibold text-white capitalize mt-0.5">
                {bestSubject ? `${bestSubject.name} (${bestSubject.pct}%)` : 'Evaluating'}
              </p>
            </div>
          </div>

          {/* Recommended Practice */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Practice Focus</p>
              <p className="text-xs font-semibold text-white capitalize mt-0.5">
                {weakSubject ? `${weakSubject.name} (${weakSubject.pct}%)` : 'Balanced'}
              </p>
            </div>
          </div>

          {/* Attendance Standing */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Class Regularity</p>
              <p className="text-xs font-semibold text-white mt-0.5">
                {dailyAttendancePercentage}% · {presentDays}/{totalDays} Classes
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
