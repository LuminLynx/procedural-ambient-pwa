import { useEffect } from 'react';

export interface KeyboardShortcuts {
  onPlayPause?: () => void;
  onStop?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSelectAll?: () => void;
}

/**
 * Hook to handle keyboard shortcuts for DAW-like controls
 */
export function useKeyboardShortcuts(shortcuts: KeyboardShortcuts) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;

      // Space: Play/Pause
      if (e.code === 'Space' && !cmdOrCtrl) {
        e.preventDefault();
        shortcuts.onPlayPause?.();
      }

      // Escape or Stop: Stop playback
      if ((e.code === 'Escape' || e.code === 'Period') && !cmdOrCtrl) {
        e.preventDefault();
        shortcuts.onStop?.();
      }

      // Delete/Backspace: Delete selection
      if ((e.code === 'Delete' || e.code === 'Backspace') && !cmdOrCtrl) {
        e.preventDefault();
        shortcuts.onDelete?.();
      }

      // Cmd/Ctrl + C: Copy
      if (e.code === 'KeyC' && cmdOrCtrl) {
        e.preventDefault();
        shortcuts.onCopy?.();
      }

      // Cmd/Ctrl + V: Paste
      if (e.code === 'KeyV' && cmdOrCtrl) {
        e.preventDefault();
        shortcuts.onPaste?.();
      }

      // Cmd/Ctrl + Z: Undo
      if (e.code === 'KeyZ' && cmdOrCtrl && !e.shiftKey) {
        e.preventDefault();
        shortcuts.onUndo?.();
      }

      // Cmd/Ctrl + Shift + Z: Redo
      if (e.code === 'KeyZ' && cmdOrCtrl && e.shiftKey) {
        e.preventDefault();
        shortcuts.onRedo?.();
      }

      // Cmd/Ctrl + A: Select All
      if (e.code === 'KeyA' && cmdOrCtrl) {
        e.preventDefault();
        shortcuts.onSelectAll?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}
