import React, { useEffect, useRef, useState } from 'react'
import { AmbientEngine } from './audio/engine'

export default function App(){
  const [installed, setInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [running, setRunning] = useState(false)

  const [scale, setScale] = useState<'majorPent'|'minorPent'>('majorPent')
  const [bpm, setBpm] = useState(72)
  const [complexity, setComplexity] = useState(0.35)
  const [mix, setMix] = useState(0.4)
  const [rootHz, setRootHz] = useState(220)

  const engineRef = useRef<AmbientEngine | null>(null)

  useEffect(() => {
    engineRef.current = new AmbientEngine({ scale, rootHz, bpm, complexity, mix })
    return () => {
      if (engineRef.current) {
        engineRef.current.stop()
      }
    }
  }, [])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setScale(scale)
    }
  }, [scale])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setRootHz(rootHz)
    }
  }, [rootHz])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBpm(bpm)
    }
  }, [bpm])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setComplexity(complexity)
    }
  }, [complexity])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMix(mix)
    }
  }, [mix])

  useEffect(()=>{
    const handler = (e:any)=>{ e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', ()=> setInstalled(true));
    return ()=> window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function onStart(){ 
    if (engineRef.current) {
      await engineRef.current.start()
      setRunning(true)
    }
  }
  
  function onStop(){ 
    if (engineRef.current) {
      engineRef.current.stop()
      setRunning(false)
    }
  }

  async function onInstall(){
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true)
  }

  return (
    <div className="container">
      <h1 style={{marginBottom: 8}}>Procedural Ambient</h1>
      <p className="small" style={{marginTop: 0}}>Offline-capable PWA. Generate calm, endless background music.</p>
      <div className="card" style={{marginTop: 16}}>
        <div className="row">
          <label>Scale
            <select className="input" value={scale} onChange={e=>setScale(e.target.value as any)}>
              <option value="majorPent">Major Pentatonic</option>
              <option value="minorPent">Minor Pentatonic</option>
            </select>
          </label>
          <label>Root (Hz)
            <input className="input" type="number" value={rootHz} min={55} max={440} step={1} onChange={e=>setRootHz(parseFloat(e.target.value)||220)} />
          </label>
          <label>Tempo: {bpm} BPM
            <input className="range" type="range" min={40} max={120} value={bpm} onChange={e=>setBpm(parseInt(e.target.value))} />
          </label>
          <label>Complexity: {complexity.toFixed(2)}
            <input className="range" type="range" min={0} max={1} step={0.01} value={complexity} onChange={e=>setComplexity(parseFloat(e.target.value))} />
          </label>
          <label>Space (delay mix): {mix.toFixed(2)}
            <input className="range" type="range" min={0} max={1} step={0.01} value={mix} onChange={e=>setMix(parseFloat(e.target.value))} />
          </label>
        </div>
        <div style={{display:'flex', gap:12, marginTop:16}}>
          {!running ? <button className="btn" onClick={onStart}>Start</button> : <button className="btn" onClick={onStop}>Stop</button>}
          {!installed && deferredPrompt && <button className="btn" onClick={onInstall}>Install</button>}
        </div>
      </div>
      <footer className="small" style={{marginTop:16}}>Tip: on iOS, toggle Silent Mode off to hear audio.</footer>
    </div>
  )
}
