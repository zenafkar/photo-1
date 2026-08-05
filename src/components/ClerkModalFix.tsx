import { useEffect, useRef } from 'react';

export const ClerkModalFix = () => {
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    // 1. Prevent global href="#" default jump behavior
    const handleGlobalClick = (e: MouseEvent) => {
      // Temporarily bypassed: we found that on mobile, preventing default here
      // might interfere with Clerk's internal routing if they don't explicitly prevent it.
      // If the page jumping bug persists, we will re-enable this.
      /*
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');
      
      if (anchor && anchor.getAttribute('href') === '#') {
        e.preventDefault();
      }
      */
    };

    document.addEventListener('click', handleGlobalClick);

    // 2. Preserve scroll position on Clerk modal body overflow toggles
    const handleBodyMutation = (mutations: MutationRecord[]) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          const bodyStyle = document.body.getAttribute('style') || '';
          const isOverflowHidden = bodyStyle.includes('overflow: hidden');

          if (isOverflowHidden) {
            // Modal is open, lock the current scroll position
            scrollPosRef.current = window.scrollY;
          } else {
            // Modal is closed (or overflow hidden removed), restore the scroll instantly
            // We use requestAnimationFrame to ensure the DOM has updated and restored scrollability
            // before we force the scroll position back, preventing the flash to top.
            requestAnimationFrame(() => {
              if (window.scrollY === 0 && scrollPosRef.current > 0) {
                 window.scrollTo({ top: scrollPosRef.current, behavior: 'instant' } as ScrollToOptions);
              }
            });
          }
        }
      }
    };

    const observer = new MutationObserver(handleBodyMutation);
    
    // Start observing body style changes
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      observer.disconnect();
    };
  }, []);

  // This is a logic-only component, it renders nothing
  return null;
};
