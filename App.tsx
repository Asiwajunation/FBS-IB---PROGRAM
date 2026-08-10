import React, { useEffect, useState } from 'react';
import { createClient, type User } from '@supabase/supabase-js';

type Settings = {
  id: number;
  target_amount: number;
  reached_amount: number;
  progress_percent: number;
  start_date: string;
  completion_date: string;
  withdrawal_enabled: boolean;
};

const DEFAULTS: Settings = {
  id: 1,
  target_amount: 200,
  reached_amount: 148,
  progress_percent: 73,
  start_date: '2026-05-12',
  completion_date: '2026-10-21',
  withdrawal_enabled: false,
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

function money(value: number): string {
  return `$${Number(value || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function prettyDate(value: string): string {
  if (!value) return '—';
  const d = new Date(`${value}T00:00:00`);
  return Number.isNaN(d.getTime())
    ? value
    : d.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
}

export default function App() {
  const [page, setPage] = useState<'welcome' | 'login' | 'forgot' | 'reset' | 'dashboard' | 'admin'>(
    window.location.hash === '#reset' ? 'reset' : 'welcome'
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted || !data.session?.user) return;
      const current = data.session.user;
      setUser(current);
      setPage(current.app_metadata?.role === 'admin' ? 'admin' : 'dashboard');
      void loadSettings();
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function loadSettings() {
    if (!supabase) return;

    const { data } = await supabase
      .from('program_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (data) setSettings({ ...DEFAULTS, ...data });
  }

  function go(next: typeof page) {
    setMessage('');
    setPage(next);
  }

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Supabase is not configured. Add the Vercel environment variables.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setUser(data.user);
    await loadSettings();
    setPage(data.user.app_metadata?.role === 'admin' ? 'admin' : 'dashboard');
  }

  async function forgot(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/#reset`,
    });

    setBusy(false);
    setMessage(
      error
        ? error.message
        : 'If this email belongs to an account, a reset email has been sent.'
    );
  }

  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (newPassword.length < 8) {
      setMessage('Password must be at least 8 characters.');
      return;
    }

    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    setBusy(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setNewPassword('');
    window.location.hash = '';
    setPage('login');
    setMessage('Password updated successfully.');
  }

  async function saveSettings() {
    if (!supabase) {
      setMessage('Supabase is not configured.');
      return;
    }

    setBusy(true);
    setMessage('');

    const payload = {
      id: 1,
      target_amount: Number(settings.target_amount) || 0,
      reached_amount: Number(settings.reached_amount) || 0,
      progress_percent: Math.max(0, Math.min(100, Number(settings.progress_percent) || 0)),
      start_date: settings.start_date || null,
      completion_date: settings.completion_date || null,
      withdrawal_enabled: Boolean(settings.withdrawal_enabled),
    };

    const { data, error } = await supabase
      .from('program_settings')
      .upsert(payload)
      .select()
      .maybeSingle();

    setBusy(false);

    if (error) {
      setMessage(`Unable to save: ${error.message}`);
      return;
    }

    setSettings({ ...DEFAULTS, ...(data ?? payload) });
    setMessage('Program settings saved successfully.');
  }

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    setUser(null);
    setPage('welcome');
    setMessage('');
  }

  const progress = Math.max(0, Math.min(100, Number(settings.progress_percent) || 0));
  const isAdmin = user?.app_metadata?.role === 'admin';
  const withdrawalAvailable = Boolean(settings.withdrawal_enabled) || progress >= 100;

  if (page === 'welcome') return <Welcome onLogin={() => go('login')} />;

  if (page === 'login') {
    return (
      <Auth title="Welcome back" subtitle="Sign in to your private IB PROGRAM dashboard." onBack={() => go('welcome')}>
        <form onSubmit={signIn}>
          <Field label="Email address" type="email" value={email} onChange={setEmail} required />
          <Field label="Password" type="password" value={password} onChange={setPassword} required />
          <button className="primary full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
        <button className="textButton" onClick={() => go('forgot')}>Forgot password?</button>
        {!supabase && <Notice>Supabase environment variables are not configured yet.</Notice>}
        {message && <Notice>{message}</Notice>}
      </Auth>
    );
  }

  if (page === 'forgot') {
    return (
      <Auth title="Reset your password" subtitle="Enter your email and we'll send a secure reset link." onBack={() => go('login')}>
        <form onSubmit={forgot}>
          <Field label="Email address" type="email" value={email} onChange={setEmail} required />
          <button className="primary full" disabled={busy}>{busy ? 'Sending…' : 'Send reset link'}</button>
        </form>
        {message && <Notice>{message}</Notice>}
      </Auth>
    );
  }

  if (page === 'reset') {
    return (
      <Auth title="Create a new password" subtitle="Choose a strong password with at least 8 characters." onBack={() => go('login')}>
        <form onSubmit={resetPassword}>
          <Field label="New password" type="password" value={newPassword} onChange={setNewPassword} minLength={8} required />
          <button className="primary full" disabled={busy}>{busy ? 'Updating…' : 'Update password'}</button>
        </form>
        {message && <Notice>{message}</Notice>}
      </Auth>
    );
  }

  if (page === 'admin' && isAdmin) {
    return (
      <Shell user={user} onLogout={logout}>
        <div className="eyebrow">ADMIN CONTROL</div>
        <h1>Program settings</h1>
        <p className="muted">Update the values displayed on the dashboard.</p>

        <div className="settingsGrid">
          <Field label="Target amount ($)" type="number" value={settings.target_amount}
            onChange={(v) => setSettings({ ...settings, target_amount: Number(v) })} />
          <Field label="Amount reached ($)" type="number" value={settings.reached_amount}
            onChange={(v) => setSettings({ ...settings, reached_amount: Number(v) })} />
          <Field label="Progress (%)" type="number" value={settings.progress_percent}
            onChange={(v) => setSettings({ ...settings, progress_percent: Number(v) })} />
          <Field label="Start date" type="date" value={settings.start_date}
            onChange={(v) => setSettings({ ...settings, start_date: v })} />
          <Field label="Expected completion" type="date" value={settings.completion_date}
            onChange={(v) => setSettings({ ...settings, completion_date: v })} />
        </div>

        <label className="check">
          <input type="checkbox" checked={Boolean(settings.withdrawal_enabled)}
            onChange={(e) => setSettings({ ...settings, withdrawal_enabled: e.target.checked })} />
          Enable withdrawal
        </label>

        <button className="primary" onClick={saveSettings} disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </button>

        {message && <Notice>{message}</Notice>}
      </Shell>
    );
  }

  if (!user) return <Welcome onLogin={() => go('login')} />;

  return (
    <Shell user={user} onLogout={logout}>
      <div className="eyebrow">YOUR PROGRAM</div>
      <h1>Progress dashboard</h1>
      <p className="muted">Your latest IB PROGRAM information at a glance.</p>

      <section className="amountSummary" aria-label="Program amounts">
        <div className="amountBox">
          <span>AMOUNT REACHED</span>
          <strong>{money(settings.reached_amount)}</strong>
        </div>
        <div className="amountBox">
          <span>TARGET AMOUNT</span>
          <strong>{money(settings.target_amount)}</strong>
        </div>
        <div className="amountBox">
          <span>PROGRESS</span>
          <strong>{progress}%</strong>
        </div>
      </section>

      <section className="statCard">
        <div className="statTop">
          <span>Program Progress</span>
          <strong>{progress}%</strong>
        </div>
        <div className="bar"><span style={{ width: `${progress}%` }} /></div>

        <div className="details">
          <InfoDetail label="Amount reached" value={money(settings.reached_amount)} />
          <InfoDetail label="Target amount" value={money(settings.target_amount)} />
          <InfoDetail label="Start date" value={prettyDate(settings.start_date)} />
          <InfoDetail label="Expected completion" value={prettyDate(settings.completion_date)} />
        </div>
      </section>

      <section className="statusBox">
        <div>
          <span>Withdrawal status</span>
          <strong>{withdrawalAvailable ? 'Available' : 'Locked'}</strong>
        </div>
        <button className="primary compact" disabled={!withdrawalAvailable}>
          {withdrawalAvailable ? 'Withdrawal available' : 'Withdrawal locked'}
        </button>
      </section>
    </Shell>
  );
}

function Welcome({ onLogin }: { onLogin: () => void }) {
  return (
    <main className="landing">
      <nav className="nav">
        <div className="brand">IB PROGRAM</div>
        <button className="ghost" onClick={onLogin}>Sign in</button>
      </nav>
      <section className="hero">
        <div className="eyebrow">IB PROGRAM</div>
        <h1>Welcome to your<br />private dashboard.</h1>
        <p className="muted">Securely access your IB PROGRAM account and monitor your program progress.</p>
        <button className="primary" onClick={onLogin}>Access dashboard</button>
      </section>
    </main>
  );
}

function Auth({ title, subtitle, children, onBack }: {
  title: string; subtitle: string; children: React.ReactNode; onBack: () => void;
}) {
  return (
    <main className="auth">
      <div className="authBox">
        <button className="back" onClick={onBack}>← Back</button>
        <div className="brand authBrand">IB PROGRAM</div>
        <h1>{title}</h1>
        <p className="muted">{subtitle}</p>
        {children}
      </div>
    </main>
  );
}

function Shell({ children, user, onLogout }: {
  children: React.ReactNode; user: User; onLogout: () => void;
}) {
  return (
    <main className="dashboard">
      <nav className="nav">
        <div className="brand">IB PROGRAM</div>
        <div className="navRight">
          <span className="user">{user.email ?? 'Guest'}</span>
          <button className="ghost" onClick={onLogout}>Sign out</button>
        </div>
      </nav>
      <section className="content">{children}</section>
    </main>
  );
}

function Field({ label, type = 'text', value, onChange, ...props }: {
  label: string;
  type?: React.HTMLInputTypeAttribute;
  value: string | number;
  onChange: (value: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );
}

function InfoDetail({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><b>{value}</b></div>;
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="notice">{children}</div>;
}
