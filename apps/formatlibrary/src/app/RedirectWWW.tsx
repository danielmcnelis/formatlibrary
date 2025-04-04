import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

function RedirectWWW() {
  const location = useLocation();

  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname.startsWith('www.')) {
      window.location.replace(`${window.location.protocol}//${hostname.slice(4)}${location.pathname}`);
    }
  }, [location]);

  return null;
}

export default RedirectWWW;