import { useEffect, useState } from 'react'
import { ArrowLeft, Copy, GitCompareArrows, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { firebaseSnippetRepository, type CloudJsonDiff } from '../firebase/snippetRepository'
import { clipboardService } from '../services/clipboardService'
import { useAppDispatch } from '../store/hooks'
import { addNotification } from '../store/slices/notificationSlice'

const OPEN_DIFF_ORIGINAL_KEY = 'toolstack.jsonDiff.original'
const OPEN_DIFF_MODIFIED_KEY = 'toolstack.jsonDiff.modified'

export function SavedDiffsPage() {
  const [comparisons, setComparisons] = useState<CloudJsonDiff[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const dispatch = useAppDispatch()
  const navigate = useNavigate()

  useEffect(() => {
    firebaseSnippetRepository.listDiffs()
      .then(setComparisons)
      .catch(() => dispatch(addNotification('Unable to load saved comparisons.', 'error')))
      .finally(() => setIsLoading(false))
  }, [dispatch])

  function openComparison(comparison: CloudJsonDiff) {
    sessionStorage.setItem(OPEN_DIFF_ORIGINAL_KEY, comparison.original)
    sessionStorage.setItem(OPEN_DIFF_MODIFIED_KEY, comparison.modified)
    navigate('/tools/json-diff')
  }

  async function copyComparison(comparison: CloudJsonDiff) {
    try {
      await clipboardService.copy(JSON.stringify({
        original: JSON.parse(comparison.original) as unknown,
        modified: JSON.parse(comparison.modified) as unknown,
      }, null, 2))
      dispatch(addNotification(`Copied “${comparison.title}”.`, 'success'))
    } catch {
      dispatch(addNotification('Unable to copy the saved comparison.', 'error'))
    }
  }

  async function removeComparison(comparisonId: string) {
    try {
      await firebaseSnippetRepository.removeDiff(comparisonId)
      setComparisons((items) => items.filter((item) => item.id !== comparisonId))
      dispatch(addNotification('Saved comparison deleted.', 'success'))
    } catch {
      dispatch(addNotification('Unable to delete the saved comparison.', 'error'))
    }
  }

  return (
    <section className="page-stack">
      <div className="section-heading">
        <p className="eyebrow">Your comparison workspace</p>
        <h1 className="!text-4xl font-bold">Saved JSON comparisons</h1>
        <p className="muted">JSON Diff comparisons saved securely to your Firebase account.</p>
        <div><Button variant="secondary" onClick={() => navigate('/tools/json-diff')}><ArrowLeft size={16} />Back to JSON Diff</Button></div>
      </div>

      {isLoading ? <p className="muted">Loading saved comparisons…</p> : comparisons.length === 0 ? (
        <section className="empty-state"><GitCompareArrows size={36} /><h2>No saved comparisons yet</h2><p>Compare two JSON documents, then select Save.</p></section>
      ) : (
        <div className="tool-grid">
          {comparisons.map((comparison) => (
            <article className="tool-panel grid gap-3" key={comparison.id}>
              <div className="panel-header">
                <GitCompareArrows size={18} />
                <h2>{comparison.title}</h2>
                <Button
                  className="ml-auto !min-h-7 !px-2 !py-1"
                  variant="ghost"
                  aria-label={`Copy ${comparison.title}`}
                  title="Copy comparison"
                  onClick={() => void copyComparison(comparison)}
                >
                  <Copy size={16} />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <pre className="max-h-36 overflow-hidden text-xs text-slate-400">{comparison.original}</pre>
                <pre className="max-h-36 overflow-hidden text-xs text-slate-400">{comparison.modified}</pre>
              </div>
              <div className="utility-actions">
                <Button onClick={() => openComparison(comparison)}>Open</Button>
                <Button variant="ghost" aria-label={`Delete ${comparison.title}`} onClick={() => void removeComparison(comparison.id)}><Trash2 size={16} />Delete</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
