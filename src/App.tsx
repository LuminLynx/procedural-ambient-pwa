import React, { useEffect, useRef, useState } from 'react'
import { AmbientEngine } from './audio/engine'
import { AudioRecorder } from './audio/recorder'
import Controls, { loadSeedFromStorage, saveSeedToStorage } from './ui/controls'
import CanvasVisuals from './visuals/canvas'

export default function App(){
  const [installed, setInstalled] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [running, setRunning] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  // Control states with exact defaults from spec
  const [seed, setSeed] = useState<number>(loadSeedFromStorage())
  const [enableScenes, setEnableScenes] = useState(true)
  const [sceneDuration, setSceneDuration] = useState(32)
  const [tempo, setTempo] = useState(72)
  const [complexity, setComplexity] = useState(0.35)
  const [space, setSpace] = useState(0.4)
  const [visualIntensity, setVisualIntensity] = useState(0.7)

  const engineRef = useRef<AmbientEngine | null>(null)
  const recorderRef = useRef<AudioRecorder | null>(null)

  // Initialize engine when settings change
  useEffect(() => {
    engineRef.current = new AmbientEngine({ 
      scale: 'majorPent',
      rootHz: 220,
      bpm: tempo, 
      complexity, 
      mix: space,
      drumLevel: 0.5,
      enableScenes,
      enableHarmonicLoop: true,
      seed,
      sceneDurationBars: sceneDuration
    })
    return () => {
      if (engineRef.current) {
        engineRef.current.stop()
      }
    }
  }, [seed, enableScenes, sceneDuration]) // Only recreate when these change

  // Update engine parameters in real-time
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setBpm(tempo)
    }
  }, [tempo])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setComplexity(complexity)
    }
  }, [complexity])

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setMix(space)
    }
  }, [space])

  // PWA installation
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
      
      // Initialize recorder
      recorderRef.current = new AudioRecorder(
        engineRef.current.ctx,
        engineRef.current.getMasterNode(),
        {
          seed,
          scenes: [engineRef.current.getCurrentSceneName()],
          params: {
            tempo,
            complexity,
            space,
            enableScenes,
            sceneDuration
          }
        }
      )
    }
  }
  
  function onStop(){ 
    if (engineRef.current) {
      engineRef.current.stop()
      setRunning(false)
    }
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function onStartRecording() {
    if (recorderRef.current && running) {
      recorderRef.current.start()
      setIsRecording(true)
    }
  }

  function onStopRecording() {
    if (recorderRef.current && isRecording) {
      recorderRef.current.stop()
      setIsRecording(false)
    }
  }

  function onReset() {
    // Stop if running
    if (running) {
      onStop()
    }
    
    // Generate new seed
    const newSeed = Math.floor(Math.random() * 1000000)
    setSeed(newSeed)
    saveSeedToStorage(newSeed)
    
    // Reset to scene-managed defaults
    setEnableScenes(true)
    setSceneDuration(32)
    setTempo(72)
    setComplexity(0.30)
    setSpace(0.4)
    setVisualIntensity(0.7)
  }

  async function onInstall(){
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true)
  }

  // Get current scene name for visuals
  const currentScene = engineRef.current?.getCurrentSceneName() || 'Calm'
  const melodyNodes = engineRef.current?.getMelodyBuses() || []

  return (
    <div className="container">
      <h1 style={{marginBottom: 8}}>Procedural Ambient</h1>
      <p className="small" style={{marginTop: 0}}>
        Generative music with evolving melodies, reactive visuals, and infinite variation.
      </p>
      
      {/* Visuals */}
      {running && (
        <div style={{marginTop: 16}}>
          <CanvasVisuals
            audioContext={engineRef.current?.ctx || null}
            masterNode={engineRef.current?.getMasterNode() || null}
            melodyNodes={melodyNodes}
            currentScene={currentScene}
            visualIntensity={visualIntensity}
          />
        </div>
      )}
      
      {/* Main controls */}
      <div style={{display: 'flex', gap: 16, marginTop: 16, alignItems: 'flex-start'}}>
        <div style={{flex: 1}}>
          <div className="card">
            <div style={{display:'flex', gap:12}}>
              {!running ? (
                <button className="btn" onClick={onStart}>Start</button>
              ) : (
                <button className="btn" onClick={onStop}>Stop</button>
              )}
              {!installed && deferredPrompt && (
                <button className="btn" onClick={onInstall}>Install</button>
              )}
            </div>
          </div>
        </div>
        
        {/* Right rail controls */}
        <div style={{width: '300px'}}>
          <Controls
            seed={seed}
            setSeed={setSeed}
            enableScenes={enableScenes}
            setEnableScenes={setEnableScenes}
            sceneDuration={sceneDuration}
            setSceneDuration={setSceneDuration}
            tempo={tempo}
            setTempo={setTempo}
            complexity={complexity}
            setComplexity={setComplexity}
            space={space}
            setSpace={setSpace}
            visualIntensity={visualIntensity}
            setVisualIntensity={setVisualIntensity}
            isRecording={isRecording}
            onStartRecording={onStartRecording}
            onStopRecording={onStopRecording}
            onReset={onReset}
            disabled={running}
          />
        </div>
      </div>
      
      <footer className="small" style={{marginTop:16}}>
        Tip: on iOS, toggle Silent Mode off to hear audio.
      </footer>
    </div>
  )
}