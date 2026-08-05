export const handleSmoothScroll = (
  e: React.MouseEvent<HTMLAnchorElement, MouseEvent>,
  targetId: string,
  callback?: () => void
) => {
  if (targetId.startsWith('#') && targetId.length > 1) {
    e.preventDefault();
    const element = document.querySelector(targetId);
    if (element) {
      // Calculate offset if needed (e.g., for fixed navbar)
      const offset = 80; // approximate navbar height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      // Update URL hash without jumping
      window.history.pushState(null, '', targetId);
    }
  }
  
  if (callback) {
    callback();
  }
};
