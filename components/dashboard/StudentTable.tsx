'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search, UserPlus, Users, Upload } from 'lucide-react'

interface Student {
  id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
  created_at: string
}

interface StudentTableProps {
  students: Student[]
}

export default function StudentTable({ students }: StudentTableProps) {
  const [query, setQuery] = useState('')

  const filtered = students.filter((s) => {
    const q = query.toLowerCase().trim()
    if (!q) return true
    return (
      s.name.toLowerCase().includes(q) ||
      s.roll_no.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      {/* Top bar: Search + Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          <input
            id="student-search"
            type="text"
            placeholder="Search by name or roll number…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm"
          />
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            id="import-students-btn"
            href="/dashboard/students/import"
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--foreground)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all duration-200 whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Link>
          <Link
            id="add-student-btn"
            href="/dashboard/students/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all duration-200 glow-primary whitespace-nowrap"
          >
            <UserPlus className="w-4 h-4" />
            Add Student
          </Link>
        </div>
      </div>

      {/* Table / Empty State */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl py-20 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-[oklch(0.62_0.22_265/0.1)] flex items-center justify-center mb-4">
            <Users className="w-7 h-7 text-[var(--muted-foreground)]" />
          </div>
          <h3 className="font-semibold mb-1">
            {query ? 'No students found' : 'No students added yet'}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-5">
            {query
              ? `No results for "${query}". Try a different name or roll number.`
              : 'Add students manually or import a CSV file to get started.'}
          </p>
          {!query && (
            <div className="flex gap-3">
              <Link
                href="/dashboard/students/import"
                className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </Link>
              <Link
                href="/dashboard/students/new"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Add Student
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-4 px-5 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)]">
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Roll No.</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Name</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Batch</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Parent Phone</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((student, idx) => (
              <div
                key={student.id}
                className={`grid grid-cols-4 gap-4 px-5 py-4 hover:bg-[oklch(0.62_0.22_265/0.04)] transition-colors duration-100 ${
                  idx % 2 === 0 ? '' : 'bg-[oklch(0.10_0.01_240/0.3)]'
                }`}
              >
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[oklch(0.62_0.22_265/0.1)] text-[var(--primary)] text-xs font-mono font-medium">
                    {student.roll_no}
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-[var(--primary)]">
                        {student.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium truncate">{student.name}</span>
                  </div>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-[var(--muted-foreground)]">
                    {student.batch || '—'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm text-[var(--muted-foreground)] font-mono">
                    {student.parent_phone || '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Footer count */}
          <div className="px-5 py-3 border-t border-[var(--border)] bg-[oklch(0.10_0.01_240/0.3)]">
            <span className="text-xs text-[var(--muted-foreground)]">
              {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''}
              {query && ` matching "${query}"`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
