import { useState, useEffect } from 'react';

interface NetworkInformation {
  effectiveType?: 'slow-2g' | '2g' | '3g' | '4g';
  saveData?: boolean;
  downlink?: number;
  rtt?: number;
}

interface NetworkState {
  isSlowNetwork: boolean;
  isOffline: boolean;
  effectiveType: string;
  saveData: boolean;
}

declare global {
  interface Navigator {
    connection?: NetworkInformation;
    mozConnection?: NetworkInformation;
    webkitConnection?: NetworkInformation;
  }
}

export function useNetworkAware(): NetworkState {
  const [state, setState] = useState<NetworkState>(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const effectiveType = connection?.effectiveType || '4g';
    const isSlowNetwork = effectiveType === '2g' || effectiveType === 'slow-2g' || connection?.saveData === true;
    
    return {
      isSlowNetwork,
      isOffline: !navigator.onLine,
      effectiveType,
      saveData: connection?.saveData || false,
    };
  });

  useEffect(() => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    const updateNetworkState = () => {
      const effectiveType = connection?.effectiveType || '4g';
      const isSlowNetwork = effectiveType === '2g' || effectiveType === 'slow-2g' || connection?.saveData === true;
      
      setState({
        isSlowNetwork,
        isOffline: !navigator.onLine,
        effectiveType,
        saveData: connection?.saveData || false,
      });
    };

    const handleOnline = () => setState(prev => ({ ...prev, isOffline: false }));
    const handleOffline = () => setState(prev => ({ ...prev, isOffline: true }));

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    (connection as any)?.addEventListener?.('change', updateNetworkState);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      (connection as any)?.removeEventListener?.('change', updateNetworkState);
    };
  }, []);

  return state;
}
