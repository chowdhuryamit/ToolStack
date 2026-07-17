import { useEffect, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { useAuth } from '../auth/authContext'
import { firebaseErrorMessage } from '../auth/firebaseErrorMessage'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { signInWithEmail, signInWithGoogle, signUpWithEmail } from '../firebase/auth'
import { isFirebaseConfigured } from '../firebase/config'

type AuthPageProps = {
  mode: 'login' | 'signup'
}

type AuthLocationState = {
  returnTo?: string
  intent?: 'save-json'
}

export function AuthPage({ mode }: AuthPageProps) {
  const isSignup = mode === 'signup'
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const state = location.state as AuthLocationState | null
  const requestedPath = state?.returnTo?.startsWith('/') ? state.returnTo : '/dashboard'

  function finishAuthentication() {
    navigate(requestedPath, {
      replace: true,
      state: state?.intent ? { intent: state.intent } : undefined,
    })
  }

  useEffect(() => {
    if (!isLoading && user) finishAuthentication()
  // Authentication completion should redirect using the route state from this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, user])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local.')
      return
    }
    if (isSignup && password.length < 6) {
      setError('Use a password with at least 6 characters.')
      return
    }

    setError('')
    setIsSubmitting(true)
    try {
      if (isSignup) await signUpWithEmail(displayName.trim(), email.trim(), password)
      else await signInWithEmail(email.trim(), password)
      finishAuthentication()
    } catch (authError) {
      setError(firebaseErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function continueWithGoogle() {
    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Add the VITE_FIREBASE_* values to .env.local.')
      return
    }
    setError('')
    setIsSubmitting(true)
    try {
      await signInWithGoogle()
      finishAuthentication()
    } catch (authError) {
      setError(firebaseErrorMessage(authError))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="mx-auto grid w-full max-w-md gap-5 py-10">
      <div className="section-heading text-center">
        <p className="eyebrow">ToolStack account</p>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">
          {state?.intent === 'save-json'
            ? 'Sign in to save your JSON securely and access it on other devices.'
            : 'Public tools stay available without an account. Sign in to save your work.'}
        </p>
      </div>

      <form className="tool-panel grid gap-4" onSubmit={(event) => void submit(event)}>
        {isSignup && (
          <label className="grid gap-2">
            <span className="text-sm font-medium">Display name</span>
            <Input autoComplete="name" required value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
          </label>
        )}
        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <Input autoComplete="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label className="grid gap-2">
          <span className="text-sm font-medium">Password</span>
          <Input autoComplete={isSignup ? 'new-password' : 'current-password'} minLength={6} type="password" required value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>

        {error && <p className="rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-400" role="alert">{error}</p>}

        <Button type="submit" disabled={isSubmitting}>
          {isSignup ? <UserPlus size={17} /> : <LogIn size={17} />}
          {isSubmitting ? 'Please wait…' : isSignup ? 'Create account' : 'Sign in'}
        </Button>
        <div className="flex items-center gap-3 text-xs text-slate-500"><span className="h-px flex-1 bg-slate-700" />OR<span className="h-px flex-1 bg-slate-700" /></div>
        <Button variant="secondary" disabled={isSubmitting} onClick={() => void continueWithGoogle()}>Continue with Google</Button>

        <p className="text-center text-sm muted">
          {isSignup ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link className="text-indigo-400" to={isSignup ? '/login' : '/signup'} state={state}>
            {isSignup ? 'Sign in' : 'Create one'}
          </Link>
        </p>
      </form>
    </section>
  )
}
