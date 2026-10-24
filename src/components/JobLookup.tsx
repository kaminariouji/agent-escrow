import { useState } from 'react'
import { Search } from 'lucide-react'
import JobCard from './JobCard'

interface Props {
  initialJobIds?: `0x${string}`[]
  refreshTick?: number
}

export default function JobLookup({ initialJobIds = [], refreshTick: _refreshTick = 0 }: Props) {
  const [query, setQuery] = useState('')
  const [lookedUp, setLookedUp] = useState<`0x${string}`[]>([])

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = query.trim()
    if (trimmed.startsWith('0x') && trimmed.length === 66) {
      const id = trimmed as `0x${string}`
      if (!lookedUp.includes(id)) setLookedUp(prev => [id, ...prev])
    }
  }

  const allIds = [...new Set([...lookedUp, ...initialJobIds])]

  return (
    <div className="space-y-3">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--subtle)]" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Paste a Job ID (0x…) to look it up"
            className="mono w-full rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] py-2 pl-8 pr-3 text-xs text-[var(--ink)] placeholder:text-[var(--subtle)] focus:border-[var(--accent)] focus:outline-none"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg border border-[var(--border)] bg-[var(--surface-muted)] px-3 py-2 text-xs font-medium text-[var(--ink-2)] transition hover:bg-[var(--surface-strong)]"
        >
          Load
        </button>
      </form>

      {allIds.length === 0 && (
        <p className="py-8 text-center text-sm text-[var(--subtle)]">
          No jobs yet. Create one above or paste a Job ID to look it up.
        </p>
      )}

      <div className="space-y-2">
        {allIds.map(id => (
          <JobCard key={id} jobId={id} />
        ))}
      </div>
    </div>
  )
}
