import { useCallback, useEffect, useRef, useState } from 'react';
import useConversation from '../../zustand/useConversation';
import useSocket from '../../zustand/useSocket';
import apiFetch from '../../utils/apiFetch';

const useGetMessages = () => {
    const { messages, setMessages, selectedConversation } = useConversation();
    const connectionVersion = useSocket(state => state.connectionVersion);
    const id = selectedConversation?._id;
    const [loading, setLoading] = useState(true);
    const [loadingOlder, setLoadingOlder] = useState(false);
    const [hasMore, setHasMore] = useState(false);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const olderRequest = useRef(false);
    const requestVersion = useRef(0);
    const retry = useCallback(() => setAttempt(value => value + 1), []);

    useEffect(() => {
        if (!id) return;
        const controller = new AbortController();
        requestVersion.current += 1;
        olderRequest.current = false;
        setLoadingOlder(false);
        setLoading(true);
        setHasMore(false);
        setError('');
        (async () => {
            try {
                const response = await apiFetch(`/api/messages/${id}?limit=50`, { signal: controller.signal });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || data.error || 'Mesajlar yüklenemedi.');
                if (controller.signal.aborted || useConversation.getState().selectedConversation?._id !== id) return;
                // Preserve messages arriving over the socket while the history is in flight.
                setMessages(current => {
                    const byId = new Map(data.map(message => [message._id, message]));
                    for (const message of current) if (!byId.has(message._id)) byId.set(message._id, message);
                    return [...byId.values()].sort((a, b) => a._id.localeCompare(b._id));
                });
                setHasMore(response.headers.get('X-Has-More') === 'true');
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [id, connectionVersion, attempt, setMessages]);

    const loadOlder = async () => {
        const first = useConversation.getState().messages[0]?._id;
        if (!id || !first || olderRequest.current || !hasMore) return;
        olderRequest.current = true;
        const version = requestVersion.current;
        setLoadingOlder(true);
        setError('');
        try {
            const response = await apiFetch(`/api/messages/${id}?before=${first}&limit=50`);
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Önceki mesajlar yüklenemedi.');
            if (version !== requestVersion.current || useConversation.getState().selectedConversation?._id !== id) return;
            setMessages(current => {
                const known = new Set(current.map(message => message._id));
                return [...data.filter(message => !known.has(message._id)), ...current];
            });
            setHasMore(response.headers.get('X-Has-More') === 'true');
        } catch (err) {
            if (err.name !== 'AbortError' && version === requestVersion.current) setError(err.message);
        } finally {
            if (version === requestVersion.current) {
                olderRequest.current = false;
                setLoadingOlder(false);
            }
        }
    };
    return { messages, loading, loadingOlder, hasMore, error, retry, loadOlder };
};
export default useGetMessages;
