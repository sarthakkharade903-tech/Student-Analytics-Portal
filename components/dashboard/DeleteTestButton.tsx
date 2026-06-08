'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Trash2, Loader2, AlertTriangle } from 'lucide-react'

interface DeleteTestButtonProps {
  testId: string
  testName: string
}

export default function DeleteTestButton({ testId, testName }: DeleteTestButtonProps) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setDeleting(true)
    setError(null)
    const supabase = createClient()

    // Delete all scores for this test first
    const { error: scoresErr } = await supabase
      .from('scores')
      .delete()
      .eq('test_id', testId)

    if (scoresErr) {
      setError(`Failed to delete test data: ${scoresErr.message}`)
      setDeleting(false)
      return
    }

    // Delete the test itself
    const { error: testErr } = await supabase
      .from('tests')
      .delete()
      .eq('id', testId)

    if (testErr) {
      setError(`Failed to delete test: ${testErr.message}`)
      setDeleting(false)
      return
    }

    router.push('/dashboard/tests')
    router.refresh()
  }

  if (deleting) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-4 py-2.5 border border-red-500/30 text-red-400 text-sm font-medium rounded-lg opacity-70 cursor-not-allowed flex-shrink-0"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        Deleting…
      </button>
    )
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-2 flex-shrink-0">
        {error && (
          <p className="text-xs text-red-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {error}
          </p>
        )}
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-400 mr-2">
            Delete <strong>{testName}</strong> and all its scores?
          </span>
          <button
            onClick={() => setConfirming(false)}
            className="px-3 py-1.5 text-xs font-medium border border-[var(--border)] rounded-lg hover:bg-[var(--secondary)] transition-all whitespace-nowrap"
          >
            Cancel
          </button>
          <button
            id="confirm-delete-test-btn"
            onClick={handleDelete}
            className="px-3 py-1.5 text-xs font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all whitespace-nowrap"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      id="delete-test-btn"
      onClick={() => { setError(null); setConfirming(true) }}
      title="Delete this test"
      className="inline-flex items-center gap-2 px-4 py-2.5 border border-[var(--border)] text-[var(--muted-foreground)] text-sm font-medium rounded-lg hover:border-red-500/40 hover:text-red-400 hover:bg-red-500/5 transition-all duration-200 flex-shrink-0"
    >
      <Trash2 className="w-4 h-4" />
      Delete Test
    </button>
  )
}
