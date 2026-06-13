'use client'

import { useState, startTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Users, Upload, Trash2, Loader2, AlertTriangle, ChevronDown, Pencil, Check, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
  created_at: string
  standard?: string
}

interface StudentTableProps {
  students: Student[]
  standard?: string
}

const inputCls =
  'w-full px-2.5 py-1.5 rounded-md bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm'

export default function StudentTable({ students: initialStudents, standard = '11th' }: StudentTableProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [students, setStudents] = useState<Student[]>(initialStudents)

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState<Partial<Student>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Delete state (inside edit panel)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [selectedBatch, setSelectedBatch] = useState<string>('All Batches')
  const batches = Array.from(new Set(students.map((s) => s.batch).filter(Boolean))).sort()

  const filtered = students
    .filter((s) => {
      if (selectedBatch !== 'All Batches' && s.batch !== selectedBatch) return false
      const q = query.toLowerCase().trim()
      if (!q) return true
      return s.name.toLowerCase().includes(q) || s.roll_no.toLowerCase().includes(q)
    })
    .sort((a, b) => a.roll_no.localeCompare(b.roll_no, undefined, { numeric: true, sensitivity: 'base' }))

  const openEdit = (student: Student) => {
    setEditingId(student.id)
    setEditDraft({ name: student.name, roll_no: student.roll_no, batch: student.batch, parent_phone: student.parent_phone })
    setSaveError(null)
    setConfirmDeleteId(null)
  }

  const closeEdit = () => {
    setEditingId(null)
    setEditDraft({})
    setSaveError(null)
    setConfirmDeleteId(null)
  }

  const handleSave = async (student: Student) => {
    setSaving(true)
    setSaveError(null)
    const supabase = createClient()

    const { error } = await supabase
      .from('students')
      .update({
        name: editDraft.name?.trim() || student.name,
        roll_no: editDraft.roll_no?.trim() || student.roll_no,
        batch: editDraft.batch?.trim() || student.batch,
        parent_phone: editDraft.parent_phone?.trim() || student.parent_phone,
      })
      .eq('id', student.id)

    if (error) {
      setSaveError(`Save failed: ${error.message}`)
      setSaving(false)
      return
    }

    setStudents((prev) =>
      prev.map((s) =>
        s.id === student.id
          ? { ...s, ...editDraft, name: editDraft.name ?? s.name, roll_no: editDraft.roll_no ?? s.roll_no, batch: editDraft.batch ?? s.batch, parent_phone: editDraft.parent_phone ?? s.parent_phone }
          : s
      )
    )
    setSaving(false)
    closeEdit()
    startTransition(() => {
      router.refresh()
    })
  }

  const handleDelete = async (student: Student) => {
    setDeletingId(student.id)
    const supabase = createClient()

    const { error } = await supabase.from('students').delete().eq('id', student.id)

    if (error) {
      setSaveError(`Delete failed: ${error.message}`)
      setDeletingId(null)
      return
    }

    setStudents((prev) => prev.filter((s) => s.id !== student.id))
    setDeletingId(null)
    closeEdit()
    startTransition(() => {
      router.refresh()
    })
  }

  return (
    <div>
      {/* Top bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 flex flex-col sm:flex-row gap-3">
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
          <div className="relative">
            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="w-full sm:w-40 pl-3 pr-8 py-2.5 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] transition-all text-sm appearance-none cursor-pointer"
            >
              <option value="All Batches">All Batches</option>
              {batches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)] pointer-events-none" />
          </div>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            id="import-students-btn"
            href={`/dashboard/students/import?std=${standard}`}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--foreground)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all duration-200 whitespace-nowrap"
          >
            <Upload className="w-4 h-4" />
            Import CSV
          </Link>
          <Link
            id="add-student-btn"
            href={`/dashboard/students/new?std=${standard}`}
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
            {query || selectedBatch !== 'All Batches' ? 'No students found' : 'No students added yet'}
          </h3>
          <p className="text-sm text-[var(--muted-foreground)] max-w-xs mb-5">
            {query || selectedBatch !== 'All Batches'
              ? 'Try a different search or batch filter.'
              : 'Add students manually or import a CSV file to get started.'}
          </p>
          {!query && selectedBatch === 'All Batches' && (
            <div className="flex gap-3">
              <Link href={`/dashboard/students/import?std=${standard}`} className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all">
                <Upload className="w-4 h-4" />
                Import CSV
              </Link>
              <Link href={`/dashboard/students/new?std=${standard}`} className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:opacity-90 transition-all">
                <UserPlus className="w-4 h-4" />
                Add Student
              </Link>
            </div>
          )}
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Table header */}
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
              const isEditing = editingId === student.id
              const isDeleting = deletingId === student.id
              const isConfirmingDelete = confirmDeleteId === student.id

              return (
                <div key={student.id}>
                  {/* Main row */}
                  <div
                    className={`grid gap-4 px-5 py-4 items-center transition-colors duration-100 ${
                      isEditing
                        ? 'bg-[oklch(0.62_0.22_265/0.06)]'
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
                      <span className="text-sm text-[var(--muted-foreground)]">{student.batch || '—'}</span>
                    </div>

                    {/* Phone */}
                    <div className="flex items-center">
                      <span className="text-sm text-[var(--muted-foreground)] font-mono">{student.parent_phone || '—'}</span>
                    </div>

                    {/* Edit button */}
                    <div className="flex items-center justify-end">
                      <button
                        id={`edit-student-${student.id}`}
                        onClick={() => isEditing ? closeEdit() : openEdit(student)}
                        title={isEditing ? 'Close edit' : 'Edit student'}
                        className={`p-1.5 rounded-lg transition-all duration-150 ${
                          isEditing
                            ? 'bg-[oklch(0.62_0.22_265/0.15)] text-[var(--primary)]'
                            : 'text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[oklch(0.62_0.22_265/0.1)]'
                        }`}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Inline edit panel */}
                  {isEditing && (
                    <div className="border-t border-[var(--border)] bg-[oklch(0.10_0.01_240/0.4)] px-5 py-4">
                      {saveError && (
                        <div className="flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                          {saveError}
                        </div>
                      )}

                      {/* Editable fields */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)]">Name</label>
                          <input
                            id={`edit-name-${student.id}`}
                            value={editDraft.name ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                            className={inputCls}
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)]">Roll No.</label>
                          <input
                            id={`edit-roll-${student.id}`}
                            value={editDraft.roll_no ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, roll_no: e.target.value }))}
                            className={inputCls}
                            placeholder="e.g. 101"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)]">Batch</label>
                          <input
                            id={`edit-batch-${student.id}`}
                            value={editDraft.batch ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, batch: e.target.value }))}
                            className={inputCls}
                            placeholder="e.g. JEE"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-[var(--muted-foreground)]">Parent Phone</label>
                          <input
                            id={`edit-phone-${student.id}`}
                            value={editDraft.parent_phone ?? ''}
                            onChange={(e) => setEditDraft((d) => ({ ...d, parent_phone: e.target.value }))}
                            className={inputCls}
                            placeholder="10-digit number"
                          />
                        </div>
                      </div>

                      {/* Action row */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        {/* Save / Cancel */}
                        <div className="flex items-center gap-2">
                          <button
                            id={`save-student-${student.id}`}
                            onClick={() => handleSave(student)}
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 disabled:opacity-60 transition-all glow-primary"
                          >
                            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            Save Changes
                          </button>
                          <button
                            onClick={closeEdit}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-[var(--border)] text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
                          >
                            <X className="w-3.5 h-3.5" />
                            Cancel
                          </button>
                        </div>

                        {/* Danger zone — delete */}
                        <div className="flex items-center gap-2">
                          {isDeleting ? (
                            <Loader2 className="w-4 h-4 animate-spin text-red-400" />
                          ) : isConfirmingDelete ? (
                            <>
                              <span className="text-xs text-red-400 flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Are you sure?
                              </span>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-all"
                              >
                                No
                              </button>
                              <button
                                id={`confirm-delete-${student.id}`}
                                onClick={() => handleDelete(student)}
                                className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                              >
                                Yes, Delete
                              </button>
                            </>
                          ) : (
                            <button
                              id={`delete-student-${student.id}`}
                              onClick={() => setConfirmDeleteId(student.id)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 text-xs font-medium rounded-lg hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete Student
                            </button>
                          )}
                        </div>
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
              {selectedBatch !== 'All Batches' && ` in ${selectedBatch}`}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
