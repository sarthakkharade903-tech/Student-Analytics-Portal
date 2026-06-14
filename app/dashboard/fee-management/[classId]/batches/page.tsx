'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2 } from 'lucide-react'

type Batch = {
  id: string
  name: string
  standard: number
}

export default function BatchManagementPage({ params }: { params: Promise<{ classId: string }> }) {
  const unwrappedParams = use(params)
  const classId = parseInt(unwrappedParams.classId)
  const supabase = createClient()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Form State
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [batchName, setBatchName] = useState('')

  const fetchBatches = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (profile?.coaching_center_id) {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('coaching_center_id', profile.coaching_center_id)
        .eq('standard', classId)
        .order('created_at', { ascending: false })

      if (error) setError(error.message)
      else setBatches(data || [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBatches()
  }, [classId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!batchName.trim()) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase
      .from('users')
      .select('coaching_center_id')
      .eq('id', user.id)
      .single()

    if (!profile?.coaching_center_id) return

    if (editingId) {
      const { error } = await supabase
        .from('batches')
        .update({ name: batchName.trim() })
        .eq('id', editingId)
      if (error) setError(error.message)
    } else {
      const { error } = await supabase
        .from('batches')
        .insert({
          coaching_center_id: profile.coaching_center_id,
          name: batchName.trim(),
          standard: classId
        })
      if (error) setError(error.message)
    }

    setBatchName('')
    setEditingId(null)
    setShowForm(false)
    fetchBatches()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this batch?')) return
    const { error } = await supabase.from('batches').delete().eq('id', id)
    if (error) setError(error.message)
    else fetchBatches()
  }

  const startEdit = (b: Batch) => {
    setEditingId(b.id)
    setBatchName(b.name)
    setShowForm(true)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Class {classId} Batches</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            setBatchName('')
          }}
          className="flex items-center gap-2 bg-[var(--primary)] text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-4 h-4" />
          {showForm ? 'Cancel' : 'Create Batch'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg mb-6 border border-red-500/20">
          {error}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-[var(--background)] p-4 rounded-xl border border-[var(--border)]">
          <h3 className="font-semibold mb-4">{editingId ? 'Edit Batch' : 'New Batch'}</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm text-[var(--muted-foreground)] mb-1">Batch Name</label>
              <input
                type="text"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., 11-A, JEE Morning"
                className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-4 py-2 focus:outline-none focus:border-[var(--primary)] transition-colors"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-[var(--primary)] text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity h-[42px]"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-[var(--sidebar-accent)] rounded-xl" />
          ))}
        </div>
      ) : batches.length === 0 ? (
        <div className="text-center py-12 text-[var(--muted-foreground)] bg-[var(--background)] rounded-xl border border-dashed border-[var(--border)]">
          No batches found for Class {classId}. Create one to get started.
        </div>
      ) : (
        <div className="grid gap-3">
          {batches.map(batch => (
            <div key={batch.id} className="flex items-center justify-between p-4 bg-[var(--background)] rounded-xl border border-[var(--border)]">
              <div>
                <h3 className="font-medium text-lg">{batch.name}</h3>
                <p className="text-sm text-[var(--muted-foreground)]">Standard: Class {batch.standard}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(batch)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[oklch(0.62_0.22_265/0.15)] rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(batch.id)}
                  className="p-2 text-[var(--muted-foreground)] hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
