import { useEffect, useRef } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { toast } from '../utils/toast';

/**
 * Avisa quando a conexão cai ou volta (Firestore com cache persistente continua com dados em cache).
 */
export function NetworkStatusListener() {
  const wasOnline = useRef<boolean | null>(null);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online =
        state.isConnected === true &&
        (state.isInternetReachable === true || state.isInternetReachable === null);
      if (wasOnline.current === null) {
        wasOnline.current = online;
        return;
      }
      if (wasOnline.current && !online) {
        toast.error('Sem conexão. Os dados em cache podem estar desatualizados.');
      } else if (!wasOnline.current && online) {
        toast.success('Conexão restaurada');
      }
      wasOnline.current = online;
    });
    return () => unsub();
  }, []);

  return null;
}
