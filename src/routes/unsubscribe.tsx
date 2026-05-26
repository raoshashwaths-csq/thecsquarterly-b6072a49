import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

export const Route = createFileRoute('/unsubscribe')({
  component: UnsubscribePage,
  head: () => ({
    meta: [
      { title: 'Unsubscribe · The CS Quarterly' },
      { name: 'robots', content: 'noindex,nofollow' },
    ],
  }),
})

type Status = 'loading' | 'valid' | 'already' | 'invalid' | 'done' | 'error'

function UnsubscribePage() {
  const [status, setStatus] = useState<Status>('loading')
  const [submitting, setSubmitting] = useState(false)

  const token =
    typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search).get('token')
      : null

  useEffect(() => {
    if (!token) {
      setStatus('invalid')
      return
    }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}))
        if (!r.ok) return setStatus('invalid')
        if (data.valid) return setStatus('valid')
        if (data.reason === 'already_unsubscribed') return setStatus('already')
        setStatus('invalid')
      })
      .catch(() => setStatus('error'))
  }, [token])

  const confirm = async () => {
    if (!token) return
    setSubmitting(true)
    try {
      const r = await fetch('/email/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
      const data = await r.json().catch(() => ({}))
      if (r.ok && data.success) setStatus('done')
      else if (data.reason === 'already_unsubscribed') setStatus('already')
      else setStatus('error')
    } catch {
      setStatus('error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6 py-24">
      <div className="max-w-lg w-full">
        <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-accent mb-5">
          The CS Quarterly · Email Preferences
        </p>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.05] tracking-tight text-balance mb-6">
          {status === 'done' ? 'You are unsubscribed.' :
           status === 'already' ? 'Already unsubscribed.' :
           status === 'invalid' ? 'This link is no longer valid.' :
           status === 'error' ? 'Something went wrong.' :
           'Unsubscribe from The CS Quarterly?'}
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed mb-8">
          {status === 'loading' && 'Checking your link…'}
          {status === 'valid' && 'Confirming below will stop all transactional and dispatch emails to this address. You can resubscribe any time from your account.'}
          {status === 'done' && 'We will not send further emails to this address. If this was a mistake, sign in to your account to resubscribe.'}
          {status === 'already' && 'This address is already opted out. No further action is needed.'}
          {status === 'invalid' && 'The token in the link is invalid or expired. If you reached this page from an email, please use the most recent message.'}
          {status === 'error' && 'Please refresh and try again, or reply to any dispatch and we will handle it manually.'}
        </p>
        {status === 'valid' && (
          <button
            onClick={confirm}
            disabled={submitting}
            className="inline-flex items-center font-mono text-xs tracking-[0.12em] uppercase bg-foreground text-background px-6 py-3 hover:opacity-90 disabled:opacity-60 transition"
          >
            {submitting ? 'Working…' : 'Confirm unsubscribe'}
          </button>
        )}
      </div>
    </main>
  )
}
