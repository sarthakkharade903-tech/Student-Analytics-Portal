'use client'

import { useState, useEffect, startTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, UserPlus, Users, Upload, Trash2, Loader2, AlertTriangle, ChevronDown, Pencil, Check, X, RefreshCw, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Student {
  id: string
  name: string
  roll_no: string
  batch: string
  parent_phone: string
  created_at: string
  standard?: string
  pin?: string
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

  // Batch editing state
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isBatchEditing, setIsBatchEditing] = useState(false)
  const [batchDraft, setBatchDraft] = useState('')
  const [batchSaving, setBatchSaving] = useState(false)
  const [batchSaveError, setBatchSaveError] = useState<string | null>(null)

  // Advanced Actions State
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [advancedAction, setAdvancedAction] = useState<'none' | 'rename_batch' | 'delete_rolls' | 'delete_all'>('none')
  const [renameTargetBatch, setRenameTargetBatch] = useState('')
  const [renameNewBatch, setRenameNewBatch] = useState('')
  const [rollNumbersText, setRollNumbersText] = useState('')
  const [deleteAllConfirm, setDeleteAllConfirm] = useState('')
  const [advancedLoading, setAdvancedLoading] = useState(false)
  const [advancedError, setAdvancedError] = useState<string | null>(null)

  // Bug fix: sync internal state whenever parent passes fresh data (e.g. after 11th/12th toggle)
  // Without this, the table is frozen at the first render's data forever.
  useEffect(() => {
    setStudents(initialStudents)
    // Also reset search/filter so user doesn't see stale filtered results
    setQuery('')
    setSelectedBatch('All Batches')
    setEditingId(null)
    setConfirmDeleteId(null)
    setSelectedIds([])
    setIsBatchEditing(false)
    setShowAdvanced(false)
    setAdvancedAction('none')
    setRenameTargetBatch('')
    setRenameNewBatch('')
    setRollNumbersText('')
    setDeleteAllConfirm('')
  }, [initialStudents])


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

  const allSelected = filtered.length > 0 && selectedIds.length === filtered.length
  
  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(s => s.id))
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  const handleRenameBatchGlobal = async () => {
    if (!renameTargetBatch || !renameNewBatch.trim()) return
    setAdvancedLoading(true)
    setAdvancedError(null)
    const supabase = createClient()
    const targetIds = students.filter(s => s.batch === renameTargetBatch).map(s => s.id)
    
    if (targetIds.length === 0) {
      setAdvancedError("No students found in that batch.")
      setAdvancedLoading(false)
      return
    }

    const { error } = await supabase
      .from('students')
      .update({ batch: renameNewBatch.trim() })
      .in('id', targetIds)
      
    if (error) {
       setAdvancedError(error.message)
       setAdvancedLoading(false)
       return
    }
    setStudents(prev => prev.map(s => s.batch === renameTargetBatch ? { ...s, batch: renameNewBatch.trim() } : s))
    setAdvancedAction('none')
    setAdvancedLoading(false)
    setRenameNewBatch('')
    setRenameTargetBatch('')
    startTransition(() => router.refresh())
  }

  const handleDeleteByRolls = async () => {
    if (!rollNumbersText.trim()) return
    setAdvancedLoading(true)
    setAdvancedError(null)
    const rolls = rollNumbersText.split(/[\n,]+/).map(r => r.trim()).filter(Boolean)
    const idsToDelete = students.filter(s => rolls.includes(s.roll_no)).map(s => s.id)
    
    if (idsToDelete.length === 0) {
      setAdvancedError("No matching students found with those roll numbers.")
      setAdvancedLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('students').delete().in('id', idsToDelete)
    
    if (error) {
       setAdvancedError(error.message)
       setAdvancedLoading(false)
       return
    }
    setStudents(prev => prev.filter(s => !idsToDelete.includes(s.id)))
    setAdvancedAction('none')
    setAdvancedLoading(false)
    setRollNumbersText('')
    setSelectedIds([])
    startTransition(() => router.refresh())
  }

  const handleDeleteAll = async () => {
    if (deleteAllConfirm !== 'DELETE') return
    setAdvancedLoading(true)
    setAdvancedError(null)
    const idsToDelete = students.map(s => s.id)
    
    if (idsToDelete.length === 0) {
      setAdvancedLoading(false)
      setAdvancedAction('none')
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('students').delete().in('id', idsToDelete)
    
    if (error) {
       setAdvancedError(error.message)
       setAdvancedLoading(false)
       return
    }
    setStudents([])
    setAdvancedAction('none')
    setAdvancedLoading(false)
    setDeleteAllConfirm('')
    setSelectedIds([])
    startTransition(() => router.refresh())
  }

  const handleBatchSave = async () => {
    if (!batchDraft.trim() || selectedIds.length === 0) return
    setBatchSaving(true)
    setBatchSaveError(null)
    const supabase = createClient()

    const { error } = await supabase
      .from('students')
      .update({ batch: batchDraft.trim() })
      .in('id', selectedIds)

    if (error) {
      setBatchSaveError(`Batch update failed: ${error.message}`)
      setBatchSaving(false)
      return
    }

    setStudents(prev => prev.map(s => selectedIds.includes(s.id) ? { ...s, batch: batchDraft.trim() } : s))
    setBatchSaving(false)
    setIsBatchEditing(false)
    setSelectedIds([])
    setBatchDraft('')
    startTransition(() => {
      router.refresh()
    })
  }

  const openEdit = (student: Student) => {
    setEditingId(student.id)
    setEditDraft({ name: student.name, roll_no: student.roll_no, batch: student.batch, parent_phone: student.parent_phone, pin: student.pin })
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
        pin: editDraft.pin?.trim() || student.pin,
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
          ? { ...s, ...editDraft, name: editDraft.name ?? s.name, roll_no: editDraft.roll_no ?? s.roll_no, batch: editDraft.batch ?? s.batch, parent_phone: editDraft.parent_phone ?? s.parent_phone, pin: editDraft.pin ?? s.pin }
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
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`inline-flex items-center gap-2 px-4 py-2.5 border text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
              showAdvanced ? 'bg-[var(--primary)] text-white border-[var(--primary)] glow-primary' : 'border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--secondary)]'
            }`}
          >
            {showAdvanced ? <X className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Advanced Actions
          </button>
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

      {/* Advanced Actions Panel */}
      {showAdvanced && (
        <div className="glass-card rounded-2xl p-5 mb-6 border border-[var(--border)] bg-[oklch(0.10_0.01_240/0.4)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Advanced Actions for {standard} Standard
            </h3>
          </div>
          
          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={() => { setAdvancedAction('rename_batch'); setAdvancedError(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${advancedAction === 'rename_batch' ? 'bg-[var(--primary)] text-white border-[var(--primary)]' : 'border-[var(--border)] hover:bg-[var(--secondary)]'}`}
            >
              Rename a Batch
            </button>
            <button
              onClick={() => { setAdvancedAction('delete_rolls'); setAdvancedError(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${advancedAction === 'delete_rolls' ? 'bg-red-500 text-white border-red-500' : 'border-[var(--border)] hover:bg-[var(--secondary)] hover:text-red-400'}`}
            >
              Delete by Roll Numbers
            </button>
            <button
              onClick={() => { setAdvancedAction('delete_all'); setAdvancedError(null); }}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all ${advancedAction === 'delete_all' ? 'bg-red-600 text-white border-red-600 shadow-[0_0_15px_rgba(220,38,38,0.3)]' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}
            >
              Delete All Students
            </button>
          </div>

          {advancedError && (
            <div className="mb-4 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 flex items-center gap-2">
               <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
               {advancedError}
            </div>
          )}

          {advancedAction === 'rename_batch' && (
            <div className="bg-[var(--background)]/50 rounded-xl p-4 border border-[var(--border)] animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-medium mb-3">Rename Entire Batch</h4>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <label className="text-xs text-[var(--muted-foreground)]">Select Target Batch</label>
                  <select
                    value={renameTargetBatch}
                    onChange={(e) => setRenameTargetBatch(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)] text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled>Select a batch...</option>
                    {batches.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <label className="text-xs text-[var(--muted-foreground)]">New Batch Name</label>
                  <input
                    value={renameNewBatch}
                    onChange={(e) => setRenameNewBatch(e.target.value)}
                    placeholder="e.g. JEE Advance"
                    className={inputCls}
                  />
                </div>
                <button
                  onClick={handleRenameBatchGlobal}
                  disabled={advancedLoading || !renameTargetBatch || !renameNewBatch.trim()}
                  className="px-5 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 h-[38px] flex items-center gap-2"
                >
                  {advancedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Rename Batch
                </button>
              </div>
            </div>
          )}

          {advancedAction === 'delete_rolls' && (
            <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/20 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-medium mb-3 text-red-400">Delete Students by Roll Numbers</h4>
              <p className="text-xs text-[var(--muted-foreground)] mb-3">Enter roll numbers separated by commas or newlines.</p>
              <textarea
                value={rollNumbersText}
                onChange={(e) => setRollNumbersText(e.target.value)}
                placeholder="101, 102, 103&#10;104"
                className="w-full h-24 px-3 py-2 rounded-lg bg-[var(--input)] border border-[var(--border)] text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500/50 text-sm resize-none mb-3"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleDeleteByRolls}
                  disabled={advancedLoading || !rollNumbersText.trim()}
                  className="px-5 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {advancedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Delete Matching Students
                </button>
              </div>
            </div>
          )}

          {advancedAction === 'delete_all' && (
            <div className="bg-red-500/5 rounded-xl p-4 border border-red-500/30 animate-in fade-in slide-in-from-top-2">
              <h4 className="text-sm font-bold mb-2 text-red-500">DANGER ZONE: Delete All Students</h4>
              <p className="text-xs text-[var(--muted-foreground)] mb-4">
                This will permanently delete ALL {students.length} students currently displayed in the {standard} standard. This action cannot be undone.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 items-end">
                <div className="space-y-1.5 flex-1 max-w-xs">
                  <label className="text-xs font-semibold text-red-400 uppercase">Type "DELETE" to confirm</label>
                  <input
                    value={deleteAllConfirm}
                    onChange={(e) => setDeleteAllConfirm(e.target.value)}
                    placeholder="DELETE"
                    className="w-full px-3 py-2 rounded-lg bg-[var(--input)] border border-red-500/50 text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-red-500 text-sm font-mono uppercase"
                  />
                </div>
                <button
                  onClick={handleDeleteAll}
                  disabled={advancedLoading || deleteAllConfirm !== 'DELETE'}
                  className="px-5 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 h-[38px] flex items-center gap-2 shadow-[0_0_15px_rgba(220,38,38,0.4)]"
                >
                  {advancedLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  Permanently Delete All
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Edit Bar */}
      {selectedIds.length > 0 && !isBatchEditing && (
        <div className="glass-card rounded-xl px-4 py-3 mb-4 flex items-center justify-between border border-[var(--primary)] bg-[oklch(0.62_0.22_265/0.05)]">
          <span className="text-sm font-medium text-[var(--foreground)]">
            {selectedIds.length} student{selectedIds.length !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setIsBatchEditing(true); setBatchSaveError(null); setBatchDraft(''); }}
              className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-all glow-primary"
            >
              Edit Batches
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 border border-[var(--border)] text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {isBatchEditing && (
        <div className="glass-card rounded-xl px-5 py-5 mb-4 border border-[var(--primary)] bg-[oklch(0.62_0.22_265/0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold">Batch Update Batch for {selectedIds.length} Students</h3>
            <button
              onClick={() => setIsBatchEditing(false)}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {batchSaveError && (
             <div className="mb-4 flex items-center gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
               <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
               {batchSaveError}
             </div>
          )}
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-1.5 flex-1 min-w-[200px] max-w-sm">
              <label className="text-xs font-medium text-[var(--muted-foreground)]">New Batch Name</label>
              <input
                value={batchDraft}
                onChange={e => setBatchDraft(e.target.value)}
                placeholder="e.g. JEE Advance"
                className={inputCls}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleBatchSave}
                disabled={batchSaving || !batchDraft.trim()}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] text-white text-sm font-semibold rounded-lg hover:opacity-90 transition-all disabled:opacity-50 glow-primary"
              >
                {batchSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                Apply to All
              </button>
              <button
                onClick={() => setIsBatchEditing(false)}
                className="px-4 py-2 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-[var(--secondary)] transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

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
            className="grid gap-4 px-5 py-3 border-b border-[var(--border)] bg-[oklch(0.10_0.01_240/0.5)] items-center"
            style={{ gridTemplateColumns: '40px 1fr 1.5fr 1fr 1fr 90px 80px' }}
          >
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border border-[var(--border)] bg-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-2 cursor-pointer appearance-none checked:bg-[var(--primary)] checked:border-[var(--primary)] relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[1px] after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
              />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Roll No.</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Name</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Batch</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">Parent Phone</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted-foreground)]">PIN</span>
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
                      isEditing || selectedIds.includes(student.id)
                        ? 'bg-[oklch(0.62_0.22_265/0.06)]'
                        : idx % 2 !== 0
                        ? 'bg-[oklch(0.10_0.01_240/0.3)] hover:bg-[oklch(0.62_0.22_265/0.04)]'
                        : 'hover:bg-[oklch(0.62_0.22_265/0.04)]'
                    }`}
                    style={{ gridTemplateColumns: '40px 1fr 1.5fr 1fr 1fr 90px 80px' }}
                  >
                    {/* Checkbox */}
                    <div className="flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="w-4 h-4 rounded border border-[var(--border)] bg-[var(--input)] text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-2 cursor-pointer appearance-none checked:bg-[var(--primary)] checked:border-[var(--primary)] relative after:content-[''] after:absolute after:hidden checked:after:block after:left-[5px] after:top-[1px] after:w-[4px] after:h-[8px] after:border-r-2 after:border-b-2 after:border-white after:rotate-45"
                      />
                    </div>

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

                    {/* PIN */}
                    <div className="flex items-center">
                      {student.pin ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs font-mono font-bold tracking-widest select-all shadow-sm">
                          🔑 {student.pin}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--muted-foreground)] italic">—</span>
                      )}
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

                      {/* Parent Login Credentials */}
                      <div className="mb-5 bg-[var(--background)]/40 rounded-xl p-4 border border-[var(--border)]">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[var(--primary)]" />
                          Parent Login Credentials
                        </h4>
                        <div className="flex flex-col sm:flex-row gap-4 items-end">
                          <div className="space-y-1 flex-1">
                            <label className="text-xs font-medium text-[var(--muted-foreground)]">Registered Phone</label>
                            <input
                              value={editDraft.parent_phone || student.parent_phone || ''}
                              disabled
                              className={`${inputCls} opacity-70 bg-[var(--secondary)] cursor-not-allowed`}
                            />
                          </div>
                          <div className="space-y-1 flex-1">
                            <label className="text-xs font-medium text-[var(--muted-foreground)]">4-Digit PIN</label>
                            <div className="flex gap-2">
                              <input
                                id={`edit-pin-${student.id}`}
                                value={editDraft.pin ?? ''}
                                onChange={(e) => setEditDraft((d) => ({ ...d, pin: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                                className={`${inputCls} font-mono`}
                                placeholder="e.g. 1234"
                                maxLength={4}
                              />
                              <button
                                type="button"
                                onClick={() => setEditDraft(d => ({ ...d, pin: Math.floor(1000 + Math.random() * 9000).toString() }))}
                                className="px-3 py-1.5 border border-[var(--border)] text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-all flex-shrink-0"
                                title="Regenerate PIN"
                              >
                                <RefreshCw className="w-4 h-4 text-[var(--muted-foreground)]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (editDraft.pin) navigator.clipboard.writeText(editDraft.pin);
                                }}
                                className="px-3 py-1.5 border border-[var(--border)] text-xs font-medium rounded-lg hover:bg-[var(--secondary)] transition-all flex-shrink-0"
                                title="Copy PIN"
                              >
                                <Copy className="w-4 h-4 text-[var(--muted-foreground)]" />
                              </button>
                            </div>
                          </div>
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
