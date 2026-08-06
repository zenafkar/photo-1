import { useEffect, useRef } from 'react';

export const ClerkModalFix = () => {
  const scrollPosRef = useRef<number>(0);

  useEffect(() => {
    // Prevent placeholder anchors from jumping the page, but never touch Clerk links.
    const handleGlobalClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) return;

      const anchor = event.target.closest<HTMLAnchorElement>('a[href="#"]');
      if (!anchor || anchor.closest('#clerk-components, .cl-rootBox, .cl-component')) return;

      event.preventDefault();
    };

    document.addEventListener('click', handleGlobalClick);

    let modalWasOpen = false;
    let restoreFrame = 0;

    const syncModalState = () => {
      const modalIsOpen = getComputedStyle(document.body).overflow === 'hidden';

      if (modalIsOpen === modalWasOpen) return;
      modalWasOpen = modalIsOpen;

      document.body.classList.toggle('clerk-modal-open', modalIsOpen);

      if (modalIsOpen) {
        scrollPosRef.current = window.scrollY;
        return;
      }

      const scrollTop = scrollPosRef.current;
      cancelAnimationFrame(restoreFrame);
      restoreFrame = requestAnimationFrame(() => {
        if (window.scrollY === 0 && scrollTop > 0) {
          window.scrollTo({ top: scrollTop, behavior: 'instant' } as ScrollToOptions);
        }
      });
    };

    const observer = new MutationObserver(syncModalState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style'] });
    syncModalState();

    return () => {
      document.removeEventListener('click', handleGlobalClick);
      observer.disconnect();
      cancelAnimationFrame(restoreFrame);
      document.body.classList.remove('clerk-modal-open');
    };
  }, []);

  // This is a logic-only component, it renders nothing
  return null;
};
