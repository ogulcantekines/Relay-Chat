import { useCallback, useEffect, useState } from 'react';
import useAuth from '../../zustand/useAuth';

const useSession = () => {
    const [checking, setChecking] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => setAttempt(value => value + 1), []);

    useEffect(() => {
        const controller = new AbortController();
        const version = useAuth.getState().sessionVersion;
        setChecking(true);
        setError('');
        (async () => {
            try {
                const response = await fetch('/api/auth/me', { signal: controller.signal, cache: 'no-store' });
                if (response.status === 401) {
                    if (version === useAuth.getState().sessionVersion) useAuth.getState().logout();
                    return;
                }
                if (!response.ok) throw new Error('Sunucuya şu anda ulaşılamıyor.');
                const data = await response.json();
                if (!controller.signal.aborted && version === useAuth.getState().sessionVersion) {
                    useAuth.getState().setAuthUser(data.user || data);
                }
            } catch (err) {
                if (err.name !== 'AbortError') setError('Bağlantı kurulamadı. İnternet bağlantını kontrol edip tekrar dene.');
            } finally {
                if (!controller.signal.aborted) setChecking(false);
            }
        })();
        return () => controller.abort();
    }, [attempt]);

    useEffect(() => {
        const onStorage = (event) => { if (event.key === 'chat-session-change') retry(); };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, [retry]);
    return { checking, error, retry };
};
export default useSession;
