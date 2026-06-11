'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Play, Link as LinkIcon, ClipboardList, Trophy, Search, Bookmark, BookmarkCheck, Loader2, BookOpen, FileQuestion, Cloud, Clock, ExternalLink } from 'lucide-react'

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

export default function StudentResourcesClient({ studentId, coachingCenterId, studentBatch }: { studentId: string, coachingCenterId: string, studentBatch: string }) {
  const supabase = useMemo(() => createClient(), [])
  
  const [resources, setResources] = useState<Resource[]>([])
  const [savedResourceIds, setSavedResourceIds] = useState<Set<string>>(new Set())
  const [recentlyViewedIds, setRecentlyViewedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubject, setSelectedSubject] = useState<string>('All')
  const [selectedType, setSelectedType] = useState<string>('All')
  const [activeTab, setActiveTab] = useState<'All' | 'Saved'>('All')

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      
      // 1. Strict Batch Isolation: Fetch resources strictly assigned to this batch or "All Batches"
      const { data: resData } = await supabase
        .from('resources')
        .select('*')
        .eq('coaching_center_id', coachingCenterId)
        .or(`target_batches.cs.{"${studentBatch}"},target_batches.cs.{"All Batches"}`)
        .order('created_at', { ascending: false })
        .range(0, 50)

      // 2. Fetch saved bookmarks
      const { data: savedData } = await supabase
        .from('saved_resources')
        .select('resource_id')
        .eq('student_id', studentId)

      // 3. Fetch recently viewed
      const { data: viewsData } = await supabase
        .from('resource_views')
        .select('resource_id')
        .eq('student_id', studentId)
        .order('viewed_at', { ascending: false })
        .limit(6)

      if (savedData) {
        setSavedResourceIds(new Set(savedData.map((s: { resource_id: string }) => s.resource_id)))
      }

      if (viewsData) {
        setRecentlyViewedIds(viewsData.map((v: { resource_id: string }) => v.resource_id))
      }

      if (resData) {
        setResources(resData)
      }
      
      setLoading(false)
    }

    fetchData()
  }, [coachingCenterId, studentBatch, studentId, supabase])

  const toggleSave = async (resourceId: string) => {
    const isSaved = savedResourceIds.has(resourceId)
    const newSaved = new Set(savedResourceIds)
    
    if (isSaved) {
      newSaved.delete(resourceId)
      setSavedResourceIds(newSaved)
      await supabase.from('saved_resources').delete().eq('resource_id', resourceId).eq('student_id', studentId)
    } else {
      newSaved.add(resourceId)
      setSavedResourceIds(newSaved)
      await supabase.from('saved_resources').insert([{ resource_id: resourceId, student_id: studentId }])
    }
  }

  const openResource = async (resourceId: string, url: string) => {
    window.open(url, '_blank')
    
    // Log view
    const { error } = await supabase.from('resource_views').upsert([{ 
      resource_id: resourceId, 
      student_id: studentId,
      viewed_at: new Date().toISOString()
    }], { onConflict: 'resource_id,student_id' })
    
    if (!error) {
      setRecentlyViewedIds(prev => {
        const filtered = prev.filter(id => id !== resourceId)
        return [resourceId, ...filtered].slice(0, 6)
      })
    }
  }

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

  // Filter Logic
  const displayResources = resources.filter(r => {
    if (activeTab === 'Saved' && !savedResourceIds.has(r.id)) return false
    if (selectedSubject !== 'All' && r.subject !== selectedSubject) return false
    if (selectedType !== 'All' && r.resource_type !== selectedType) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return r.title.toLowerCase().includes(term) || r.resource_type.toLowerCase().includes(term)
    }
    return true
  })

  const featuredResources = displayResources.filter(r => r.is_featured)
  const importantResources = displayResources.filter(r => r.is_important && !r.is_featured)
  const recentResources = displayResources.filter(r => !r.is_featured && !r.is_important).slice(0, 4) // Top 4 normal newest
  
  // Ordered by recentlyViewedIds array
  const viewedResources = recentlyViewedIds
    .map(id => resources.find(r => r.id === id))
    .filter((r): r is Resource => r !== undefined && displayResources.some(dr => dr.id === r.id))

  const isFiltering = searchTerm || selectedSubject !== 'All' || selectedType !== 'All' || activeTab === 'Saved'

  const ResourceCard = ({ resource }: { resource: Resource }) => {
    const isSaved = savedResourceIds.has(resource.id)
    return (
      <div className="glass-card rounded-2xl p-5 flex flex-col hover:border-[var(--primary)]/40 transition-all group relative overflow-hidden bg-gradient-to-br hover:from-[var(--primary)]/5 hover:to-transparent">
        {resource.is_featured ? (
          <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden z-10 pointer-events-none">
            <div className="absolute top-4 -right-8 w-32 bg-orange-500/90 text-white text-[10px] font-bold py-1 text-center rotate-45 transform shadow-lg">
              FEATURED
            </div>
          </div>
        ) : resource.is_important ? (
          <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden z-10 pointer-events-none">
            <div className="absolute top-2 -right-6 w-24 bg-red-500/90 text-white text-[10px] font-bold py-1 text-center rotate-45 transform shadow-lg">
              IMPORTANT
            </div>
          </div>
        ) : null}
        
        <div className="flex justify-between items-start mb-4 relative z-10">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 mt-0.5 rounded-xl bg-gradient-to-br from-[var(--primary)]/20 to-[var(--primary)]/5 border border-[var(--primary)]/20 flex items-center justify-center text-[var(--primary)] shadow-inner shrink-0">
              {getIcon(resource.resource_type)}
            </div>
            <div>
              <h3 className="font-semibold text-[15px] leading-tight line-clamp-2 pr-6 text-white group-hover:text-[var(--primary)] transition-colors" title={resource.title}>
                {resource.title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-md">
                  {resource.subject}
                </span>
                <span className="text-[10px] text-[var(--muted-foreground)]">
                  {resource.resource_type}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        {resource.description && (
          <p className="text-sm text-[var(--muted-foreground)] mb-5 line-clamp-2">{resource.description}</p>
        )}
        
        <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[var(--muted-foreground)] bg-black/20 px-2 py-1 rounded-md">
            <Clock className="w-3.5 h-3.5" />
            Uploaded {formatUploadDate(resource.created_at)}
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={(e) => { e.preventDefault(); toggleSave(resource.id); }}
              className={`p-2 rounded-lg transition-all ${isSaved ? 'text-[var(--primary)] bg-[var(--primary)]/10' : 'text-[var(--muted-foreground)] hover:bg-white/10 hover:text-white'}`}
              title={isSaved ? "Remove Bookmark" : "Save Resource"}
            >
              {isSaved ? <BookmarkCheck className="w-4 h-4 fill-current" /> : <Bookmark className="w-4 h-4" />}
            </button>
            <button
              onClick={() => openResource(resource.id, resource.external_link)}
              className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 transition-colors px-3 py-2 rounded-lg shadow-lg shadow-[var(--primary)]/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-[var(--muted-foreground)]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)]" />
        <p className="text-sm">Loading your learning hub...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 pb-12">
      
      {/* Search and Filters */}
      <div className="glass-card p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[72px] z-40 backdrop-blur-xl bg-[#030712]/80 border-b border-white/10">
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
          <button 
            onClick={() => setActiveTab('All')}
            className={`px-4 py-2 shrink-0 rounded-xl text-sm font-medium transition-all ${activeTab === 'All' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-[var(--muted-foreground)] hover:text-white hover:bg-white/5'}`}
          >
            All Resources
          </button>
          <button 
            onClick={() => setActiveTab('Saved')}
            className={`px-4 py-2 shrink-0 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'Saved' ? 'bg-[var(--primary)] text-white shadow-lg shadow-[var(--primary)]/20' : 'text-[var(--muted-foreground)] hover:text-white hover:bg-white/5'}`}
          >
            <Bookmark className="w-4 h-4" /> Saved
          </button>
        </div>

        <div className="flex w-full md:w-auto gap-3 flex-wrap md:flex-nowrap">
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 bg-black/20 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] text-white appearance-none flex-1 md:flex-none min-w-[120px]"
          >
            {RESOURCE_TYPES.map(t => <option key={t} value={t} className="bg-[#0a0f1c]">{t === 'All' ? 'All Types' : t}</option>)}
          </select>

          <select 
            value={selectedSubject} 
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-black/20 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] text-white appearance-none flex-1 md:flex-none min-w-[120px]"
          >
            <option value="All" className="bg-[#0a0f1c]">All Subjects</option>
            {SUBJECTS.map(s => <option key={s} value={s} className="bg-[#0a0f1c]">{s}</option>)}
          </select>
          
          <div className="relative flex-1 md:w-56 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search title..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-black/20 border border-[var(--border)] rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] transition-colors text-white"
            />
          </div>
        </div>
      </div>

      {displayResources.length === 0 ? (
        <div className="py-24 text-center glass-card rounded-3xl">
          <BookOpen className="w-16 h-16 text-[var(--primary)] mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-bold text-white mb-2">No resources found</h3>
          <p className="text-[var(--muted-foreground)] max-w-sm mx-auto">
            {isFiltering 
              ? "We couldn't find any resources matching your search and filter criteria. Try adjusting them." 
              : "No study materials are available for your batch yet. Check back soon!"}
          </p>
          {isFiltering && (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedSubject('All'); setSelectedType('All'); setActiveTab('All'); }}
              className="mt-6 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* Featured Resources Section */}
          {featuredResources.length > 0 && !isFiltering && (
            <section>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2 text-white">
                <span className="text-2xl">🔥</span>
                Resource of the Week
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {featuredResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}

          {/* Recently Viewed Section */}
          {viewedResources.length > 0 && !isFiltering && (
            <section>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
                <Clock className="w-5 h-5 text-blue-400" />
                Recently Viewed
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {viewedResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}

          {/* Important Resources Section */}
          {importantResources.length > 0 && !isFiltering && (
            <section>
              <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
                <span className="w-2 h-6 rounded-full bg-red-500"></span>
                Important Materials
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {importantResources.map(r => <ResourceCard key={r.id} resource={r} />)}
              </div>
            </section>
          )}

          {/* Grouped by Subject (or straight list if searching/filtering) */}
          {isFiltering ? (
             <section>
               <h2 className="text-lg font-bold mb-5 text-white">Search Results</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                 {displayResources.map(r => <ResourceCard key={r.id} resource={r} />)}
               </div>
             </section>
          ) : (
            SUBJECTS.map(subj => {
              const subjResources = displayResources.filter(r => r.subject === subj && !r.is_featured && !r.is_important && !recentlyViewedIds.includes(r.id))
              if (subjResources.length === 0) return null
              return (
                <section key={subj}>
                  <h2 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
                    <span className="w-2 h-6 rounded-full bg-[var(--border)]"></span>
                    {subj}
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

