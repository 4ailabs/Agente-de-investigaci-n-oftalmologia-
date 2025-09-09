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
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventScroll) {
        e.preventDefault();
      }
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

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
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventScroll });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventScroll });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [ref, touchStart, touchEnd, threshold, preventScroll, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  return { touchStart, touchEnd };
};

export default useSwipeGesture;