import React, { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const defaults = {
  id: 1,
  target_amount: 200,
  reached_amount: 146,
  progress_percent: 73,
  start_date: '2026-05-12',
  completion_date: '2026-10-21',
  withdrawal_enabled: false,
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

export default function App() {
  const [page, setPage] = useState(() => window.location.hash === '#reset' ? 'reset' : 'welcome');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [user, setUser] = useState(null);
  const [settings, setSettings] = useState(defaults);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const configured = Boolean(supabase);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user);
        setPage(data.session.user.app_metadata?.role === 'admin' ? 'admin' : 'dashboard');
        loadSettings();
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadSettings() {
    if (!supabase) return;
    const { data } = await supabase.from('program_settings').select('*').eq('id', 1).maybeSingle();
    if (data) setSettings(data);
  }

  async function signIn(event) {
    event.preventDefault();
    if (!supabase) return setMessage('Supabase is not configured. Add the Vercel environment variables first.');
    setBusy(true); setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setMessage(error.message);
    setUser(data.user);
    await loadSettings();
    setPage(data.user.app_metadata?.role === 'admin' ? 'admin' : 'dashboard');
  }

  async function forgotPassword(event) {
    event.preventDefault();
    if (!supabase) return setMessage('Supabase is not configured.');
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#reset`,
    });
    setBusy(false);
    setMessage(error ? error.message : 'If this email belongs to an account, a password reset email has been sent.');
  }

  async function updatePassword(event) {
    event.preventDefault();
    if (newPassword.length < 8) return setMessage('Password must be at least 8 characters.');
    if (!supabase) return setMessage('Supabase is not configured.');
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setBusy(false);
    if (error) return setMessage(error.message);
    setMessage('Password updated successfully.');
    setNewPassword('');
    setPage('login');
    window.location.hash = '';
  }

  async function saveSettings() {
    if (!supabase) return setMessage('Supabase is not configured.');
    setBusy(true); setMessage('');
    const { error } = await supabase.from('program_settings').upsert({ ...settings, id: 1 });
    setBusy(false);
    setMessage(error ? 'Unable to save. Check the table and admin RLS policy.' : 'Program settings saved successfully.');
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null); setPage('welcome'); setMessage('');
  }

  const progress = Math.max(0, Math.min(100, Number(settings.progress_percent) || 0));
  const role = user?.app_metadata?.role;

  if (page === 'welcome') return <Welcome onLogin={() => setPage('login')} />;
  if (page === 'login') return <Auth title="Welcome back" subtitle="Sign in to your private IB PROGRAM dashboard." onBack={() => setPage('welcome')}>
    <form onSubmit={signIn}>
      <Field label="Email address" type="email" value={email} onChange={setEmail} required />
      <Field label="Password" type="password" value={password} onChange={setPassword} required />
      <button className="primary" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form>
    <button className="textButton" onClick={() => { setMessage(''); setPage('forgot'); }}>Forgot password?</button>
    {!configured && <Notice>Supabase environment variables are not configured yet.</Notice>}
    {message && <Notice>{message}</Notice>}
  </Auth>;
  if (page === 'forgot') return <Auth title="Reset your password" subtitle="Enter your email and we'll send a secure reset link." onBack={() => setPage('login')}>
    <form onSubmit={forgotPassword}>
      <Field label="Email address" type="email" value={email} onChange={setEmail} required />
      <button className="primary" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
    </form>
    {message && <Notice>{message}</Notice>}
  </Auth>;
  if (page === 'reset') return <Auth title="Create a new password" subtitle="Choose a strong password with at least 8 characters." onBack={() => setPage('login')}>
    <form onSubmit={updatePassword}>
      <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} required minLength={8} />
      <button className="primary" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
    </form>
    {message && <Notice>{message}</Notice>}
  </Auth>;
  if (page === 'admin' && role === 'admin') return <Shell user={user} onLogout={logout}>
    <div className="eyebrow">ADMIN CONTROL</div><h1>Program settings</h1><p className="muted">Update the dashboard values without changing the code.</p>
    <div className="settingsGrid">
      <Field label="Target amount ($)" type="number" value={settings.target_amount} onChange={v => setSettings({ ...settings, target_amount: Number(v) })} />
      <Field label="Amount reached ($)" type="number" value={settings.reached_amount} onChange={v => setSettings({ ...settings, reached_amount: Number(v) })} />
      <Field label="Progress (%)" type="number" value={settings.progress_percent} onChange={v => setSettings({ ...settings, progress_percent: Number(v) })} />
      <Field label="Start date" type="date" value={settings.start_date} onChange={v => setSettings({ ...settings, start_date: v })} />
      <Field label="Expected completion" type="date" value={settings.completion_date} onChange={v => setSettings({ ...settings, completion_date: v })} />
    </div>
    <label className="check"><input type="checkbox" checked={Boolean(settings.withdrawal_enabled)} onChange={e => setSettings({ ...settings, withdrawal_enabled: e.target.checked })} /> Enable withdrawal</label>
    <button className="primary compact" onClick={saveSettings} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
    {message && <Notice>{message}</Notice>}
  </Shell>;

  return <Shell user={user} onLogout={logout}>
    <div className="eyebrow">YOUR PROGRAM</div><h1>Progress dashboard</h1><p className="muted">Your latest IB PROGRAM progress at a glance.</p>
    <div className="statCard"><div className="statTop"><span>Progress</span><strong>{progress}%</strong></div><div className="bar"><span style={{ width: `${progress}%` }} /></div><div className="amount"><strong>${settings.reached_amount}</strong><span>of ${settings.target_amount}</span></div></div>
    <div className="details"><div><span>Start date</span><b>{settings.start_date}</b></div><div><span>Expected completion</span><b>{settings.completion_date}</b></div></div>
    <button className="primary" disabled={!settings.withdrawal_enabled && progress < 100}>{settings.withdrawal_enabled || progress >= 100 ? 'Withdrawal available' : 'Withdrawal locked'}</button>
  </Shell>;
}

function Welcome({ onLogin }) { return <main className="landing"><nav className="nav"><img src="/ib-program-logo.png" alt="IB PROGRAM" /><button className="ghost" onClick={onLogin}>Sign in</button></nav><section className="heroGrid"><div><div className="eyebrow">SECURE ACCOUNT ACCESS</div><h1>Everything about your <em>IB PROGRAM</em>, in one place.</h1><p>Secure sign-in, password recovery and a clean progress dashboard built for simple account management.</p><button className="primary heroButton" onClick={onLogin}>Access your account <span>→</span></button></div><div className="featureCard"><img src="/ib-program-logo.png" alt="IB Program logo" /><h2>Partner with success.</h2><p>Track your progress with a focused, professional dashboard.</p><div className="mini"><span>Secure access</span><span>Live progress</span><span>Account control</span></div></div></section></main> }
function Auth({ title, subtitle, children, onBack }) { return <main className="auth"><div className="authBox"><button className="back" onClick={onBack}>← Back</button><img className="authLogo" src="/ib-program-logo.png" alt="IB PROGRAM" /><h1>{title}</h1><p className="muted">{subtitle}</p>{children}</div></main> }
function Shell({ children, user, onLogout }) { return <main className="dashboard"><nav className="nav"><img src="/ib-program-logo.png" alt="IB PROGRAM" /><div className="navRight"><span className="userEmail">{user?.email}</span><button className="ghost" onClick={onLogout}>Log out</button></div></nav><section className="dashContent">{children}</section></main> }
function Field({ label, type='text', value, onChange, ...props }) { return <label className="field"><span>{label}</span><input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} {...props} /></label> }
function Notice({ children }) { return <div className="notice">{children}</div> }
