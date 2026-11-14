import { useEffect, useState } from 'react';

// Rutas por hash (#/descubrir, #/swag/abc) para que funcionen en cualquier hosting estático.
const parse = () => (location.hash.replace(/^#\/?/, '') || 'descubrir').split('/');

export function useRoute() {
  const [parts, setParts] = useState(parse);
  useEffect(() => {
    const on = () => {
      setParts(parse());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parts;
}

export const go = (path: string) => {
  location.hash = `#/${path}`;
};
export const back = () => (history.length > 1 ? history.back() : go('descubrir'));
