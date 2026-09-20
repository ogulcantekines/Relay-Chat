import { useCallback, useEffect, useState } from 'react';
import useAuth from '../../zustand/useAuth';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';
import apiFetch from '../../utils/apiFetch';

const useGetConversations = () => {
    const userId = useAuth(state => state.authUser?._id);
    const connectionVersion = useSocket(state => state.connectionVersion);
    const { conversations, setConversations } = useConversation();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [attempt, setAttempt] = useState(0);
    const retry = useCallback(() => setAttempt(value => value + 1), []);

    useEffect(() => {
        if (!userId) return;
        const controller = new AbortController();
        setLoading(true);
        setError('');
        (async () => {
            try {
                const response = await apiFetch('/api/conversations', { signal: controller.signal });
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || 'Sohbetler yüklenemedi.');
                const formatted = data.map(conversation => ({
                    ...conversation.participants.find(person => person._id !== userId),
                    conversationId: conversation._id,
                    lastMessage: conversation.messages[0] || null,
                    status: conversation.status,
                })).filter(conversation => conversation._id && (conversation.status === 'active' ||
                    conversation.lastMessage?.senderId === userId));
                if (!controller.signal.aborted) {
                    setConversations(formatted);
                    useConversation.getState().setIsConversationsLoaded(true);
                }
            } catch (err) {
                if (err.name !== 'AbortError') setError(err.message);
            } finally {
                if (!controller.signal.aborted) setLoading(false);
            }
        })();
        return () => controller.abort();
    }, [userId, connectionVersion, attempt, setConversations]);
    return { conversations, loading, error, retry };
};
export default useGetConversations;
