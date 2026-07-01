'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Play, Link as LinkIcon, ClipboardList, Trophy,
  Trash2, Search, Loader2, AlertCircle, Plus, FileQuestion,
  Cloud, ExternalLink, ChevronLeft, ChevronRight, FolderOpen, Folder
} from 'lucide-react'

const PAGE_SIZE = 20

interface Resource {
  id: string
  title: string
  resource_type: string
  subject: string
  chapter_name: string | null
  target_batches: string[]
  external_link: string
  description: string
  is_important: boolean
  is_featured: boolean
  created_at: string
}

const RESOURCE_TYPES = ['PDF', 'YouTube Video', 'Google Drive Link', 'Assignment', 'PYQ', 'Mock Test']
const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'General']

function getIcon(type: string, className = 'w-5 h-5') {
  switch (type) {
    case 'PDF': return <FileText className={className} />
    case 'YouTube Video': return <Play className={className} />
    case 'Assignment': return <ClipboardList className={className} />
    case 'PYQ': return <FileQuestion className={className} />
    case 'Mock Test': return <Trophy className={className} />
    case 'Google Drive Link': return <Cloud className={className} />
    default: return <LinkIcon className={className} />
  }
}

function getTypeBadgeColor(type: string) {
  switch (type) {
    case 'YouTube Video': return 'bg-red-500/15 text-red-400 border-red-500/25'
    case 'PYQ': return 'bg-purple-500/15 text-purple-400 border-purple-500/25'
    case 'Mock Test': return 'bg-amber-500/15 text-amber-400 border-amber-500/25'
    case 'Assignment': return 'bg-orange-500/15 text-orange-400 border-orange-500/25'
    case 'PDF': return 'bg-blue-500/15 text-blue-400 border-blue-500/25'
    default: return 'bg-slate-500/15 text-slate-400 border-slate-500/25'
  }
}

export default function ResourcesClient({ coachingCenterId, batches, standard }: { coachingCenterId: string, batches: string[], standard: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeBatchTab, setActiveBatchTab] = useState('All')
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [resourcePage, setResourcePage] = useState(1)

  // Form state
  const [title, setTitle] = useState('')
  const [resourceType, setResourceType] = useState(RESOURCE_TYPES[0])
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [chapterName, setChapterName] = useState('')
  const [targetBatches, setTargetBatches] = useState<string[]>(['All Batches'])
  const [externalLink, setExternalLink] = useState('')
  const [description, setDescription] = useState('')
  const [isImportant, setIsImportant] = useState(false)
  const [isFeatured, setIsFeatured] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const fetchResources = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('coaching_center_id', coachingCenterId)
      .eq('standard', standard)
      .order('subject', { ascending: true })
      .order('chapter_name', { ascending: true })
      .order('created_at', { ascending: false })
    if (data) setResources(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchResources()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachingCenterId, standard])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !externalLink) { setError('Title and Link are required.'); return }
    setIsSubmitting(true)
    setError(null)
    const newResource = {
      coaching_center_id: coachingCenterId,
      title,
      resource_type: resourceType,
      subject,
      chapter_name: chapterName.trim() || null,
      target_batches: targetBatches,
      external_link: externalLink,
      description,
      is_important: isImportant,
      is_featured: isFeatured,
      standard
    }
    const { error: insertError } = await supabase.from('resources').insert([newResource])
    if (insertError) {
      setError(insertError.message)
    } else {
      setSuccess('Resource uploaded successfully!')
      setTitle(''); setExternalLink(''); setDescription('')
      setChapterName(''); setIsImportant(false); setIsFeatured(false)
      fetchResources()
      setTimeout(() => setSuccess(null), 3000)
    }
    setIsSubmitting(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resource?')) return
    const { error } = await supabase.from('resources').delete().eq('id', id)
    if (!error) setResources(resources.filter(r => r.id !== id))
  }

  const toggleChapter = (key: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const batchTabs = ['All', ...batches]

  const filteredResources = resources.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.chapter_name || '').toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (activeBatchTab === 'All') return true
    return r.target_batches.includes(activeBatchTab) || r.target_batches.includes('All Batches')
  })

  // Reset to page 1 whenever filter changes
  useEffect(() => { setResourcePage(1) }, [searchTerm, activeBatchTab])

  // Group by subject → chapter
  type ChapterGroup = { chapter: string; items: Resource[] }
  type SubjectGroup = { subject: string; chapters: ChapterGroup[] }

  const groupedResources = useMemo(() => {
    const subjectMap = new Map<string, Map<string, Resource[]>>()
    for (const r of filteredResources) {
      const chapter = r.chapter_name?.trim() || 'General'
      if (!subjectMap.has(r.subject)) subjectMap.set(r.subject, new Map())
      const chapMap = subjectMap.get(r.subject)!
      if (!chapMap.has(chapter)) chapMap.set(chapter, [])
      chapMap.get(chapter)!.push(r)
    }
    const result: SubjectGroup[] = []
    for (const [subject, chapMap] of subjectMap.entries()) {
      const chapters: ChapterGroup[] = []
      for (const [chapter, items] of chapMap.entries()) {
        chapters.push({ chapter, items })
      }
      chapters.sort((a, b) => a.chapter.localeCompare(b.chapter))
      result.push({ subject, chapters })
    }
    result.sort((a, b) => SUBJECTS.indexOf(a.subject) - SUBJECTS.indexOf(b.subject))
    return result
  }, [filteredResources])

  // Pagination operates on flat filtered list for simplicity in search mode
  const isSearching = searchTerm.length > 0
  const totalResPages = Math.max(1, Math.ceil(filteredResources.length / PAGE_SIZE))
  const pagedResources = filteredResources.slice((resourcePage - 1) * PAGE_SIZE, resourcePage * PAGE_SIZE)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* UPLOAD FORM */}
      <div className="lg:col-span-1">
        <div className="glass-card rounded-2xl p-6 sticky top-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-[var(--primary)]" />
            Add Resource
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Title *</label>
              <input type="text" required value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Newton's Laws Notes"
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Type *</label>
                <select value={resourceType} onChange={e => setResourceType(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900">
                  {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-white">{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Subject *</label>
                <select value={subject} onChange={e => setSubject(e.target.value)}
                  className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] text-gray-900">
                  {SUBJECTS.map(t => <option key={t} value={t} className="bg-white">{t}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Chapter / Module</label>
              <input type="text" value={chapterName} onChange={e => setChapterName(e.target.value)}
                placeholder="e.g. Thermodynamics (optional)"
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">Target Batches *</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTargetBatches(['All Batches'])}
                  className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                    targetBatches.includes('All Batches') 
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                      : 'bg-white/50 text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/50'
                  }`}
                >
                  All Batches
                </button>
                {batches.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setTargetBatches(prev => {
                        if (prev.includes('All Batches')) return [b]
                        const next = prev.includes(b) ? prev.filter(x => x !== b) : [...prev, b]
                        return next.length === 0 ? ['All Batches'] : next
                      })
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors border ${
                      !targetBatches.includes('All Batches') && targetBatches.includes(b)
                        ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                        : 'bg-white/50 text-[var(--muted-foreground)] border-[var(--border)] hover:border-[var(--primary)]/50'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Link *</label>
              <input type="url" required value={externalLink} onChange={e => setExternalLink(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div>
              <label className="block text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-1">Description (Optional)</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)}
                placeholder="Brief description..." rows={2}
                className="w-full px-3 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
            </div>

            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isImportant} onChange={e => setIsImportant(e.target.checked)}
                  className="rounded border-[var(--border)] bg-white/50 text-[var(--primary)] focus:ring-[var(--primary)]" />
                Important
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" checked={isFeatured} onChange={e => setIsFeatured(e.target.checked)}
                  className="rounded border-[var(--border)] bg-white/50 text-orange-500 focus:ring-orange-500" />
                Featured
              </label>
            </div>

            <button type="submit" disabled={isSubmitting}
              className="w-full py-2.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Upload Resource'}
            </button>
          </form>
        </div>
      </div>

      {/* RESOURCE LIST */}
      <div className="lg:col-span-2 space-y-4">

        {/* Batch Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {batchTabs.map(tab => (
            <button key={tab} onClick={() => setActiveBatchTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                activeBatchTab === tab
                  ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20'
                  : 'bg-white/50 border border-[var(--border)] text-[var(--muted-foreground)] hover:text-gray-900 hover:border-[var(--primary)]/40'
              }`}>
              {tab === 'All' ? 'All Batches' : tab}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input type="text" placeholder="Search title, subject, chapter..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/50 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]" />
          </div>
          <span className="text-sm text-[var(--muted-foreground)] shrink-0">{filteredResources.length} items</span>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="w-8 h-8 text-[var(--muted-foreground)] animate-spin" /></div>
        ) : filteredResources.length === 0 ? (
          <div className="glass-card rounded-2xl py-12 text-center text-[var(--muted-foreground)]">
            No resources found{activeBatchTab !== 'All' ? ` for ${activeBatchTab}` : ''}.
          </div>
        ) : isSearching ? (
          // ── Flat paginated list when searching ──────────────────────────────
          <>
            <div className="space-y-2">
              {pagedResources.map(resource => (
                <ResourceRow key={resource.id} resource={resource} onDelete={handleDelete} />
              ))}
            </div>
            {totalResPages > 1 && (
              <Pagination page={resourcePage} totalPages={totalResPages} setPage={setResourcePage} total={filteredResources.length} pageSize={PAGE_SIZE} />
            )}
          </>
        ) : (
          // ── Grouped by Subject → Chapter ─────────────────────────────────
          <div className="space-y-6">
            {groupedResources.map(({ subject, chapters }) => (
              <div key={subject} className="glass-card rounded-2xl overflow-hidden">
                {/* Subject Header */}
                <div className="px-5 py-3 bg-[var(--primary)]/10 border-b border-[var(--border)] flex items-center gap-2">
                  <span className="w-2 h-5 rounded-full bg-[var(--primary)] shrink-0" />
                  <h3 className="font-bold text-[var(--foreground)]">{subject}</h3>
                  <span className="ml-auto text-xs text-[var(--muted-foreground)]">
                    {chapters.reduce((acc, c) => acc + c.items.length, 0)} items
                  </span>
                </div>

                {/* Chapters */}
                <div className="divide-y divide-[var(--border)]">
                  {chapters.map(({ chapter, items }) => {
                    const key = `${subject}::${chapter}`
                    const isOpen = expandedChapters.has(key)
                    return (
                      <div key={chapter}>
                        {/* Chapter Row — click to expand */}
                        <button
                          onClick={() => toggleChapter(key)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-[var(--sidebar-accent)] transition-colors text-left"
                        >
                          {isOpen
                            ? <FolderOpen className="w-4 h-4 text-[var(--primary)] shrink-0" />
                            : <Folder className="w-4 h-4 text-[var(--muted-foreground)] shrink-0" />}
                          <span className="text-sm font-medium flex-1">{chapter}</span>
                          <span className="text-xs text-[var(--muted-foreground)] bg-[var(--secondary)] px-2 py-0.5 rounded-full">
                            {items.length}
                          </span>
                          <ChevronRight className={`w-4 h-4 text-[var(--muted-foreground)] transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Resources inside chapter */}
                        {isOpen && (
                          <div className="bg-[var(--background)]/30 px-5 pb-3 pt-1 space-y-2">
                            {items.map(resource => (
                              <ResourceRow key={resource.id} resource={resource} onDelete={handleDelete} compact />
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── ResourceRow ────────────────────────────────────────────────────────────────
function ResourceRow({ resource, onDelete, compact = false }: {
  resource: Resource
  onDelete: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className={`glass-card rounded-xl flex items-center gap-3 hover:border-[var(--primary)]/40 transition-colors ${compact ? 'p-3' : 'p-4'}`}>
      <div className={`rounded-lg bg-[oklch(0.62_0.22_265/0.12)] flex items-center justify-center text-[var(--primary)] shrink-0 ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
        {getIcon(resource.resource_type, compact ? 'w-4 h-4' : 'w-5 h-5')}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" title={resource.title}>{resource.title}</p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTypeBadgeColor(resource.resource_type)}`}>
            {resource.resource_type}
          </span>
          {resource.is_featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">🔥 Featured</span>}
          {resource.is_important && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">Important</span>}
          <span className="text-[10px] text-[var(--muted-foreground)]">{resource.target_batches.join(', ')}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <a href={resource.external_link} target="_blank" rel="noopener noreferrer"
          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors" title="Open">
          <ExternalLink className="w-4 h-4" />
        </a>
        <button onClick={() => onDelete(resource.id)}
          className="p-1.5 text-[var(--muted-foreground)] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

// ── Pagination ─────────────────────────────────────────────────────────────────
function Pagination({ page, totalPages, setPage, total, pageSize }: {
  page: number; totalPages: number; setPage: (p: number) => void; total: number; pageSize: number
}) {
  return (
    <div className="flex items-center justify-between mt-6 pt-5 border-t border-[var(--border)]">
      <p className="text-sm text-[var(--muted-foreground)]">
        Showing {((page - 1) * pageSize) + 1}–{Math.min(page * pageSize, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1)
          .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
          .reduce<(number | 'ellipsis')[]>((acc, p, idx, arr) => {
            if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('ellipsis')
            acc.push(p)
            return acc
          }, [])
          .map((item, idx) =>
            item === 'ellipsis' ? (
              <span key={`e-${idx}`} className="px-2 text-[var(--muted-foreground)] text-sm">…</span>
            ) : (
              <button key={item} onClick={() => setPage(item as number)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                  page === item ? 'bg-[var(--primary)] text-white shadow-md' : 'border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)]'
                }`}>
                {item}
              </button>
            )
          )}
        <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border border-[var(--border)] text-[var(--muted-foreground)] hover:bg-[var(--sidebar-accent)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          Next <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
