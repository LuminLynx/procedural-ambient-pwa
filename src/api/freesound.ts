// Freesound API integration for sample fetching
// Optional feature - gracefully disabled when API key is missing

type FreesoundResult = {
  id: number;
  previews: {
    'preview-hq-mp3': string;
    'preview-lq-mp3': string;
  };
};

type FreesoundResponse = {
  results: FreesoundResult[];
};

const FREESOUND_API_BASE = 'https://freesound.org/apiv2';
const RATE_LIMIT_MS = 20000; // 3 req/min = 1 req per 20s
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

let lastRequestTime = 0;

/**
 * Check if Freesound API is available
 */
export function isFreesoundAvailable(): boolean {
  return !!import.meta.env.VITE_FREESOUND_KEY;
}

/**
 * Get cached search results from localStorage
 */
function getCachedResults(query: string): FreesoundResult[] | null {
  const cacheKey = `freesound_cache_${query}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (!cached) return null;
  
  try {
    const { results, timestamp } = JSON.parse(cached);
    const age = Date.now() - timestamp;
    
    if (age < CACHE_DURATION_MS) {
      return results;
    } else {
      // Cache expired
      localStorage.removeItem(cacheKey);
      return null;
    }
  } catch (e) {
    console.error('Failed to parse cached Freesound results', e);
    localStorage.removeItem(cacheKey);
    return null;
  }
}

/**
 * Cache search results to localStorage
 */
function cacheResults(query: string, results: FreesoundResult[]): void {
  const cacheKey = `freesound_cache_${query}`;
  const data = {
    results,
    timestamp: Date.now()
  };
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to cache Freesound results', e);
  }
}

/**
 * Apply rate limiting
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < RATE_LIMIT_MS) {
    return false;
  }
  
  lastRequestTime = now;
  return true;
}

/**
 * Search Freesound for samples
 * Returns preview URLs for short samples (< 2s duration)
 */
export async function searchFreesound(query: string): Promise<string[]> {
  // Check if API is available
  if (!isFreesoundAvailable()) {
    console.warn('Freesound API key not configured');
    return [];
  }
  
  // Check cache first
  const cached = getCachedResults(query);
  if (cached) {
    return cached.map(r => r.previews['preview-lq-mp3']);
  }
  
  // Check rate limit
  if (!checkRateLimit()) {
    console.warn('Freesound rate limit exceeded, using cache');
    return [];
  }
  
  try {
    const apiKey = import.meta.env.VITE_FREESOUND_KEY;
    const url = `${FREESOUND_API_BASE}/search/text/?query=${encodeURIComponent(query)}&fields=id,previews&filter=duration:[0 TO 2]`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Token ${apiKey}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Freesound API error: ${response.status}`);
    }
    
    const data: FreesoundResponse = await response.json();
    
    // Cache results
    cacheResults(query, data.results);
    
    // Return preview URLs
    return data.results.map(r => r.previews['preview-lq-mp3']);
  } catch (error) {
    console.error('Failed to fetch from Freesound:', error);
    return [];
  }
}

/**
 * Load a sample from URL into an AudioBuffer
 */
export async function loadSample(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer | null> {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
    return audioBuffer;
  } catch (error) {
    console.error('Failed to load sample:', error);
    return null;
  }
}
