import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility, { passive: true });
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  if (!isVisible) return null;

  return (
    <button
      onClick={scrollToTop}
      aria-label="Retour en haut"
      className="fixed bottom-6 right-6 z-40 p-3 bg-brand-600 text-white rounded-full shadow-lg hover:bg-brand-700 hover:scale-110 active:scale-95 transition-all duration-200 border border-brand-400/30 group"
    >
      <ChevronUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
    </button>
  );
}
