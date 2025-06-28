
import { useState, useEffect } from 'react';

// Hook for staggered animations
export function useStaggeredAnimation(itemsCount: number, staggerDelay = 50) {
  const [visibleItems, setVisibleItems] = useState<boolean[]>([]);

  useEffect(() => {
    const items = [];
    const timeouts: NodeJS.Timeout[] = [];

    for (let i = 0; i < itemsCount; i++) {
      items.push(false);
      timeouts.push(
        setTimeout(() => {
          setVisibleItems(prev => {
            const newItems = [...prev];
            newItems[i] = true;
            return newItems;
          });
        }, i * staggerDelay)
      );
    }

    setVisibleItems(items);

    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [itemsCount, staggerDelay]);

  return visibleItems;
}

// Animation variants for common components
export const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4 } }
};

export const slideUp = {
  hidden: { y: 10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

export const slideDown = {
  hidden: { y: -10, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.4 } }
};

export const scaleIn = {
  hidden: { scale: 0.95, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: { duration: 0.4 } }
};

// Hook for transition effects
export function useTransitionEffect(
  initialState = false,
  duration = 400
) {
  const [isVisible, setIsVisible] = useState(initialState);
  const [shouldRender, setShouldRender] = useState(initialState);

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (isVisible) {
      setShouldRender(true);
    } else {
      timeout = setTimeout(() => {
        setShouldRender(false);
      }, duration);
    }

    return () => {
      clearTimeout(timeout);
    };
  }, [isVisible, duration]);

  return {
    isVisible,
    shouldRender,
    show: () => setIsVisible(true),
    hide: () => setIsVisible(false),
    toggle: () => setIsVisible(prev => !prev),
  };
}
