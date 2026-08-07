import React, { useState } from 'react'

const progress = 73
const target = 200
const reached = 146

export default function App() {
  const [page, setPage] = useState('welcome')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')

  function signIn(e) {
    e.preventDefault()
    setPage('dashboard')
    setMessage('')
  }

  function forgot(e) {
    e.preventDefault()
    setMessage('If this email is registered, a password reset link will be sent.')
  }

  return (
    <main className="app">
      <section className="card">
        {page === 'welcome' && (
          <>
            <div className="brand">IB PROGRAM</div>
            <h1>Welcome</h1>
            <p className="muted">Track your programme progress in one place.</p>
            <button onClick={() => setPage('login')}>Sign in</button>
          </>
        )}

        {page === 'login' && (
          <>
            <div className="brand">IB PROGRAM</div>
            <h2>Sign in</h2>
            <form onSubmit={signIn}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required />
              <input type="password" placeholder="Password" value={password}
                onChange={e => setPassword(e.target.value)} required />
              <button type="submit">Sign in</button>
            </form>
            <button className="link" onClick={() => setPage('forgot')}>Forgot password?</button>
          </>
        )}

        {page === 'forgot' && (
          <>
            <div className="brand">IB PROGRAM</div>
            <h2>Reset password</h2>
            <p className="muted">Enter your email to request a password reset.</p>
            <form onSubmit={forgot}>
              <input type="email" placeholder="Email address" value={email}
                onChange={e => setEmail(e.target.value)} required />
              <button type="submit">Send reset link</button>
            </form>
            {message && <p className="notice">{message}</p>}
            <button className="link" onClick={() => setPage('login')}>Back to sign in</button>
          </>
        )}

        {page === 'dashboard' && (
          <>
            <div className="topline">
              <div>
                <div className="brand">IB PROGRAM</div>
                <h2>Progress dashboard</h2>
              </div>
              <button className="small" onClick={() => setPage('welcome')}>Log out</button>
            </div>

            <div className="progressBox">
              <div className="progressHeader">
                <span>Progress</span><strong>{progress}%</strong>
              </div>
              <div className="bar"><div style={{width: `${progress}%`}} /></div>
              <div className="roadmap">
                <span>$0</span>
                <strong>${reached}</strong>
                <span>${target}</span>
              </div>
              <p className="muted">${reached} of ${target} reached</p>
            </div>

            <div className="dates">
              <div><span>Starting date</span><strong>12 May 2026</strong></div>
              <div><span>Expected completion</span><strong>21 Oct 2026</strong></div>
            </div>

            <button className="withdraw" disabled={progress < 100}>
              {progress < 100 ? 'Withdrawal locked until 100%' : 'Withdraw'}
            </button>
            <p className="muted smallText">Withdrawal becomes available when progress reaches 100%.</p>
          </>
        )}
      </section>
    </main>
  )
}
