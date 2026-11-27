import { useState, type FormEvent } from 'react'
import { errorMessage } from '../api'

export function SignIn({
  demo,
  signIn,
}: {
  demo: boolean
  signIn: (email: string, password: string) => Promise<void>
}) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await signIn(email.trim(), password)
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="sign-in">
      <section className="panel sign-in-panel" aria-labelledby="sign-in-title">
        <span className="brand">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          Accountable
        </span>
        <h1 id="sign-in-title">登入</h1>
        <form onSubmit={submit}>
          <fieldset disabled={busy}>
            <div className="field">
              <label htmlFor="sign-in-email">電子郵件</label>
              <input
                id="sign-in-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="sign-in-password">密碼</label>
              <input
                id="sign-in-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
          </fieldset>
          {message && (
            <p role="alert" className="notice">
              {message}
            </p>
          )}
          <button className="primary" type="submit" disabled={busy}>
            {busy ? '登入中…' : '登入'}
          </button>
        </form>
        {demo && <p className="muted">本機帳號為 alex@example.test 或 sam@example.test，密碼為 accountable-demo。</p>}
      </section>
    </main>
  )
}
