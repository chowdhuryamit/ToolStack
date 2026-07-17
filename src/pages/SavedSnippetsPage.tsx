import { useEffect, useState } from 'react'
import { ArrowLeft, Braces, Copy, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { firebaseSnippetRepository, type CloudSnippet } from '../firebase/snippetRepository'
import { clipboardService } from '../services/clipboardService'
import { useAppDispatch } from '../store/hooks'
import { addNotification } from '../store/slices/notificationSlice'

const OPEN_SNIPPET_KEY = 'toolstack.openJsonSnippet'

export function SavedSnippetsPage() {
  const [snippets, setSnippets] = useState<CloudSnippet[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    firebaseSnippetRepository.list()
      .then(setSnippets)
      .catch(() => dispatch(addNotification('Unable to load saved snippets.', 'error')))
      .finally(() => setIsLoading(false))
  }, [dispatch])

  function openSnippet(snippet: CloudSnippet) {
    sessionStorage.setItem(OPEN_SNIPPET_KEY, snippet.content)
    navigate('/tools/json-formatter', { state: { intent: 'open-snippet' } })
  }

  async function copySnippet(snippet: CloudSnippet) {
    try {
      await clipboardService.copy(snippet.content)
      dispatch(addNotification(`Copied “${snippet.title}”.`, 'success'))
    } catch {
      dispatch(addNotification('Unable to copy the saved JSON.', 'error'))
    }
  }

  async function removeSnippet(snippetId: string) {
    try {
      await firebaseSnippetRepository.remove(snippetId)
      setSnippets((items) => items.filter((item) => item.id !== snippetId))
      dispatch(addNotification('Saved JSON deleted.', 'success'))
    } catch {
      dispatch(addNotification('Unable to delete the saved JSON.', 'error'))
    }
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Your cloud workspace</p>
        <h1 className='!text-4xl font-bold'>Saved JSON</h1>
        <p className="muted">JSON snippets saved securely to your Firebase account.</p>
        <div><Button variant="secondary" onClick={() => navigate('/tools/json-formatter')}><ArrowLeft size={16} />Back to formatter</Button></div>
      </div>

      {isLoading ? <p className="muted">Loading saved JSON…</p> : snippets.length === 0 ? (
        <section className="empty-state"><Braces size={36} /><h2>No saved JSON yet</h2><p>Format JSON, then select Save.</p></section>
      ) : (
        <div className="tool-grid">
          {snippets.map((snippet) => (
            <article className="tool-panel grid gap-3" key={snippet.id}>
              <div className="panel-header">
                <Braces size={18} />
                <h2>{snippet.title}</h2>
                <Button
                  className="ml-auto !min-h-7 !px-2 !py-1"
                  variant="ghost"
                  aria-label={`Copy ${snippet.title}`}
                  title="Copy JSON"
                  onClick={() => void copySnippet(snippet)}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <pre className="max-h-36 overflow-hidden text-xs text-slate-400">{snippet.content}</pre>
              <div className="utility-actions">
                <Button onClick={() => openSnippet(snippet)}>Open</Button>
                <Button variant="ghost" aria-label={`Delete ${snippet.title}`} onClick={() => void removeSnippet(snippet.id)}><Trash2 size={16} />Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
