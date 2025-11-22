import { useState, useEffect } from 'react';
import { subscribeToNetworkStatus, isOnline as checkIsOnline } from '../lib/offline';

/**
 * Hook to monitor network status
 * Returns current online/offline state
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(checkIsOnline());

  useEffect(() => {
    const unsubscribe = subscribeToNetworkStatus((online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return { isOnline };
}
