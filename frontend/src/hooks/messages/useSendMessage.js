import { useRef, useState } from 'react';
import toast from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';
import useFriendStore from '../../zustand/useFriend';
import apiFetch from '../../utils/apiFetch';

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const sending = useRef(false);
    const sendMessage = async (message) => {
        const conversation = useConversation.getState().selectedConversation;
        if (!conversation || sending.current || !message.trim()) return false;
        sending.current = true;
        setLoading(true);
        try {
            const res = await apiFetch(`/api/messages/send/${conversation._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: message.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || data.error || 'Mesaj gönderilemedi. Tekrar dene.');
            const state = useConversation.getState();
            if (state.selectedConversation?._id === conversation._id) {
                state.setMessages(items => items.some(item => item._id === data._id) ? items : [...items, data]);
            }
            const existing = state.conversations.find(item => item._id === conversation._id);
            const updated = {
                ...conversation,
                ...existing,
                status: existing?.status || (useFriendStore.getState().friends.some(friend => friend._id === conversation._id) ? 'active' : 'pending'),
                lastMessage: data,
            };
            state.setConversations(items => [updated, ...items.filter(item => item._id !== conversation._id)]);
            if (state.selectedConversation?._id === conversation._id) state.setSelectedConversation(updated);
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
            return false;
        } finally {
            sending.current = false;
            setLoading(false);
        }
    };
    return { loading, sendMessage };
};
export default useSendMessage;
