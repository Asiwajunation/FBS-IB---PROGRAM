import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

function ReferenceWithdrawal() {
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState('');
  const [stage, setStage] = useState<'form' | 'processing' | 'accepted'>('form');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button');
      if (!button) return;
      const text = button.textContent?.trim().toLowerCase() || '';
      if (!text.includes('withdrawal available')) return;
      event.preventDefault();
      event.stopPropagation();
      setAccount('');
      setError('');
      setStage('form');
      setOpen(true);
    };
    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  const close = () => setOpen(false);
  const continueFlow = () => {
    if (!account.trim()) {
      setError('Please enter your FBS Partner Account.');
      return;
    }
    setError('');
    setStage('processing');
    window.setTimeout(() => setStage('accepted'), 2200);
  };

  if (!open) return null;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) close(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 99999 }}
    >
      <div style={{ width: '100%', maxWidth: 430, background: '#fff', color: '#111', borderRadius: 16, padding: 28, boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
          <h3 style={{ margin: 0 }}>Add FBS Partner Account</h3>
          <button type="button" onClick={close} style={{ border: 0, background: 'transparent', fontSize: 26, cursor: 'pointer', padding: '2px 8px' }}>×</button>
        </div>

        {stage === 'form' && (
          <div>
            <p style={{ lineHeight: 1.5 }}>Enter your FBS Partner Account to continue this reference withdrawal flow.</p>
            <label htmlFor="fbs-partner-account" style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 7 }}>FBS Partner Account</label>
            <input
              id="fbs-partner-account"
              type="text"
              value={account}
              onChange={(e) => { setAccount(e.target.value); setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); continueFlow(); } }}
              placeholder="Enter your FBS Partner Account"
              autoComplete="off"
              autoFocus
              style={{ width: '100%', minHeight: 52, boxSizing: 'border-box', padding: 14, border: '1px solid #777', borderRadius: 9, fontSize: 16 }}
            />
            {error && <p style={{ color: '#b00020', fontSize: 13, marginBottom: 8 }}>{error}</p>}
            <button type="button" onClick={continueFlow} style={{ width: '100%', minHeight: 52, marginTop: 12, padding: 14, borderRadius: 9, border: 0, cursor: 'pointer', fontSize: 16, fontWeight: 700 }}>Continue</button>
          </div>
        )}

        {stage === 'processing' && (
          <div style={{ padding: '18px 0' }}>
            <p style={{ fontWeight: 700 }}>Processing reference withdrawal…</p>
            <p>Please wait.</p>
          </div>
        )}

        {stage === 'accepted' && (
          <div style={{ padding: '18px 0' }}>
            <h4 style={{ marginBottom: 8 }}>Accepted</h4>
            <p>This reference withdrawal flow has been accepted. No funds have been transferred.</p>
            <button type="button" onClick={close} style={{ padding: '12px 20px', borderRadius: 9, cursor: 'pointer' }}>Close</button>
          </div>
        )}

        <p style={{ fontSize: 11, opacity: .65, marginTop: 18 }}>REFERENCE — This interface does not execute or confirm a real financial withdrawal.</p>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <ReferenceWithdrawal />
  </React.StrictMode>
);
