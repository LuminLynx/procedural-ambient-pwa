import { useState, useEffect } from 'react';

/**
 * Hook to detect if the user is on a mobile device
 * and listen for viewport changes
 */
export function useMobileDetection() {
  const [isMobile, setIsMobile] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      // Check viewport width (mobile breakpoint at 768px)
      const mobileWidth = window.innerWidth <= 768;
      
      // Check for touch capability
      const hasTouch = 'ontouchstart' in window || 
                       navigator.maxTouchPoints > 0;
      
      setIsMobile(mobileWidth);
      setIsTouchDevice(hasTouch);
    };

    // Initial check
    checkMobile();

    // Listen for resize events
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  return { isMobile, isTouchDevice };
}
