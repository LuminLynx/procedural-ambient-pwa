// MediaRecorder wrapper for master or stem recording

export type RecordingSession = {
  seed?: number;
  scenes: string[];
  rootSequence: { time: number; rootHz: number }[];
  params: Record<string, any>;
  appVersion: string;
  startTime: string;
  duration: number;
};

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private session: RecordingSession;
  private stream: MediaStream | null = null;

  constructor(
    private audioContext: AudioContext,
    private sourceNode: AudioNode,
    session?: Partial<RecordingSession>
  ) {
    this.session = {
      scenes: [],
      rootSequence: [],
      params: {},
      appVersion: '0.0.1',
      startTime: new Date().toISOString(),
      duration: 0,
      ...session
    };
  }

  start(): void {
    if (this.mediaRecorder) {
      console.warn('Recording already in progress');
      return;
    }

    // Create MediaStreamDestination
    const dest = this.audioContext.createMediaStreamDestination();
    this.sourceNode.connect(dest);
    this.stream = dest.stream;

    // Determine best mime type
    let mimeType = 'audio/webm;codecs=opus';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/webm';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = ''; // Let browser choose
      }
    }

    this.mediaRecorder = new MediaRecorder(this.stream, {
      mimeType: mimeType || undefined
    });

    this.chunks = [];
    this.startTime = Date.now();

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.onstop = () => {
      this.handleStop();
    };

    this.mediaRecorder.start();
  }

  stop(): void {
    if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
      console.warn('No recording to stop');
      return;
    }

    this.mediaRecorder.stop();
  }

  private handleStop(): void {
    const duration = (Date.now() - this.startTime) / 1000; // seconds
    this.session.duration = duration;

    // Create audio blob
    const audioBlob = new Blob(this.chunks, { type: 'audio/webm' });
    
    // Create session metadata
    const sessionJson = JSON.stringify(this.session, null, 2);
    const sessionBlob = new Blob([sessionJson], { type: 'application/json' });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const audioFilename = `session-${timestamp}.webm`;
    const sessionFilename = `session-${timestamp}.json`;

    // Download both files
    this.downloadBlob(audioBlob, audioFilename);
    this.downloadBlob(sessionBlob, sessionFilename);

    // Cleanup
    this.chunks = [];
    this.mediaRecorder = null;
    
    // Disconnect stream
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  private downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }

  updateSession(updates: Partial<RecordingSession>): void {
    this.session = { ...this.session, ...updates };
  }

  isRecording(): boolean {
    return this.mediaRecorder !== null && this.mediaRecorder.state === 'recording';
  }
}
