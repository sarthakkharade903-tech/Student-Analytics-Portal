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
}: TestReportPDFButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleDownload = async () => {
    setLoading(true)
    try {
      // Dynamic import — jspdf is large, only load when user clicks
      const jsPDF = (await import('jspdf')).default
      const autoTable = (await import('jspdf-autotable')).default

      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()

      // ── Header ────────────────────────────────────────────────────────────
      doc.setFillColor(15, 23, 42) // dark navy
      doc.rect(0, 0, pageW, 28, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text(coachingName.toUpperCase(), 14, 11)

      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 210)
      doc.text('Test Result — Master Rank List', 14, 18)

      // Test name + date on right
      const formattedDate = new Date(testDate + 'T12:00:00').toLocaleDateString('en-IN', {
        day: 'numeric', month: 'long', year: 'numeric'
      })
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(10)
      doc.text(testName, pageW - 14, 11, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(180, 190, 210)
      doc.text(`${formattedDate}  |  Class ${standard}`, pageW - 14, 18, { align: 'right' })

      // ── Summary Row ───────────────────────────────────────────────────────
      const summaryY = 34
      doc.setFontSize(8)
      const summaryItems = [
        { label: 'Max Marks', value: String(maxMarks) },
        { label: 'Students Appeared', value: studentsAppeared != null ? String(studentsAppeared) : '—' },
        { label: 'Highest Score', value: highestScore != null ? String(highestScore) : '—' },
        { label: 'Average Score', value: averageScore != null ? Number(averageScore).toFixed(1) : '—' },
      ]
      const boxW = (pageW - 28) / summaryItems.length
      summaryItems.forEach((item, i) => {
        const x = 14 + i * boxW
        doc.setFillColor(241, 245, 249)
        doc.roundedRect(x, summaryY - 5, boxW - 3, 12, 2, 2, 'F')
        doc.setTextColor(100, 116, 139)
        doc.setFont('helvetica', 'normal')
        doc.text(item.label, x + (boxW - 3) / 2, summaryY + 0.5, { align: 'center' })
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(15, 23, 42)
        doc.setFontSize(10)
        doc.text(item.value, x + (boxW - 3) / 2, summaryY + 5.5, { align: 'center' })
        doc.setFontSize(8)
      })

      // ── Table ──────────────────────────────────────────────────────────────
      // Build dynamic subject columns
      const normSubjects = normaliseSubjects(subjects as any)
      const subjectHeaders = normSubjects.map(s => ({
        header: `${s.name.toUpperCase()}\n(${s.max_marks})`,
        dataKey: `sub_${s.name}`,
      }))

      const columns = [
        { header: 'Rank', dataKey: 'rank' },
        { header: 'Roll No', dataKey: 'roll_no' },
        { header: 'Student Name', dataKey: 'name' },
        ...subjectHeaders,
        { header: `Total\n(${maxMarks})`, dataKey: 'total' },
        { header: 'Percentile\n(PR)', dataKey: 'percentile' },
        { header: 'Status', dataKey: 'status' },
      ]

      // Compute percentile ranks
      const presentScores = scores.filter(s => !s.is_absent)
      const n = presentScores.length

      const rows = scores.map(s => {
        const studentName = s.student?.name ?? '—'
        const rollNo = s.student?.roll_no ?? '—'

        // PR = (number of students scoring strictly below this student / n) * 100
        let pr = '—'
        if (!s.is_absent && n > 1) {
          const below = presentScores.filter(o => o.total < s.total).length
          pr = ((below / n) * 100).toFixed(0)
        }

        const row: Record<string, string | number> = {
          rank: s.is_absent ? '—' : s.rank,
          roll_no: rollNo,
          name: studentName,
          total: s.is_absent ? 'AB' : s.total,
          percentile: s.is_absent ? 'AB' : pr,
          status: s.is_absent ? 'Absent' : 'Present',
        }

        normSubjects.forEach(sub => {
          row[`sub_${sub.name}`] = s.is_absent ? 'AB' : (s.subject_scores?.[sub.name] ?? '—')
        })

        return row
      })

      autoTable(doc, {
        startY: summaryY + 12,
        head: [columns.map(c => c.header)],
        body: rows.map(r => columns.map(c => r[c.dataKey] ?? '—')),
        theme: 'grid',
        headStyles: {
          fillColor: [15, 23, 42],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 7.5,
          halign: 'center',
          cellPadding: { top: 3, bottom: 3, left: 2, right: 2 },
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59],
          halign: 'center',
        },
        columnStyles: {
          // Name column — left align and wider
          2: { halign: 'left', cellWidth: 40 },
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252],
        },
        didParseCell: (data) => {
          // Highlight absent cells in soft red
          if (data.cell.text[0] === 'AB') {
            data.cell.styles.textColor = [185, 28, 28]
            data.cell.styles.fillColor = [254, 242, 242]
          }
          // Gold for rank 1
          if (data.column.index === 0 && data.cell.text[0] === '1') {
            data.cell.styles.textColor = [161, 98, 7]
            data.cell.styles.fontStyle = 'bold'
          }
        },
        margin: { left: 14, right: 14 },
      })

      // ── Footer ─────────────────────────────────────────────────────────────
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
      // Filename: TestName_TestDate_Result.pdf (no spaces)
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
      title="Download Master Rank List as PDF"
    >
      {loading ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
      ) : (
        <><Download className="w-4 h-4" /> Download PDF</>
      )}
    </button>
  )
}
