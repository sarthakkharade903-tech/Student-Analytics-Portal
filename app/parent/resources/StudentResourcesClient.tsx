'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Play, Link as LinkIcon, ClipboardList, Trophy, Search, Loader2, BookOpen, FileQuestion, Cloud, Clock, ExternalLink } from 'lucide-react'

interface Resource {
  id: string
  title: string
  resource_type: string
  subject: string
  target_batches: string[]
  external_link: string
  description: string
  is_important: boolean
  is_featured: boolean
  created_at: string
}

const SUBJECTS = ['Physics', 'Chemistry', 'Maths', 'Biology', 'General']
const RESOURCE_TYPES = ['All', 'PDF', 'YouTube Video', 'Google Drive Link', 'Assignment', 'PYQ', 'Mock Test']

export default function StudentResourcesClient({ coachingCenterId, studentBatch, studentStandard }: { studentId: string, coachingCenterId: string, studentBatch: string, studentStandard: string }) {
  const supabase = useMemo(() => createClient(), [])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')

  useEffect(() => {
    const fetchResources = async () => {
      setLoading(true)
      // Strict batch isolation at DB level
      const { data } = await supabase
        .from('resources')
        .select('*')
        .eq('coaching_center_id', coachingCenterId)
        .eq('standard', studentStandard)
        .or(`target_batches.cs.{"${studentBatch}"},target_batches.cs.{"All Batches"}`)
        .order('created_at', { ascending: false })
        .range(0, 100)

      if (data) setResources(data)
      setLoading(false)
    }
    fetchResources()
  }, [coachingCenterId, studentBatch, studentStandard, supabase])

  const getIcon = (type: string) => {
    switch (type) {
      case 'PDF': return <FileText className="w-5 h-5" />
      case 'YouTube Video': return <Play className="w-5 h-5" />
      case 'Assignment': return <ClipboardList className="w-5 h-5" />
      case 'PYQ': return <FileQuestion className="w-5 h-5" />
      case 'Mock Test': return <Trophy className="w-5 h-5" />
      case 'Google Drive Link': return <Cloud className="w-5 h-5" />
      default: return <LinkIcon className="w-5 h-5" />
    }
  }

  const formatUploadDate = (dateString: string) => {
    const date = new Date(dateString)
    const diffTime = Math.abs(new Date().getTime() - date.getTime())
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const isFiltering = searchTerm || selectedSubject !== 'All' || selectedType !== 'All'

  const displayResources = resources.filter(r => {
    if (selectedSubject !== 'All' && r.subject !== selectedSubject) return false
    if (selectedType !== 'All' && r.resource_type !== selectedType) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return r.title.toLowerCase().includes(term) || r.subject.toLowerCase().includes(term)
    }
    return true
  })

  const featuredResources = displayResources.filter(r => r.is_featured)
  const importantResources = displayResources.filter(r => r.is_important && !r.is_featured)

  const ResourceCard = ({ resource }: { resource: Resource }) => (
    <div className="bg-[#1a2540] border border-slate-800 rounded-2xl p-5 flex flex-col hover:border-[var(--primary)]/40 transition-all group relative overflow-hidden bg-gradient-to-br hover:from-[var(--primary)]/10 hover:to-transparent">
      {resource.is_featured ? (
        <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden z-10 pointer-events-none">
          <div className="absolute top-4 -right-8 w-32 bg-orange-500/90 text-white text-[10px] font-bold py-1 text-center rotate-45 transform shadow-lg">FEATURED</div>
        </div>
      ) : resource.is_important ? (
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10 pointer-events-none">
          <div className="absolute top-2 -right-6 w-24 bg-red-500/90 text-white text-[10px] font-bold py-1 text-center rotate-45 transform shadow-lg">IMPORTANT</div>
        </div>
      ) : null}

      <div className="flex items-start gap-3 mb-4 relative z-10">
        <div className="w-12 h-12 mt-0.5 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-inner shrink-0">
          {getIcon(resource.resource_type)}
        </div>
        <div>
          <h3 className="font-semibold text-[15px] leading-tight text-white group-hover:text-[var(--primary)] transition-colors line-clamp-2" title={resource.title}>
            {resource.title}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-md">{resource.subject}</span>
            <span className="text-[10px] text-slate-400">{resource.resource_type}</span>
          </div>
        </div>
      </div>

      {resource.description && (
        <p className="text-sm text-slate-400 mb-4 line-clamp-2">{resource.description}</p>
      )}

      <div className="mt-auto pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800 px-2 py-1 rounded-md">
          <Clock className="w-3.5 h-3.5" />
          {formatUploadDate(resource.created_at)}
        </div>
        <a
          href={resource.external_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors px-3 py-2 rounded-lg shadow-lg shadow-[var(--primary)]/20"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open
        </a>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm text-slate-400">Loading your learning hub...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">

      {/* Search and Filters */}
      <div className="p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[72px] z-40 backdrop-blur-xl bg-[#0f1729]/80 border border-slate-800 shadow-sm">
        <div className="flex w-full gap-3 flex-wrap md:flex-nowrap">
          <select value={selectedType} onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] text-white appearance-none flex-1 min-w-[120px]">
            {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-slate-800">{t === 'All' ? 'All Types' : t}</option>)}
          </select>

          <select value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] text-white appearance-none flex-1 min-w-[120px]">
            <option value="All" className="bg-slate-800">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s} className="bg-slate-800">{s}</option>)}
          </select>

          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" placeholder="Search resources..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] text-white" />
          </div>
        </div>
      </div>

      {displayResources.length === 0 ? (
        <div className="py-24 text-center bg-[#1a2540] border border-slate-800 rounded-3xl">
          <BookOpen className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No resources found</h3>
          <p className="text-slate-400 max-w-sm mx-auto">
            {isFiltering
              ? "No resources match your filters. Try adjusting them."
              : "No study materials are available for your batch yet. Check back soon!"}
          </p>
          {isFiltering && (
            <button onClick={() => { setSearchTerm(''); setSelectedSubject('All'); setSelectedType('All'); }}
              className="mt-6 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm">
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          {/* Featured Resources */}
          {featuredResources.length > 0 && !isFiltering && (
            <section>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-white">
                <span className="text-2xl">🔥</span> Resource of the Week
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}

          {/* Important Resources */}
          {importantResources.length > 0 && !isFiltering && (
            <section>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
                <span className="w-2 h-6 rounded-full bg-red-500 shrink-0"></span> Important Materials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {importantResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}

          {/* Filtered Results or Subject-Wise */}
          {isFiltering ? (
            <section>
              <h2 className="text-lg font-bold mb-5 text-white">Search Results ({displayResources.length})</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          ) : (
            SUBJECTS.map(subj => {
              const subjResources = displayResources.filter(r => r.subject === subj && !r.is_featured && !r.is_important)
              if (subjResources.length === 0) return null
              return (
                <section key={subj}>
                  <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
                    <span className="w-2 h-6 rounded-full bg-slate-700 shrink-0"></span> {subj}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {subjResources.map(r => <ResourceCard key={r.id} resource={r} />)}
                  </div>
                </section>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
