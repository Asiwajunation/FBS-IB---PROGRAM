import React, { useEffect, useRef, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

type Settings = { id:number; target_amount:number; reached_amount:number; progress_percent:number; withdrawal_enabled:boolean; start_date:string; completion_date:string; crypto_asset:string; crypto_network:string; deposit_address:string };
const DEFAULTS:Settings={id:1,target_amount:200,reached_amount:200,progress_percent:100,withdrawal_enabled:false,start_date:'2026-05-12',completion_date:'2026-10-21',crypto_asset:'USDT',crypto_network:'Mantle',deposit_address:'0x7f20516c1a848406a0ce4094c2f2214d9dcabb19'};

export default function App(){
 const [user,setUser]=useState<User|null>(null),[settings,setSettings]=useState(DEFAULTS),[withdrawalOpen,setWithdrawalOpen]=useState(false),[partnerAccount,setPartnerAccount]=useState(''),[stage,setStage]=useState<'form'|'processing'|'accepted'>('form'),[error,setError]=useState('');
 const inputRef=useRef<HTMLInputElement>(null);
 useEffect(()=>{supabase.auth.getUser().then(({data})=>setUser(data.user));const {data:sub}=supabase.auth.onAuthStateChange((_e,s)=>setUser(s?.user??null));return()=>sub.subscription.unsubscribe()},[]);
 useEffect(()=>{if(!user)return;supabase.from('program_settings').select('*').eq('id',1).maybeSingle().then(({data})=>{if(data)setSettings(data as Settings)})},[user]);
 const available=settings.withdrawal_enabled||settings.progress_percent>=100;
 const openWithdrawal=()=>{if(!available)return;setError('');setPartnerAccount('');setStage('form');setWithdrawalOpen(true);setTimeout(()=>inputRef.current?.focus(),50)};
 const continueWithdrawal=()=>{const value=(inputRef.current?.value||partnerAccount).trim();if(!value){setError('Please enter your FBS Partner Account.');inputRef.current?.focus();return}setPartnerAccount(value);setError('');setStage('processing');setTimeout(()=>setStage('accepted'),2200)};
 if(!user)return <main style={{fontFamily:'Arial',padding:40}}>Please sign in to continue.</main>;
 return <main style={{fontFamily:'Arial',maxWidth:900,margin:'0 auto',padding:24}}>
  <section style={{padding:24,borderRadius:16,border:'1px solid #ddd'}}><div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h1>IB PROGRAM</h1><span style={{fontSize:12,border:'1px solid #999',padding:'4px 8px',borderRadius:8}}>REFERENCE</span></div><h2>Program 1</h2><p>Amount reached: <b>${settings.reached_amount.toFixed(2)}</b> / ${settings.target_amount.toFixed(2)}</p><div style={{height:12,background:'#eee',borderRadius:8,overflow:'hidden'}}><div style={{width:`${Math.min(settings.progress_percent,100)}%`,height:'100%',background:'#111'}}/></div><p>{settings.progress_percent}% complete</p><button type="button" onClick={openWithdrawal} disabled={!available} style={{padding:'12px 20px',borderRadius:10,cursor:available?'pointer':'not-allowed'}}>Withdrawal</button></section>
  {withdrawalOpen&&<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',padding:20,zIndex:9999}} onClick={e=>{if(e.target===e.currentTarget)setWithdrawalOpen(false)}}><div style={{background:'#fff',padding:28,borderRadius:16,maxWidth:430,width:'100%',boxSizing:'border-box',position:'relative',zIndex:10000}}>
   <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3 style={{margin:0}}>Withdrawal — Reference</h3><button type="button" onClick={()=>setWithdrawalOpen(false)} style={{fontSize:24,padding:'4px 10px'}}>×</button></div>
   {stage==='form'&&<div><p>Add your FBS Partner Account to continue this reference withdrawal flow.</p><label htmlFor="partner-account" style={{display:'block',fontSize:13,fontWeight:600,marginBottom:6}}>FBS Partner Account</label><input ref={inputRef} id="partner-account" type="text" value={partnerAccount} onChange={e=>{setPartnerAccount(e.target.value);setError('')}} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();continueWithdrawal()}}} placeholder="Enter your FBS Partner Account" autoComplete="off" style={{display:'block',width:'100%',boxSizing:'border-box',padding:14,marginBottom:8,border:'1px solid #777',borderRadius:8,fontSize:16,minHeight:52}}/>{error&&<p role="alert" style={{color:'#b00020',fontSize:13}}>{error}</p>}<button type="button" onClick={continueWithdrawal} style={{display:'block',width:'100%',padding:'14px 16px',borderRadius:8,fontSize:16,minHeight:52,cursor:'pointer',touchAction:'manipulation'}}>Continue</button></div>}
   {stage==='processing'&&<div><p>Processing reference withdrawal…</p><p>Please wait.</p></div>}
   {stage==='accepted'&&<div><h4>Accepted</h4><p>This reference withdrawal flow has been accepted for demonstration purposes. No funds have been transferred.</p><button type="button" onClick={()=>setWithdrawalOpen(false)}>Close</button></div>}
   <p style={{fontSize:11,opacity:.65,marginTop:18}}>REFERENCE — This interface does not execute or confirm a real financial withdrawal.</p>
  </div></div>}
 </main>;
}

// Force a fresh Vercel build so the production bundle matches this source.
