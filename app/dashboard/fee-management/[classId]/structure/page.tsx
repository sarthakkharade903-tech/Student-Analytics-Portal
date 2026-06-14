'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Save, ChevronDown, Layers } from 'lucide-react'

type FeeStructure = {
  id: string
  total_fee: number
  standard: number
  batch: string
}

type Installment = {
  id: string
  fee_structure_id: string
  name: string
  amount: number
  due_date: string
}

export default function FeeStructurePage({ params }: { params: Promise<{ classId: string }> }) {
  const unwrappedParams = use(params)
  const classId = parseInt(unwrappedParams.classId)
  const supabase = createClient()

  const [batches, setBatches] = useState<{ id: string; name: string }[]>([])
  const [selectedBatch, setSelectedBatch] = useState('All Batches')
  const [batchDropdownOpen, setBatchDropdownOpen] = useState(false)
  const [showBatchManager, setShowBatchManager] = useState(false)
  const [newBatchName, setNewBatchName] = useState('')
  const [savingBatch, setSavingBatch] = useState(false)

  const [feeStructure, setFeeStructure] = useState<FeeStructure | null>(null)
  const [installments, setInstallments] = useState<Installment[]>([])
  const [loading, setLoading] = useState(true)
  const [savingFee, setSavingFee] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [totalFeeInput, setTotalFeeInput] = useState('')
  const [showInstallmentForm, setShowInstallmentForm] = useState(false)
  const [editInstallmentId, setEditInstallmentId] = useState<string | null>(null)

  const [instName, setInstName] = useState('')
  const [instAmount, setInstAmount] = useState('')
  const [instDate, setInstDate] = useState('')

  const loadBatches = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user.id).single()
    if (!profile?.coaching_center_id) return

    const { data } = await supabase
      .from('batches')
      .select('id, name')
      .eq('coaching_center_id', profile.coaching_center_id)
      .eq('standard', classId)
      .order('name', { ascending: true })

    setBatches(data || [])
  }

  const handleAddBatch = async () => {
    if (!newBatchName.trim()) return
    setSavingBatch(true)
    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user!.id).single()
    const { error } = await supabase.from('batches').insert({
      coaching_center_id: profile!.coaching_center_id,
      standard: classId,
      name: newBatchName.trim()
    })
    if (!error) { setNewBatchName(''); loadBatches() }
    else setError(error.message)
    setSavingBatch(false)
  }

  const handleDeleteBatch = async (id: string, name: string) => {
    if (!confirm(`Delete batch "${name}"?`)) return
    const { error } = await supabase.from('batches').delete().eq('id', id)
    if (!error) {
      if (selectedBatch === name) setSelectedBatch('All Batches')
      loadBatches()
    } else setError(error.message)
  }

  const loadData = async (batchName: string) => {
    setLoading(true)
    setError('')
    setSuccessMsg('')
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user.id).single()
    if (!profile?.coaching_center_id) return

    const { data: fsData, error: fsError } = await supabase
      .from('fee_structures')
      .select('*')
      .eq('coaching_center_id', profile.coaching_center_id)
      .eq('standard', classId)
      .eq('batch', batchName)
      .maybeSingle()

    if (fsError && fsError.code !== 'PGRST116') {
      setError(fsError.message)
    } else if (fsData) {
      setFeeStructure(fsData)
      setTotalFeeInput(fsData.total_fee.toString())

      const { data: instData } = await supabase
        .from('fee_installments')
        .select('*')
        .eq('fee_structure_id', fsData.id)
        .order('due_date', { ascending: true })

      setInstallments(instData || [])
    } else {
      setFeeStructure(null)
      setTotalFeeInput('')
      setInstallments([])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadBatches()
  }, [classId])

  useEffect(() => {
    loadData(selectedBatch)
  }, [classId, selectedBatch])

  const handleSaveTotalFee = async () => {
    if (!totalFeeInput || isNaN(parseFloat(totalFeeInput))) {
      setError('Please enter a valid fee amount.')
      return
    }
    setError('')
    setSuccessMsg('')
    setSavingFee(true)

    const { data: { user } } = await supabase.auth.getUser()
    const { data: profile } = await supabase.from('users').select('coaching_center_id').eq('id', user!.id).single()

    if (feeStructure) {
      const { error } = await supabase
        .from('fee_structures')
        .update({ total_fee: parseFloat(totalFeeInput) })
        .eq('id', feeStructure.id)
      if (error) setError(error.message)
      else { setSuccessMsg('Fee structure saved successfully!'); loadData(selectedBatch) }
    } else {
      const { error } = await supabase
        .from('fee_structures')
        .insert({
          coaching_center_id: profile!.coaching_center_id,
          standard: classId,
          batch: selectedBatch,
          total_fee: parseFloat(totalFeeInput)
        })
      if (error) setError(error.message)
      else { setSuccessMsg('Fee structure created successfully!'); loadData(selectedBatch) }
    }
    setSavingFee(false)
  }

  const handleSaveInstallment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!feeStructure) return
    setError('')

    if (editInstallmentId) {
      const { error } = await supabase
        .from('fee_installments')
        .update({ name: instName, amount: parseFloat(instAmount), due_date: instDate })
        .eq('id', editInstallmentId)
      if (error) { setError(error.message); return }
    } else {
      const { error } = await supabase
        .from('fee_installments')
        .insert({ fee_structure_id: feeStructure.id, name: instName, amount: parseFloat(instAmount), due_date: instDate })
      if (error) { setError(error.message); return }
    }

    setEditInstallmentId(null)
    setShowInstallmentForm(false)
    setInstName(''); setInstAmount(''); setInstDate('')
    loadData(selectedBatch)
  }

  const handleDeleteInstallment = async (id: string) => {
    if (!confirm('Delete this installment?')) return
    const { error } = await supabase.from('fee_installments').delete().eq('id', id)
    if (error) setError(error.message)
    else loadData(selectedBatch)
  }

  const startEditInstallment = (inst: Installment) => {
    setEditInstallmentId(inst.id)
    setInstName(inst.name)
    setInstAmount(inst.amount.toString())
    setInstDate(inst.due_date)
    setShowInstallmentForm(true)
  }

  const currentTotalInstallments = installments.reduce((sum, inst) => sum + Number(inst.amount), 0)
  const allBatchOptions = [{ name: 'All Batches' }, ...batches]

  return (
    <div className="space-y-8">
      {/* Header with Batch Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Fee Structure — Class {classId}</h2>
          <p className="text-sm text-[var(--muted-foreground)] mt-1">Configure total fees and installment plans per batch.</p>
        </div>

        {/* Batch Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setBatchDropdownOpen(!batchDropdownOpen)}
            className="flex items-center gap-2 bg-[var(--sidebar-accent)] border border-[var(--border)] hover:border-[var(--primary)] rounded-xl px-4 py-2.5 text-sm font-medium transition-all min-w-[180px] justify-between"
          >
            <span className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[var(--primary)]" />
              {selectedBatch}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${batchDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {batchDropdownOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setBatchDropdownOpen(false)} />
              <div className="absolute right-0 mt-2 z-20 bg-[var(--background)] border border-[var(--border)] rounded-xl shadow-xl overflow-hidden min-w-[180px]">
                {allBatchOptions.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    onClick={() => {
                      setSelectedBatch(b.name)
                      setBatchDropdownOpen(false)
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-[var(--sidebar-accent)] transition-colors flex items-center gap-2 ${
                      selectedBatch === b.name ? 'text-[var(--primary)] font-semibold bg-[oklch(0.62_0.22_265/0.08)]' : ''
                    }`}
                  >
                    {b.name === 'All Batches' && <span className="text-[10px] px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded font-bold">ALL</span>}
                    {b.name}
                  </button>
                ))}
                {batches.length === 0 && (
                  <div className="px-4 py-3 text-xs text-[var(--muted-foreground)] italic">No batches created yet</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 text-sm p-3 rounded-lg border border-red-500/20">{error}</div>
      )}
      {successMsg && (
        <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg border border-green-500/20">{successMsg}</div>
      )}

      {loading ? (
        <div className="animate-pulse h-32 bg-[var(--sidebar-accent)] rounded-xl" />
      ) : (
        <>
          {/* Total Fee Section */}
          <section className="bg-[var(--background)] p-6 rounded-2xl border border-[var(--border)] shadow-sm">
            <h3 className="text-base font-bold mb-1">
              Total Course Fee
              <span className="ml-2 text-xs font-normal px-2 py-0.5 rounded-full bg-[var(--sidebar-accent)] border border-[var(--border)] text-[var(--muted-foreground)]">
                {selectedBatch}
              </span>
            </h3>
            <p className="text-sm text-[var(--muted-foreground)] mb-4">
              Set the base total fee for students in this batch. Individual student fees can be overridden in Quick Entry.
            </p>
            <div className="flex items-end gap-4 max-w-md">
              <div className="flex-1">
                <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">Total Course Fee (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted-foreground)] font-bold">₹</span>
                  <input
                    type="number"
                    value={totalFeeInput}
                    onChange={(e) => setTotalFeeInput(e.target.value)}
                    className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-[var(--primary)] transition-colors text-sm"
                    placeholder="e.g. 60000"
                  />
                </div>
              </div>
              <button
                onClick={handleSaveTotalFee}
                disabled={!totalFeeInput || savingFee}
                className="bg-[var(--primary)] text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 h-[42px]"
              >
                <Save className="w-4 h-4" />
                {savingFee ? 'Saving...' : feeStructure ? 'Update' : 'Save'}
              </button>
            </div>
            {feeStructure && (
              <p className="text-xs text-[var(--muted-foreground)] mt-3">
                Current: <span className="font-bold text-[var(--foreground)]">₹{Number(feeStructure.total_fee).toLocaleString()}</span>
              </p>
            )}
          </section>

          {/* Installments Section */}
          {feeStructure && (
            <section>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold">Installment Schedule</h3>
                  <p className="text-sm text-[var(--muted-foreground)] mt-0.5">
                    Allocated: <span className={currentTotalInstallments > feeStructure.total_fee ? 'text-red-500 font-semibold' : 'font-semibold text-[var(--foreground)]'}>
                      ₹{currentTotalInstallments.toLocaleString()}
                    </span>
                    {' '}/ ₹{Number(feeStructure.total_fee).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowInstallmentForm(!showInstallmentForm)
                    setEditInstallmentId(null)
                    setInstName(''); setInstAmount(''); setInstDate('')
                  }}
                  className="flex items-center gap-2 bg-[var(--sidebar-accent)] text-[var(--foreground)] hover:text-[var(--primary)] hover:bg-[oklch(0.62_0.22_265/0.15)] px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-[var(--border)]"
                >
                  <Plus className="w-4 h-4" />
                  {showInstallmentForm ? 'Cancel' : 'Add Installment'}
                </button>
              </div>

              {showInstallmentForm && (
                <form onSubmit={handleSaveInstallment} className="mb-6 bg-[var(--background)] p-5 rounded-xl border border-[var(--primary)]/30 shadow-sm">
                  <h4 className="font-semibold mb-4 text-sm">{editInstallmentId ? 'Edit Installment' : 'New Installment'}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">Installment Name</label>
                      <input required type="text" value={instName} onChange={e => setInstName(e.target.value)} placeholder="e.g. 1st Installment" className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">Amount (₹)</label>
                      <input required type="number" value={instAmount} onChange={e => setInstAmount(e.target.value)} placeholder="20000" className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--muted-foreground)] mb-1.5 font-medium">Due Date</label>
                      <input required type="date" value={instDate} onChange={e => setInstDate(e.target.value)} className="w-full bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)]" />
                    </div>
                  </div>
                  <button type="submit" className="bg-[var(--primary)] text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium hover:opacity-90">
                    Save Installment
                  </button>
                </form>
              )}

              {installments.length === 0 ? (
                <div className="text-center py-12 text-[var(--muted-foreground)] bg-[var(--background)] rounded-xl border border-dashed border-[var(--border)]">
                  <Plus className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No installments defined. Add your first installment above.</p>
                </div>
              ) : (
                <div className="bg-[var(--background)] rounded-xl border border-[var(--border)] overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[var(--sidebar)] border-b border-[var(--border)] text-[var(--muted-foreground)]">
                      <tr>
                        <th className="px-5 py-3 font-medium">#</th>
                        <th className="px-5 py-3 font-medium">Name</th>
                        <th className="px-5 py-3 font-medium">Amount</th>
                        <th className="px-5 py-3 font-medium">Due Date</th>
                        <th className="px-5 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {installments.map((inst, i) => (
                        <tr key={inst.id} className="hover:bg-[var(--sidebar)]/50 transition-colors">
                          <td className="px-5 py-3 text-[var(--muted-foreground)]">{i + 1}</td>
                          <td className="px-5 py-3 font-medium">{inst.name}</td>
                          <td className="px-5 py-3">
                            <span className="inline-flex items-center px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold text-xs border border-emerald-500/20">
                              ₹{Number(inst.amount).toLocaleString()}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-[var(--muted-foreground)]">{new Date(inst.due_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</td>
                          <td className="px-5 py-3 text-right">
                            <button onClick={() => startEditInstallment(inst)} className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] inline-block mx-1 rounded-lg hover:bg-[var(--sidebar-accent)] transition-colors">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDeleteInstallment(inst.id)} className="p-1.5 text-[var(--muted-foreground)] hover:text-red-500 inline-block rounded-lg hover:bg-red-500/10 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--sidebar-accent)] border-t border-[var(--border)]">
                      <tr>
                        <td colSpan={2} className="px-5 py-3 font-bold text-sm">Total</td>
                        <td className="px-5 py-3 font-bold text-sm">
                          <span className={currentTotalInstallments > (feeStructure?.total_fee || 0) ? 'text-red-500' : 'text-emerald-600'}>
                            ₹{currentTotalInstallments.toLocaleString()}
                          </span>
                          <span className="text-[var(--muted-foreground)] font-normal"> / ₹{Number(feeStructure?.total_fee || 0).toLocaleString()}</span>
                        </td>
                        <td colSpan={2} />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </section>
          )}

          {!feeStructure && !loading && (
            <div className="text-center py-12 text-[var(--muted-foreground)] bg-[var(--background)] rounded-xl border border-dashed border-[var(--border)]">
              <p className="text-sm">Enter the total fee above and click <strong>Save</strong> to configure the fee structure for <strong>{selectedBatch}</strong>.</p>
            </div>
          )}

          {/* Batch Manager */}
          <section className="border border-[var(--border)] rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowBatchManager(!showBatchManager)}
              className="w-full flex items-center justify-between px-5 py-4 bg-[var(--background)] hover:bg-[var(--sidebar-accent)] transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-[var(--primary)]" />
                <span className="font-semibold text-sm">Manage Batches</span>
                <span className="text-xs text-[var(--muted-foreground)] ml-1">({batches.length} batches for Class {classId})</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform text-[var(--muted-foreground)] ${showBatchManager ? 'rotate-180' : ''}`} />
            </button>

            {showBatchManager && (
              <div className="px-5 py-5 bg-[var(--background)] border-t border-[var(--border)] space-y-4">
                {/* Add batch */}
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newBatchName}
                    onChange={e => setNewBatchName(e.target.value)}
                    placeholder={`e.g. ${classId}-A, JEE ${classId} Morning`}
                    onKeyDown={e => e.key === 'Enter' && handleAddBatch()}
                    className="flex-1 bg-[var(--sidebar)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[var(--primary)] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleAddBatch}
                    disabled={!newBatchName.trim() || savingBatch}
                    className="flex items-center gap-1.5 bg-[var(--primary)] text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                    {savingBatch ? 'Adding...' : 'Add Batch'}
                  </button>
                </div>

                {/* Batch list */}
                {batches.length === 0 ? (
                  <p className="text-sm text-[var(--muted-foreground)] italic">No batches yet. Add one above.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {batches.map(batch => (
                      <div key={batch.id} className="flex items-center gap-2 px-3 py-1.5 bg-[var(--sidebar-accent)] border border-[var(--border)] rounded-lg text-sm">
                        <span className="font-medium">{batch.name}</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteBatch(batch.id, batch.name)}
                          className="text-[var(--muted-foreground)] hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}

