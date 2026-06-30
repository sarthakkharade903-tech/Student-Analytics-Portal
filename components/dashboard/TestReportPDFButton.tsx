'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { normaliseSubjects } from '@/lib/subjects'

interface ScoreRecord {
  id: string
  rank: number
  total: number
  percentage: number
  subject_scores: Record<string, number>
  is_absent: boolean
  student: { id: string; name: string; roll_no: string } | null
}

interface TestReportPDFButtonProps {
  testName: string
  testDate: string
  standard: string
  maxMarks: number
  coachingName: string
  subjects: { name: string; max_marks: number }[]
  scores: ScoreRecord[]
  studentsAppeared: number | null
  highestScore: number | null
  averageScore: number | null
  targetBatches?: string[]
}

export default function TestReportPDFButton({
  testName,
  testDate,
  standard,
  maxMarks,
  coachingName,
  subjects,
  scores,
  studentsAppeared,
  highestScore,
  averageScore,
  targetBatches = [],
}: TestReportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      const jsPDF   = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      const doc   = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()

      // ── Header bar ─────────────────────────────────────────────────────────
      const NAVY: [number, number, number] = [15, 23, 42]
      doc.setFillColor(...NAVY)
      doc.rect(0, 0, pageW, 30, 'F')

      // Left: institute name + subtitle
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(coachingName.toUpperCase(), 14, 12)

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      doc.text('Official Result Report', 14, 20)

      // Right: test name (20% bigger than before = was 10, now 12) + date/class
      const formattedDate = new Date(testDate + 'T12:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric',
      })
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)  // +20% from 10→12, rounded up to 14 for clear visibility
      doc.text(testName, pageW - 14, 12, { align: 'right' })

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(148, 163, 184)
      const batchStr = targetBatches.length > 0 ? `  |  ${targetBatches.join(', ')}` : ''
      doc.text(`${formattedDate}  |  Class ${standard}${batchStr}`, pageW - 14, 20, { align: 'right' })

      // ── Summary row ────────────────────────────────────────────────────────
      const presentStudents = scores.filter(s => !s.is_absent).length
      const summaryY = 38

      const summaryItems = [
        {
          label: 'Maximum Marks',
          value: String(maxMarks),
        },
        {
          label: 'Students Appeared',
          // Use scores.length as total — every student in the test has a score row
          value: `${presentStudents} / ${scores.length}`,
        },
        {
          label: 'Highest Score',
          value: highestScore != null ? `${highestScore} / ${maxMarks}` : '—',
        },
        {
          label: 'Average Score',
          value: averageScore != null ? `${Number(averageScore).toFixed(1)} / ${maxMarks}` : '—',
        },
      ]

      const boxW = (pageW - 28) / summaryItems.length
      summaryItems.forEach((item, i) => {
        const x = 14 + i * boxW
        doc.setFillColor(241, 245, 249)
        doc.roundedRect(x, summaryY - 5, boxW - 3, 13, 2, 2, 'F')
        doc.setTextColor(100, 116, 139)
        doc.setFontSize(7.5)
        doc.setFont('helvetica', 'normal')
        doc.text(item.label, x + (boxW - 3) / 2, summaryY + 0.5, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(10)
        doc.text(item.value, x + (boxW - 3) / 2, summaryY + 6, { align: 'center' })
      })

      // ── Table ──────────────────────────────────────────────────────────────
      const normSubjects = normaliseSubjects(subjects as any)

      // Subject column headers: "Physics\n/100" style
      const subjectHeaders = normSubjects.map(s => ({
        header: `${s.name.charAt(0).toUpperCase() + s.name.slice(1).toLowerCase()}\n/${s.max_marks}`,
        dataKey: `sub_${s.name}`,
      }))

      // No Status column — absent is already obvious from red AB cells
      const columns = [
        { header: 'Rank',         dataKey: 'rank' },
        { header: 'Roll No',      dataKey: 'roll_no' },
        { header: 'Student Name', dataKey: 'name' },
        ...subjectHeaders,
        { header: `Total\n/${maxMarks}`, dataKey: 'total' },
        { header: 'Percentile\n(PR)',    dataKey: 'percentile' },
      ]

      // ── Percentile fix ─────────────────────────────────────────────────────
      // Formula: PR = ((n - rank + 1) / n) * 100
      // This correctly gives 100 PR to rank 1 (the topper), matching the parent portal.
      const n = presentStudents  // only present students counted for percentile

      const rows = scores.map(s => {
        const studentName = s.student?.name ?? '—'
        const rollNo      = s.student?.roll_no ?? '—'

        let pr = '—'
        if (!s.is_absent && n >= 1) {
          // Standard formula: topper always gets 100, matching parent portal
          const prVal = ((n - s.rank + 1) / n) * 100
          pr = Math.min(100, prVal).toFixed(2)  // 2 decimals e.g. 88.89
        }

        const row: Record<string, string | number> = {
          rank:       s.is_absent ? '—' : s.rank,
          roll_no:    rollNo,
          name:       studentName,
          total:      s.is_absent ? 'AB' : s.total,
          percentile: s.is_absent ? 'AB' : pr,
        }

        normSubjects.forEach(sub => {
          row[`sub_${sub.name}`] = s.is_absent
            ? 'AB'
            : (s.subject_scores?.[sub.name] ?? '—')
        })

        return row
      })

      // Name column index (after rank + rollno = index 2) stays wider
      // +1 for each subject, then total + percentile = last two
      const nameColIdx  = 2
      const totalColIdx = 2 + normSubjects.length + 1  // 0-indexed from the columns array

      const colStyles: Record<number, object> = {
        [nameColIdx]: { halign: 'left', cellWidth: 48 },
      }

      autoTable(doc, {
        startY: summaryY + 14,
        head: [columns.map(c => c.header)],
        body: rows.map(r => columns.map(c => r[c.dataKey] ?? '—')),
        theme: 'grid',
        headStyles: {
          fillColor: NAVY,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
          lineColor: [30, 40, 60],
          lineWidth: 0.3,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          halign: 'center',
          cellPadding: { top: 2.5, bottom: 2.5, left: 2, right: 2 },
        },
        columnStyles: colStyles,
        // No alternateRowStyles — we use didParseCell for more control
        didParseCell: (data) => {
          if (data.section !== 'body') return
          const rankVal = rows[data.row.index]?.rank

          // Top 3: subtle background only, dark text — no colored text to avoid looking like errors
          if (rankVal === 1) {
            data.cell.styles.fillColor = [255, 249, 219]  // very light gold tint
            data.cell.styles.textColor = [15, 23, 42]     // same dark navy as rest
            data.cell.styles.fontStyle = 'bold'
          } else if (rankVal === 2) {
            data.cell.styles.fillColor = [244, 246, 250]  // very light silver-blue
            data.cell.styles.textColor = [15, 23, 42]
            data.cell.styles.fontStyle = 'bold'
          } else if (rankVal === 3) {
            data.cell.styles.fillColor = [255, 245, 235]  // very light peach/bronze
            data.cell.styles.textColor = [15, 23, 42]
            data.cell.styles.fontStyle = 'bold'
          } else if (data.row.index % 2 === 0) {
            data.cell.styles.fillColor = [255, 255, 255]
          } else {
            data.cell.styles.fillColor = [248, 250, 252]
          }

          // AB cells override row color → light red
          if (data.cell.text[0] === 'AB') {
            data.cell.styles.textColor  = [185, 28, 28]
            data.cell.styles.fillColor  = [254, 226, 226]
            data.cell.styles.fontStyle  = 'bold'
          }
        },
        margin: { left: 14, right: 14 },
      })

      // ── Footer on every page ───────────────────────────────────────────────
      const pageCount = (doc.internal as any).getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        const pageH = doc.internal.pageSize.getHeight()
        doc.setDrawColor(226, 232, 240)
        doc.line(14, pageH - 10, pageW - 14, pageH - 10)
        doc.setFontSize(7)
        doc.setTextColor(148, 163, 184)
        doc.setFont('helvetica', 'normal')
        doc.text(
          `Generated by StudentIQ  |  ${coachingName}  |  ${new Date().toLocaleString('en-IN')}`,
          pageW / 2,
          pageH - 5,
          { align: 'center' }
        )
        doc.text(`Page ${i} of ${pageCount}`, pageW - 14, pageH - 5, { align: 'right' })
      }

      // ── Save ───────────────────────────────────────────────────────────────
      const safeName = testName.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '')
      const safeDate = testDate.replace(/-/g, '')
      doc.save(`${safeName}_${safeDate}_Result.pdf`)

    } catch (err) {
      console.error('PDF generation failed', err)
      alert('PDF generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading || scores.length === 0}
      className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-sm font-semibold rounded-lg border border-slate-600 hover:border-slate-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      title="Download Official Result Report as PDF"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
      ) : (
        <><Download className="w-4 h-4" /> Download PDF</>
      )}
    </button>
  )
}
