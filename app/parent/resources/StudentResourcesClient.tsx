'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import {
  FileText, Play, Link as LinkIcon, ClipboardList, Trophy,
  Search, Loader2, BookOpen, FileQuestion, Cloud, Clock,
  ExternalLink, FolderOpen, Folder, ChevronRight, X, Zap
} from 'lucide-react'

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

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Maths', 'Biology', 'General']

const SUBJECT_COLORS: Record<string, string> = {
  Physics:   'text-blue-400   bg-blue-500/10   border-blue-500/20',
  Chemistry: 'text-green-400  bg-green-500/10  border-green-500/20',
  Maths:     'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Biology:   'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  General:   'text-slate-400  bg-slate-500/10  border-slate-500/20',
}

const SUBJECT_DOT: Record<string, string> = {
  Physics:   'bg-blue-400',
  Chemistry: 'bg-green-400',
  Maths:     'bg-purple-400',
  Biology:   'bg-emerald-400',
  General:   'bg-slate-400',
}

function getIcon(type: string, className = 'w-5 h-5') {
  switch (type) {
    case 'PDF':               return <FileText className={className} />
    case 'YouTube Video':     return <Play className={className} />
    case 'Assignment':        return <ClipboardList className={className} />
    case 'PYQ':               return <FileQuestion className={className} />
    case 'Mock Test':         return <Trophy className={className} />
    case 'Google Drive Link': return <Cloud className={className} />
    default:                  return <LinkIcon className={className} />
  }
}

function getTypeStyle(type: string) {
  switch (type) {
    case 'YouTube Video': return 'text-red-400 bg-red-500/10 border-red-500/20'
    case 'PYQ':           return 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    case 'Mock Test':     return 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    case 'Assignment':    return 'text-orange-400 bg-orange-500/10 border-orange-500/20'
    case 'PDF':           return 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    default:              return 'text-slate-400 bg-slate-500/10 border-slate-500/20'
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86400000)
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** Extract YouTube video ID from various URL formats */
function getYouTubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    if (u.hostname.includes('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v) return v
      // Handle /embed/ID and /shorts/ID
      const parts = u.pathname.split('/')
      const embedIdx = parts.indexOf('embed')
      const shortsIdx = parts.indexOf('shorts')
      if (embedIdx !== -1) return parts[embedIdx + 1]
      if (shortsIdx !== -1) return parts[shortsIdx + 1]
    }
    return null
  } catch {
    return null
  }
}

// ── Embedded YouTube Modal ─────────────────────────────────────────────────────
function VideoModal({ resource, onClose }: { resource: Resource; onClose: () => void }) {
  const videoId = getYouTubeId(resource.external_link)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  if (!videoId) {
    // Fallback: open externally if not a recognisable YouTube URL
    window.open(resource.external_link, '_blank')
    onClose()
    return null
  }

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center p-4 pt-24 sm:pt-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[#0f1729] rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <Play className="w-4 h-4 text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-white text-sm truncate">{resource.title}</p>
              <p className="text-xs text-slate-400">{resource.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            <a
              href={resource.external_link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-lg hover:bg-slate-700 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open in YouTube
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 16:9 iframe */}
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
            title={resource.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Description if any */}
        {resource.description && (
          <div className="px-5 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">{resource.description}</p>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function StudentResourcesClient({
  coachingCenterId,
  studentBatch,
  studentStandard,
}: {
  studentId: string
  coachingCenterId: string
  studentBatch: string
  studentStandard: string
}) {
  const supabase = useMemo(() => createClient(), [])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSubject, setActiveSubject] = useState('All')
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())
  const [videoModal, setVideoModal] = useState<Resource | null>(null)

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('coaching_center_id', coachingCenterId)
        .eq('standard', studentStandard)
        .or(`target_batches.cs.{"${studentBatch}"},target_batches.cs.{"All Batches"}`)
        .order('subject', { ascending: true })
        .order('chapter_name', { ascending: true })
        .order('is_featured', { ascending: false })
        .order('is_important', { ascending: false })
        .order('created_at', { ascending: false })
        .range(0, 199)
      if (data) setResources(data)
      setLoading(false)
    }
    fetchResources()
  }, [coachingCenterId, studentBatch, studentStandard, supabase])

  const toggleChapter = useCallback((key: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }, [])

  // ── Filtering ──────────────────────────────────────────────────────────────
  const filteredResources = useMemo(() => {
    return resources.filter(r => {
      if (activeSubject !== 'All' && r.subject !== activeSubject) return false
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        return (
          r.title.toLowerCase().includes(term) ||
          r.subject.toLowerCase().includes(term) ||
          (r.chapter_name || '').toLowerCase().includes(term) ||
          (r.description || '').toLowerCase().includes(term)
        )
      }
      return true
    })
  }, [resources, activeSubject, searchTerm])

  const isFiltering = searchTerm.length > 0

  // ── Subject counts for tabs ────────────────────────────────────────────────
  const subjectCounts = useMemo(() => {
    const map: Record<string, number> = { All: resources.length }
    for (const r of resources) {
      map[r.subject] = (map[r.subject] || 0) + 1
    }
    return map
  }, [resources])

  // ── Group by chapter within filtered set ──────────────────────────────────
  type ChapterGroup = { chapter: string; items: Resource[] }
  type SubjectGroup = { subject: string; chapters: ChapterGroup[] }

  const grouped = useMemo(() => {
    const subjectsToShow = activeSubject === 'All'
      ? [...new Set(filteredResources.map(r => r.subject))]
      : [activeSubject]

    const result: SubjectGroup[] = []
    for (const subj of subjectsToShow) {
      const subjItems = filteredResources.filter(r => r.subject === subj)
      if (subjItems.length === 0) continue

      const chapterMap = new Map<string, Resource[]>()
      for (const r of subjItems) {
        const ch = r.chapter_name?.trim() || 'General'
        if (!chapterMap.has(ch)) chapterMap.set(ch, [])
        chapterMap.get(ch)!.push(r)
      }

      const chapters: ChapterGroup[] = []
      for (const [chapter, items] of chapterMap.entries()) {
        chapters.push({ chapter, items })
      }
      chapters.sort((a, b) => a.chapter.localeCompare(b.chapter))
      result.push({ subject: subj, chapters })
    }
    return result
  }, [filteredResources, activeSubject])

  // ── Featured resources — capped at 4 most recent ──────────────────────────
  // Sorted by created_at desc so newest 4 always show; prevents banner overflow
  const featuredResources = useMemo(
    () => resources.filter(r => r.is_featured).slice(0, 4),
    [resources]
  )

  // ── Handle resource open ───────────────────────────────────────────────────
  const handleOpen = (resource: Resource) => {
    if (resource.resource_type === 'YouTube Video') {
      setVideoModal(resource)
    } else {
      window.open(resource.external_link, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-slate-400">Loading your learning hub...</p>
      </div>
    )
  }

  return (
    <>
      {/* Video Modal */}
      {videoModal && (
        <VideoModal resource={videoModal} onClose={() => setVideoModal(null)} />
      )}

      <div className="space-y-6 pb-12">

        {/* ── Featured Banner ──────────────────────────────────────────────── */}
        {featuredResources.length > 0 && !isFiltering && activeSubject === 'All' && (
          <section className="rounded-2xl bg-gradient-to-br from-orange-500/10 via-[#1a2540] to-[#0f1729] border border-orange-500/20 p-5">
            <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-orange-400" />
              Resource of the Week
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {featuredResources.map(r => (
                <ResourceCard key={r.id} resource={r} onOpen={handleOpen} />
              ))}
            </div>
          </section>
        )}

        {/* ── Search Bar ──────────────────────────────────────────────────── */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by title, chapter, or subject..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setActiveSubject('All') }}
            className="w-full pl-11 pr-4 py-3 bg-[#1a2540] border border-slate-700 rounded-2xl text-sm focus:outline-none focus:border-[var(--primary)]/60 text-white placeholder-slate-500 transition-colors"
          />
        </div>

        {/* ── Subject Tabs ─────────────────────────────────────────────────── */}
        {!isFiltering && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {SUBJECTS.map(subj => {
              const count = subjectCounts[subj] || 0
              if (subj !== 'All' && count === 0) return null
              const isActive = activeSubject === subj
              const dotColor = subj === 'All' ? 'bg-[var(--primary)]' : (SUBJECT_DOT[subj] || 'bg-slate-400')
              return (
                <button
                  key={subj}
                  onClick={() => setActiveSubject(subj)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all border ${
                    isActive
                      ? 'bg-[var(--primary)] text-white border-[var(--primary)] shadow-lg shadow-[var(--primary)]/20'
                      : 'bg-[#1a2540] text-slate-300 border-slate-700 hover:border-slate-500'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : dotColor}`} />
                  {subj}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${isActive ? 'bg-white/20' : 'bg-slate-700 text-slate-400'}`}>
                    {count}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* ── Empty State ───────────────────────────────────────────────────── */}
        {filteredResources.length === 0 ? (
          <div className="py-24 text-center bg-[#1a2540] border border-slate-800 rounded-3xl">
            <BookOpen className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 opacity-40" />
            <h3 className="text-xl font-bold text-white mb-2">No resources found</h3>
            <p className="text-slate-400 max-w-sm mx-auto text-sm">
              {isFiltering
                ? 'No materials match your search. Try a different keyword.'
                : 'No study materials are available for your batch yet.'}
            </p>
            {isFiltering && (
              <button onClick={() => setSearchTerm('')}
                className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm">
                Clear Search
              </button>
            )}
          </div>
        ) : isFiltering ? (
          /* ── Flat search results ─────────────────────────────────────── */
          <section>
            <p className="text-sm text-slate-400 mb-4">{filteredResources.length} result{filteredResources.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredResources.map(r => (
                <ResourceCard key={r.id} resource={r} onOpen={handleOpen} />
              ))}
            </div>
          </section>
        ) : (
          /* ── Subject → Chapter Folder View ──────────────────────────── */
          <div className="space-y-5">
            {grouped.map(({ subject, chapters }) => (
              <div key={subject} className="bg-[#1a2540] border border-slate-800 rounded-2xl overflow-hidden">
                {/* Subject header */}
                <div className={`px-5 py-3 border-b border-slate-800 flex items-center gap-3 ${SUBJECT_COLORS[subject] || ''}`}>
                  <span className={`w-2.5 h-2.5 rounded-full ${SUBJECT_DOT[subject] || 'bg-slate-400'}`} />
                  <h3 className="font-bold text-sm flex-1">{subject}</h3>
                  <span className="text-xs opacity-70">
                    {chapters.reduce((a, c) => a + c.items.length, 0)} resources
                  </span>
                </div>

                {/* Chapters */}
                <div className="divide-y divide-slate-800">
                  {chapters.map(({ chapter, items }) => {
                    const key = `${subject}::${chapter}`
                    const isOpen = expandedChapters.has(key)
                    const hasYoutube = items.some(r => r.resource_type === 'YouTube Video')
                    const hasImportant = items.some(r => r.is_important)

                    return (
                      <div key={chapter}>
                        {/* Chapter row */}
                        <button
                          onClick={() => toggleChapter(key)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-slate-800/50 transition-colors text-left group"
                        >
                          {isOpen
                            ? <FolderOpen className="w-4 h-4 text-[var(--primary)] shrink-0" />
                            : <Folder className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0 transition-colors" />}
                          <span className="text-sm font-medium text-white flex-1">{chapter}</span>
                          <div className="flex items-center gap-2">
                            {hasYoutube && <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">Video</span>}
                            {hasImportant && <span className="text-[10px] text-red-400">★</span>}
                            <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded-full">{items.length}</span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ml-1 ${isOpen ? 'rotate-90' : ''}`} />
                        </button>

                        {/* Resources inside chapter */}
                        {isOpen && (
                          <div className="bg-[#0f1729]/60 px-4 pb-4 pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {items.map(resource => (
                              <ResourceCard key={resource.id} resource={resource} onOpen={handleOpen} compact />
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
    </>
  )
}

// ── Resource Card ──────────────────────────────────────────────────────────────
function ResourceCard({
  resource,
  onOpen,
  compact = false,
}: {
  resource: Resource
  onOpen: (r: Resource) => void
  compact?: boolean
}) {
  const isVideo = resource.resource_type === 'YouTube Video'

  return (
    <div className={`bg-[#0f1729] border border-slate-700/60 rounded-xl flex flex-col hover:border-[var(--primary)]/40 transition-all group ${compact ? 'p-3' : 'p-4'}`}>
      {/* Badges row */}
      {(resource.is_featured || resource.is_important) && (
        <div className="flex gap-2 mb-2">
          {resource.is_featured && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/25">🔥 Featured</span>}
          {resource.is_important && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/25">★ Important</span>}
        </div>
      )}

      <div className="flex items-start gap-3 flex-1">
        <div className={`rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shrink-0 ${compact ? 'w-9 h-9' : 'w-11 h-11'}`}>
          {getIcon(resource.resource_type, compact ? 'w-4 h-4' : 'w-5 h-5')}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-white group-hover:text-[var(--primary)] transition-colors line-clamp-2 ${compact ? 'text-sm' : 'text-[15px]'}`}>
            {resource.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${getTypeStyle(resource.resource_type)}`}>
              {resource.resource_type}
            </span>
            {resource.chapter_name && (
              <span className="text-[10px] text-slate-500 truncate max-w-[80px]" title={resource.chapter_name}>
                {resource.chapter_name}
              </span>
            )}
          </div>
        </div>
      </div>

      {!compact && resource.description && (
        <p className="text-xs text-slate-400 mt-2 line-clamp-2">{resource.description}</p>
      )}

      <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <Clock className="w-3 h-3" />
          {formatDate(resource.created_at)}
        </div>
        <button
          onClick={() => onOpen(resource)}
          className={`flex items-center gap-1.5 text-xs font-semibold text-white transition-colors px-3 py-1.5 rounded-lg shadow-lg ${
            isVideo
              ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20'
              : 'bg-[var(--primary)] hover:bg-[var(--primary)]/90 shadow-[var(--primary)]/20'
          }`}
        >
          {isVideo ? <Play className="w-3.5 h-3.5" /> : <ExternalLink className="w-3.5 h-3.5" />}
          {isVideo ? 'Watch' : 'Open'}
        </button>
      </div>
    </div>
  )
}
