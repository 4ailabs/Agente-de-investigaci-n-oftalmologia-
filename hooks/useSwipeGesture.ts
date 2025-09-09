import { useState, useEffect, RefObject } from 'react';

interface SwipeGestureOptions {
  threshold?: number;
  preventScroll?: boolean;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useSwipeGesture = (
  ref: RefObject<HTMLElement>,
  options: SwipeGestureOptions = {}
) => {
  const {
    threshold = 50,
    preventScroll = false,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown
  } = options;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.targetTouches && e.targetTouches.length > 0) {
        setTouchEnd(null);
        setTouchStart({
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
        });
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.targetTouches && e.targetTouches.length > 0) {
        if (preventScroll) {
          e.preventDefault();
        }
        setTouchEnd({
          x: e.targetTouches[0].clientX,
          y: e.targetTouches[0].clientY
        });
      }
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      try {
        const deltaX = touchStart.x - touchEnd.x;
        const deltaY = touchStart.y - touchEnd.y;
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        // Determine if this is a horizontal or vertical swipe
        if (absDeltaX > absDeltaY) {
          // Horizontal swipe
          if (absDeltaX > threshold) {
            if (deltaX > 0) {
              onSwipeLeft?.();
            } else {
              onSwipeRight?.();
            }
          }
        } else {
          // Vertical swipe
          if (absDeltaY > threshold) {
            if (deltaY > 0) {
              onSwipeUp?.();
            } else {
              onSwipeDown?.();
            }
          }
        }
      } catch (error) {
        console.warn('Swipe gesture error:', error);
      }
    };

    try {
      element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
      element.addEventListener('touchend', handleTouchEnd, { passive: true });
    } catch (error) {
      console.warn('Failed to add touch event listeners:', error);
    }

    return () => {
      try {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      } catch (error) {
        console.warn('Failed to remove touch event listeners:', error);
      }
    };
  }, [threshold, preventScroll, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return { touchStart, touchEnd };
};

export default useSwipeGesture;