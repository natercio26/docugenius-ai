
import { useEffect } from 'react';

/**
 * Hook to prevent automatic scrolling not initiated by the user
 */
export const usePreventAutoScroll = () => {
  useEffect(() => {
    const preventScroll = (e: Event) => {
      // Prevenir a rolagem automática apenas se não for iniciada pelo usuário
      if (!e.isTrusted) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Aplicar em todo o documento para garantir que a rolagem não aconteça
    document.addEventListener('scroll', preventScroll, { passive: false });
    
    return () => {
      document.removeEventListener('scroll', preventScroll);
    };
  }, []);
};

export default usePreventAutoScroll;
