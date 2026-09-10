import React, { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Settings = {
  id: number; target_amount: number; reached_amount: number; progress_percent: number; withdrawal_enabled: boolean;
  start_date: string; completion_date: string; crypto_asset: string; crypto_network: string; deposit_address: string;
};

const DEFAULTS: Settings = { id:1, target_amount:200, reached_amount:200, progress_percent:100, withdrawal_enabled:false, start_date:'2026-05-12', completion_date:'2026-10-21', crypto_asset:'USDT', crypto_network:'Mantle', deposit_address:'0x7f20516c1a848406a0ce4094c2f2214d9dcabb19' };

export default function App(){
  const [user,setUser]=useState<User|null>(null);
  const [settings,setSettings]=useState(DEFAULTS);
  const [withdrawalOpen,setWithdrawalOpen]=useState(false);
  const [partnerAccount,setPartnerAccount]=useState('');
  const partnerInputRef=useRef<HTMLInputElement|null>(null);
  const [withdrawalStage,setWithdrawalStage]=useState<'form'|'processing'|'accepted'>('form');
  const [error,setError]=useState('');

  useEffect(()=>{
    supabase.auth.getUser().then(({data})=>setUser(data.user));
    const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));
    return()=>sub.subscription.unsubscribe();
  },[]);

  useEffect(()=>{
    if(!user)return;
    supabase.from('program_settings').select('*').eq('id',1).maybeSingle().then(({data})=>{if(data)setSettings(data as Settings)});
  },[user]);

  const withdrawalAvailable=settings.withdrawal_enabled||settings.progress_percent>=100;

  const startWithdrawal=()=>{
    if(!withdrawalAvailable)return;
    setError('');
    setPartnerAccount('');
    setWithdrawalStage('form');
    setWithdrawalOpen(true);
    window.setTimeout(()=>partnerInputRef.current?.focus(),100);
  };

  const addPartnerAccount=()=>{
    // Read directly from the input as well as React state so mobile/browser input handling cannot leave the button with stale state.
    const account=(partnerInputRef.current?.value ?? partnerAccount).trim();
    if(!account){
      setError('Please enter your FBS Partner Account.');
      partnerInputRef.current?.focus();
      return;
    }
    setError('');
    setPartnerAccount(account);
    setWithdrawalStage('processing');
    window.setTimeout(()=>setWithdrawalStage('accepted'),2200);
  };

  if(!user) return <main style={{fontFamily:'Arial',padding:40}}>Please sign in to continue.</main>;

  return <main style={{fontFamily:'Arial',maxWidth:900,margin:'0 auto',padding:24}}>
    <section style={{padding:24,borderRadius:16,border:'1px solid #ddd'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1>IB PROGRAM</h1><span style={{fontSize:12,border:'1px solid #999',padding:'4px 8px',borderRadius:8}}>REFERENCE</span></div>
      <h2>Program 1</h2>
      <p>Amount reached: <b>${settings.reached_amount.toFixed(2)}</b> / ${settings.target_amount.toFixed(2)}</p>
      <div style={{height:12,background:'#eee',borderRadius:8,overflow:'hidden'}}><div style={{width:`${Math.min(settings.progress_percent,100)}%`,height:'100%',background:'#111'}}/></div>
      <p>{settings.progress_percent}% complete</p>
      <button type="button" onClick={startWithdrawal} disabled={!withdrawalAvailable} style={{padding:'12px 20px',borderRadius:10,cursor:withdrawalAvailable?'pointer':'not-allowed'}}>Withdrawal</button>
    </section>

    {withdrawalOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',padding:20,zIndex:1000}}>
      <div style={{background:'#fff',padding:28,borderRadius:16,maxWidth:430,width:'100%',boxSizing:'border-box'}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <h3 style={{margin:0}}>Withdrawal — Reference</h3>
          <button type="button" onClick={()=>setWithdrawalOpen(false)} aria-label="Close">×</button>
        </div>

        {withdrawalStage==='form'&&<div>
          <p>Add your FBS Partner Account to continue this reference withdrawal flow.</p>
          <label htmlFor="partner-account" style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>FBS Partner Account</label>
          <input
            ref={partnerInputRef}
            id="partner-account"
            type="text"
            value={partnerAccount}
            onChange={e=>{setPartnerAccount(e.currentTarget.value);setError('');}}
            onInput={e=>{setPartnerAccount(e.currentTarget.value);setError('');}}
            placeholder="Enter your FBS Partner Account"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            style={{display:'block',width:'100%',boxSizing:'border-box',padding:14,marginBottom:8,border:'1px solid #999',borderRadius:8,fontSize:16,minHeight:52,touchAction:'manipulation'}}
          />
          {error&&<p role="alert" style={{color:'#b00020',fontSize:13,margin:'4px 0 10px'}}>{error}</p>}
          <button
            type="button"
            onClick={addPartnerAccount}
            onTouchEnd={e=>{e.preventDefault();addPartnerAccount();}}
            style={{width:'100%',padding:'13px 16px',borderRadius:8,cursor:'pointer',fontSize:16,minHeight:52,touchAction:'manipulation'}}
          >Continue</button>
        </div>}

        {withdrawalStage==='processing'&&<div><p>Processing reference withdrawal…</p><div aria-label="processing">Please wait.</div></div>}
        {withdrawalStage==='accepted'&&<><h4>Accepted</h4><p>This reference withdrawal flow has been accepted for demonstration purposes. No funds have been transferred.</p><button type="button" onClick={()=>setWithdrawalOpen(false)}>Close</button></>}
        <p style={{fontSize:11,opacity:.65,marginTop:18}}>REFERENCE — This interface does not execute or confirm a real financial withdrawal.</p>
      </div>
    </div>}
  </main>;
}
