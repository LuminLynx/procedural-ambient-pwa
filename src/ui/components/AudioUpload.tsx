import React, { useState, useRef } from 'react';

interface AudioUploadProps {
  onFileLoaded: (audioBuffer: AudioBuffer, fileName: string) => void;
  disabled?: boolean;
}

export const AudioUpload: React.FC<AudioUploadProps> = ({ onFileLoaded, disabled = false }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('audio/')) {
      setError('Please select a valid audio file');
      return;
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 50MB');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create AudioContext for decoding
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API not supported');
      }
      
      const audioContext = new AudioContextClass();
      
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Clean up
      await audioContext.close();
      
      // Notify parent component
      onFileLoaded(audioBuffer, file.name);
      setUploadedFile(file.name);
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load audio file';
      setError(errorMessage);
      console.error('Audio upload error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{
      padding: '12px',
      backgroundColor: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '8px',
      marginTop: '12px'
    }}>
      <div style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#e5e7eb' }}>
        🎵 Audio Upload (Experimental)
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled || isLoading}
      />

      {!uploadedFile ? (
        <button
          onClick={handleButtonClick}
          disabled={disabled || isLoading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: disabled || isLoading ? '#374151' : '#6366f1',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: disabled || isLoading ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '600',
            opacity: disabled || isLoading ? 0.5 : 1
          }}
        >
          {isLoading ? '⏳ Loading...' : '📁 Upload Audio File'}
        </button>
      ) : (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px',
          backgroundColor: 'rgba(34,197,94,0.1)',
          border: '1px solid rgba(34,197,94,0.3)',
          borderRadius: '6px'
        }}>
          <div style={{ flex: 1, fontSize: '13px', color: '#86efac' }}>
            ✓ {uploadedFile}
          </div>
          <button
            onClick={clearFile}
            style={{
              padding: '4px 8px',
              backgroundColor: 'rgba(239,68,68,0.2)',
              color: '#fca5a5',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            ✕
          </button>
        </div>
      )}

      {error && (
        <div style={{
          marginTop: '8px',
          padding: '8px',
          backgroundColor: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '6px',
          fontSize: '13px',
          color: '#fca5a5'
        }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: '#64748b'
      }}>
        Supports: MP3, WAV, OGG, M4A (max 50MB)
      </div>
    </div>
  );
};
