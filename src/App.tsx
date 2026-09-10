import React, { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

// Reference-only withdrawal experience. No funds are transferred or claimed to have been transferred.
type Settings = {
  id: number; target_amount: number; reached_amount: number; progress_percent: number; withdrawal_enabled: boolean;
  start_date: string; completion_date: string; crypto_asset: string; crypto_network: string; deposit_address: string;
};

const DEFAULTS: Settings = { id:1, target_amount:200, reached_amount:200, progress_percent:100, withdrawal_enabled:false, start_date:'2026-05-12', completion_date:'2026-10-21', crypto_asset:'USDT', crypto_network:'Mantle', deposit_address:'0x7f20516c1a848406a0ce4094c2f2214d9dcabb19' };

export default function App(){
  const [user,setUser]=useState<User|null>(null); const [settings,setSettings]=useState(DEFAULTS);
  const [withdrawalOpen,setWithdrawalOpen]=useState(false); const [partnerAccount,setPartnerAccount]=useState(''); const [withdrawalStage,setWithdrawalStage]=useState<'form'|'processing'|'accepted'>('form');
  useEffect(()=>{ supabase.auth.getUser().then(({data})=>setUser(data.user)); const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null)); return()=>sub.subscription.unsubscribe(); },[]);
  useEffect(()=>{ if(!user)return; supabase.from('program_settings').select('*').eq('id',1).maybeSingle().then(({data})=>{if(data)setSettings(data as Settings)}); },[user]);
  const withdrawalAvailable=settings.withdrawal_enabled||settings.progress_percent>=100;
  const startWithdrawal=()=>{if(withdrawalAvailable){setWithdrawalStage('form');setPartnerAccount('');setWithdrawalOpen(true)}};
  const submitPartner=()=>{if(!partnerAccount.trim())return;setWithdrawalStage('processing');window.setTimeout(()=>setWithdrawalStage('accepted'),2200)};
  if(!user) return <main style={{fontFamily:'Arial',padding:40}}>Please sign in to continue.</main>;
  return <main style={{fontFamily:'Arial',maxWidth:900,margin:'0 auto',padding:24}}>
    <section style={{padding:24,borderRadius:16,border:'1px solid #ddd'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1>IB PROGRAM</h1><span style={{fontSize:12,border:'1px solid #999',padding:'4px 8px',borderRadius:8}}>REFERENCE</span></div>
      <h2>Program 1</h2><p>Amount reached: <b>${settings.reached_amount.toFixed(2)}</b> / ${settings.target_amount.toFixed(2)}</p>
      <div style={{height:12,background:'#eee',borderRadius:8,overflow:'hidden'}}><div style={{width:`${Math.min(settings.progress_percent,100)}%`,height:'100%',background:'#111'}}/></div>
      <p>{settings.progress_percent}% complete</p>
      <button onClick={startWithdrawal} disabled={!withdrawalAvailable} style={{padding:'12px 20px',borderRadius:10,cursor:withdrawalAvailable?'pointer':'not-allowed'}}>Withdrawal</button>
    </section>
    {withdrawalOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'grid',placeItems:'center',padding:20}}><div style={{background:'#fff',padding:28,borderRadius:16,maxWidth:430,width:'100%'}}>
      <div style={{display:'flex',justifyContent:'space-between'}}><h3>Withdrawal — Reference</h3><button onClick={()=>setWithdrawalOpen(false)}>×</button></div>
      {withdrawalStage==='form'&&<><p>Add your FBS Partner Account to continue this reference withdrawal flow.</p><input value={partnerAccount} onChange={e=>setPartnerAccount(e.target.value)} placeholder="FBS Partner Account" style={{width:'100%',boxSizing:'border-box',padding:12,marginBottom:12}}/><button onClick={submitPartner} style={{padding:'11px 16px'}}>Add Account</button></>}
      {withdrawalStage==='processing'&&<><p>Processing reference withdrawal…</p><div aria-label="processing">Please wait.</div></>}
      {withdrawalStage==='accepted'&&<><h4>Accepted</h4><p>This reference withdrawal flow has been accepted for demonstration purposes. No funds have been transferred.</p><button onClick={()=>setWithdrawalOpen(false)}>Close</button></>}
      <p style={{fontSize:11,opacity:.65,marginTop:18}}>REFERENCE — This interface does not execute or confirm a real financial withdrawal.</p>
    </div></div>}
  </main>;
}
