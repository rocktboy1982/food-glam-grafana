"use client";
import React from "react";
import { useFeatureFlags } from "@/components/feature-flags-provider";

export default function FeatureFlagPanel() {
  const { flags, loading, setOverride } = useFeatureFlags();

  if (loading) return null;

  const keys = Object.keys(flags).sort();

  return (
    <div style={{position:'fixed', right:12, bottom:12, zIndex:9999}}>
      <div style={{background:'rgba(0,0,0,0.85)', color:'#fff', padding:12, borderRadius:8, minWidth:220, fontSize:13}}>
        <div style={{fontWeight:700, marginBottom:8}}>FF Panel (dev)</div>
        {keys.length === 0 && <div style={{opacity:0.8}}>No flags</div>}
        {keys.map((k) => (
          <label key={k} style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:8, marginBottom:6}}>
            <span style={{flex:1, marginRight:8}}>{k}</span>
            <input
              type="checkbox"
              checked={!!flags[k]}
              onChange={() => setOverride && setOverride(k, !flags[k])}
            />
          </label>
        ))}
        <div style={{display:'flex', gap:8, marginTop:8}}>
          <button
            onClick={() => {
              if (!setOverride) return;
              keys.forEach((k) => setOverride(k, null));
              try { localStorage.removeItem('ff_overrides'); } catch(e){}
              window.location.reload();
            }}
            style={{flex:1, padding:6, background:'#333', color:'#fff', borderRadius:6, border:'none'}}
          >Reset</button>
        </div>
      </div>
    </div>
  );
}
