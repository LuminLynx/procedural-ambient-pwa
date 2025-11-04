import React, { useEffect, useRef } from 'react';

type CanvasVisualsProps = {
  audioContext: AudioContext | null;
  masterNode: AudioNode | null;
  melodyNodes: AudioNode[]; // up to 3 melody outputs for orbit tracking
  currentScene: 'Calm' | 'Nocturne' | 'Ether';
  visualIntensity: number; // 0-1, scales height and orbit radius
};

// Scene-based color palettes
const SCENE_COLORS = {
  Calm: {
    gradient: ['#1e3a8a', '#3b82f6', '#60a5fa'], // blue spectrum
    orbit: '#93c5fd'
  },
  Nocturne: {
    gradient: ['#581c87', '#7c3aed', '#a78bfa'], // purple spectrum
    orbit: '#c4b5fd'
  },
  Ether: {
    gradient: ['#0f766e', '#14b8a6', '#5eead4'], // teal spectrum
    orbit: '#99f6e4'
  }
};

export default function CanvasVisuals({
  audioContext,
  masterNode,
  melodyNodes,
  currentScene,
  visualIntensity
}: CanvasVisualsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const melodyAnalysersRef = useRef<AnalyserNode[]>([]);
  const animationFrameRef = useRef<number>(0);
  const melodyRMSRef = useRef<number[]>([0, 0, 0]);

  // Setup analysers
  useEffect(() => {
    if (!audioContext || !masterNode) return;

    // Master analyser for spectrum
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.8;
    masterNode.connect(analyser);
    analyserRef.current = analyser;

    // Melody analysers for orbit RMS
    const melodyAnalysers: AnalyserNode[] = [];
    melodyNodes.forEach((node, i) => {
      if (i < 3 && node) {
        const melAnalyser = audioContext.createAnalyser();
        melAnalyser.fftSize = 256;
        melAnalyser.smoothingTimeConstant = 0.85;
        node.connect(melAnalyser);
        melodyAnalysers.push(melAnalyser);
      }
    });
    melodyAnalysersRef.current = melodyAnalysers;

    return () => {
      // Cleanup - safely disconnect nodes
      try {
        if (analyserRef.current && masterNode) {
          masterNode.disconnect(analyserRef.current);
        }
      } catch (e) {
        // Ignore disconnect errors during cleanup
      }
      
      melodyAnalysers.forEach((ma, i) => {
        try {
          if (melodyNodes[i]) {
            melodyNodes[i].disconnect(ma);
          }
        } catch (e) {
          // Ignore disconnect errors during cleanup
        }
      });
    };
  }, [audioContext, masterNode, melodyNodes]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let lastTime = performance.now();

    const draw = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;
      const fps = 1000 / deltaTime;
      lastTime = currentTime;

      // Resize canvas to match display size with devicePixelRatio
      const dpr = window.devicePixelRatio || 1;
      const displayWidth = canvas.clientWidth;
      const displayHeight = canvas.clientHeight;
      
      if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
        canvas.width = displayWidth * dpr;
        canvas.height = displayHeight * dpr;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, width, height);

      if (!analyserRef.current) {
        animationFrameRef.current = requestAnimationFrame(draw);
        return;
      }

      // Get frequency data
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      // Map to 32 mel-like bands (logarithmic spacing)
      const numBands = 32;
      const bands: number[] = [];
      
      for (let i = 0; i < numBands; i++) {
        // Logarithmic frequency mapping
        const lowFreq = Math.pow(2, i / numBands * 10); // ~1 to 1024
        const highFreq = Math.pow(2, (i + 1) / numBands * 10);
        
        const lowBin = Math.floor(lowFreq / bufferLength * (bufferLength / 2));
        const highBin = Math.floor(highFreq / bufferLength * (bufferLength / 2));
        
        let sum = 0;
        let count = 0;
        for (let j = lowBin; j < highBin && j < bufferLength; j++) {
          sum += dataArray[j];
          count++;
        }
        
        const avg = count > 0 ? sum / count : 0;
        bands.push(avg);
      }

      // Draw spectrum landscape
      const colors = SCENE_COLORS[currentScene];
      const barWidth = width / numBands;
      
      for (let i = 0; i < numBands; i++) {
        const barHeight = (bands[i] / 255) * height * 0.6 * visualIntensity;
        const x = i * barWidth;
        const y = height - barHeight;
        
        // Gradient based on height
        const colorIndex = Math.min(2, Math.floor((bands[i] / 255) * 3));
        ctx.fillStyle = colors.gradient[colorIndex] || colors.gradient[0];
        
        ctx.fillRect(x, y, barWidth - 2, barHeight);
      }

      // Update melody RMS values
      melodyAnalysersRef.current.forEach((analyser, i) => {
        if (i < 3) {
          const melBufferLength = analyser.frequencyBinCount;
          const melDataArray = new Uint8Array(melBufferLength);
          analyser.getByteTimeDomainData(melDataArray);
          
          // Calculate RMS
          let sum = 0;
          for (let j = 0; j < melBufferLength; j++) {
            const normalized = (melDataArray[j] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / melBufferLength);
          
          // Smooth RMS
          melodyRMSRef.current[i] = melodyRMSRef.current[i] * 0.9 + rms * 0.1;
        }
      });

      // Draw melody orbits
      const centerX = width / 2;
      const centerY = height / 2;
      
      melodyRMSRef.current.forEach((rms, i) => {
        if (i < melodyNodes.length && melodyNodes[i]) {
          const radius = 20 + rms * 100 * visualIntensity;
          const angle = (Date.now() / 1000 + i * (Math.PI * 2 / 3)) % (Math.PI * 2);
          const orbitRadius = 80 + i * 40;
          
          const x = centerX + Math.cos(angle) * orbitRadius;
          const y = centerY + Math.sin(angle) * orbitRadius;
          
          // Draw orbit circle
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = colors.orbit;
          ctx.globalAlpha = 0.6;
          ctx.fill();
          ctx.globalAlpha = 1.0;
          
          // Draw orbit trail
          ctx.strokeStyle = colors.orbit;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
          ctx.globalAlpha = 0.3;
          ctx.stroke();
          ctx.globalAlpha = 1.0;
        }
      });

      animationFrameRef.current = requestAnimationFrame(draw);
    };

    animationFrameRef.current = requestAnimationFrame(draw);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [currentScene, visualIntensity, melodyNodes]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '400px',
        backgroundColor: '#000',
        borderRadius: '8px',
        display: 'block'
      }}
    />
  );
}
