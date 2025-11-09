# Android Compatibility Guide

## Android 13 Support

This PWA has been tested and optimized for Android 13 and modern Android devices. Below are important considerations:

### Minimum Requirements

- **Android Version:** Android 8.0+ (API level 26+)
- **Chrome:** Version 89 or higher (recommended: latest)
- **Firefox:** Version 88 or higher
- **Other Browsers:** Samsung Internet 14+, Edge 89+

### Known Android 13 Issues & Solutions

#### 1. Blank Screen on Launch
**Cause:** AudioContext initialization failures or React component crashes without proper error handling.

**Solutions:**
- The app now includes comprehensive error handling
- A React Error Boundary catches crashes and displays helpful messages
- Clear error messages guide users to solutions

#### 2. Audio Not Playing
**Causes:**
- **Silent/Vibrate Mode:** Android may mute Web Audio when device is in silent mode
- **Battery Saver:** May restrict audio processing
- **Autoplay Policy:** Requires user interaction before playing audio

**Solutions:**
- Ensure device is not in silent or vibrate mode
- Disable battery saver temporarily
- Tap the "Start" button to initialize audio (required by browser security)
- Check device volume settings

#### 3. Performance Issues
**Android 13 Optimizations:**
- Enable hardware acceleration in browser settings
- Close background apps to free up memory
- Ensure Chrome is updated to the latest version

#### 4. PWA Installation
**How to Install:**
1. Open the app in Chrome
2. Tap the menu (⋮) → "Install app" or "Add to Home Screen"
3. Alternatively, tap the install button when prompted

**Install Button Not Showing:**
- Make sure you're using Chrome (not another browser)
- The app must be served over HTTPS (works on GitHub Pages)
- Clear browser cache if previously installed and removed

### Android 13 Specific Limitations

1. **Audio Latency:** Web Audio on Android typically has 100-300ms latency compared to native apps
2. **Background Audio:** May be suspended when app is backgrounded (Android power management)
3. **Memory Limits:** Android browsers have tighter memory constraints than desktop
4. **Service Worker:** May be killed more aggressively on Android to save battery

### Testing on Android 13

The app has been optimized for:
- Google Pixel 6/7/8 series
- Samsung Galaxy S21/S22/S23 series
- OnePlus 9/10/11 series
- Other modern Android devices

### Troubleshooting

#### App Shows Error Message
1. **Check error details** - The app displays specific error messages
2. **Clear cache** - Use the "Clear Cache & Reload" button in the error screen
3. **Update Chrome** - Ensure you're on the latest version
4. **Check permissions** - Allow audio/media permissions if prompted

#### Audio Glitches or Stutters
1. Close other apps to free up resources
2. Disable battery optimization for Chrome
3. Check CPU temperature (thermal throttling can affect performance)

#### Can't Install as PWA
1. Use Chrome (not Firefox or other browsers for Android PWA)
2. Ensure you're on the correct URL (https://luminlynx.github.io/procedural-ambient-pwa/)
3. Clear browser data and try again

### Best Practices for Android Users

1. **Use Chrome** - Best compatibility and performance
2. **Keep Updated** - Update both Android OS and Chrome regularly
3. **Good Connection** - Initial load requires network; works offline after
4. **Battery** - Audio processing is CPU-intensive; use with adequate battery
5. **Headphones** - For best audio experience and to avoid device speaker limitations

### Developer Notes

The following changes improve Android 13 compatibility:

1. **Error Boundary** - Catches React errors preventing blank screens
2. **AudioContext Error Handling** - Graceful fallback if Web Audio API fails
3. **Service Worker Updates** - Network-first for HTML to prevent stale UI
4. **Mobile Meta Tags** - Improved viewport and app-capable tags
5. **Loading States** - Clear feedback during initialization
6. **Error Messages** - Android-specific help text in error displays

### Reporting Issues

If you encounter issues on Android 13:
1. Note your device model and Android version
2. Note your Chrome version
3. Check browser console for errors (chrome://inspect)
4. Report via GitHub Issues with full details
