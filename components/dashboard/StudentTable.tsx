'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Users, Upload, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export default function StudentTable({ students: initialStudents }: StudentTableProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const filtered = students
    .filter((s) => {
      const q = query.toLowerCase().trim()
      if (!q) return true
      return (
        s.name.toLowerCase().includes(q) ||
        s.roll_no.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => a.roll_no.localeCompare(b.roll_no, undefined, { numeric: true, sensitivity: 'base' }))

  const handleDeleteConfirm = async (student: Student) => {
    setDeletingId(student.id)
    setDeleteError(null)
    const supabase = createClient()

    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', student.id)

    if (error) {
      setDeleteError(`Failed to delete ${student.name}: ${error.message}`)
      setDeletingId(null)
      setConfirmId(null)
      return
    }

    // Optimistic remove from local state
    setStudents((prev) => prev.filter((s) => s.id !== student.id))
    setDeletingId(null)
    setConfirmId(null)
    router.refresh()
  }

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

      {/* Global delete error */}
      {deleteError && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {deleteError}
        </div>
      )}

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
          {/* Table header — 5 cols */}
          <div
            className="grid gap-4 px-5 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)]"
            style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 80px' }}
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Roll No.</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Name</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Batch</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Parent Phone</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Actions</span>
          </div>

          {/* Table rows */}
          <div className="divide-y divide-[var(--border)]">
            {filtered.map((student, idx) => {
              const isConfirming = confirmId === student.id
              const isDeleting = deletingId === student.id

              return (
                <div key={student.id}>
                  {/* Main row */}
                  <div
                    className={`grid gap-4 px-5 py-4 items-center transition-colors duration-100 ${
                      isConfirming
                        ? 'bg-red-500/5'
                        : idx % 2 !== 0
                        ? 'bg-[oklch(0.10_0.01_240/0.3)] hover:bg-[oklch(0.62_0.22_265/0.04)]'
                        : 'hover:bg-[oklch(0.62_0.22_265/0.04)]'
                    }`}
                    style={{ gridTemplateColumns: '1fr 1.5fr 1fr 1fr 80px' }}
                  >
                    {/* Roll No */}
                    <div className="flex items-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[oklch(0.62_0.22_265/0.1)] text-[var(--primary)] text-xs font-mono font-medium">
                        {student.roll_no}
                      </span>
                    </div>

                    {/* Name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[oklch(0.62_0.22_265/0.15)] flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-[var(--primary)]">
                          {student.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="text-sm font-medium truncate">{student.name}</span>
                    </div>

                    {/* Batch */}
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)]">
                        {student.batch || '—'}
                      </span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">
                        {student.parent_phone || '—'}
                      </span>
                    </div>

                    {/* Delete button */}
                    <div className="flex items-center justify-end">
                      {isDeleting ? (
                        <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                      ) : (
                        <button
                          id={`delete-student-${student.id}`}
                          onClick={() => {
                            setDeleteError(null)
                            setConfirmId(isConfirming ? null : student.id)
                          }}
                          title="Delete student"
                          className={`p-1.5 rounded-lg transition-all duration-150 ${
                            isConfirming
                              ? 'bg-red-500/15 text-red-400'
                              : 'text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10'
                          }`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline confirm strip */}
                  {isConfirming && !isDeleting && (
                    <div className="px-5 py-3 bg-red-500/5 border-t border-red-500/10 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2 text-sm text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                        <span>
                          Delete <strong>{student.name}</strong> (Roll {student.roll_no})? This cannot be undone.
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setConfirmId(null)}
                          className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          id={`confirm-delete-${student.id}`}
                          onClick={() => handleDeleteConfirm(student)}
                          className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                        >
                          Yes, Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
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
