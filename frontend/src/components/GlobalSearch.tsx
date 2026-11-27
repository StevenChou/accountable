import { useRef, useState, type KeyboardEvent } from 'react'
import { Link } from 'react-router'
import { errorMessage, useResource } from '../api'
import { resourceNames, type Resource } from '../domain'
import './global-search.css'

type SearchResult = { resource: Resource; id: number; name: string }

function Results({ query, select, exit }: { query: string; select: () => void; exit: (event: KeyboardEvent) => void }) {
  const result = useResource<SearchResult[]>(`/search?q=${encodeURIComponent(query)}`)
  return (
    <div className="search-results">
      {result.busy ? (
        <p role="status">搜尋中…</p>
      ) : result.error ? (
        <>
          <p role="alert">{errorMessage(result.error)}</p>
          <button type="button" className="secondary" onKeyDown={exit} onClick={() => void result.reload()}>
            重試搜尋
          </button>
        </>
      ) : result.data?.length ? (
        <ul aria-label="搜尋結果">
          {result.data.map(({ resource, id, name }) => (
            <li key={`${resource}/${id}`}>
              <Link to={`/${resource}/${id}`} onKeyDown={exit} onClick={select}>
                <span>{name}</span>
                <span className="muted">{resourceNames[resource]}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status">找不到符合的紀錄。</p>
      )}
    </div>
  )
}

export function GlobalSearch() {
  const [input, setInput] = useState('')
  const [open, setOpen] = useState(false)
  const field = useRef<HTMLInputElement>(null)
  const query = input.trim()

  function closeOnEscape(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      field.current?.focus()
      setOpen(false)
    }
  }

  return (
    <div
      className="global-search"
      role="search"
      aria-label="全站搜尋"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
      }}
    >
      <input
        ref={field}
        type="search"
        aria-label="全站搜尋"
        placeholder="搜尋紀錄"
        value={input}
        onFocus={() => setOpen(true)}
        onKeyDown={closeOnEscape}
        onChange={(event) => {
          setInput(event.target.value)
          setOpen(true)
        }}
      />
      {open && query && (
        <Results
          key={query}
          query={query}
          exit={closeOnEscape}
          select={() => {
            setInput('')
            setOpen(false)
          }}
        />
      )}
    </div>
  )
}
