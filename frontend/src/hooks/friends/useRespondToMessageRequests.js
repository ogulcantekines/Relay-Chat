import { useState } from 'react';
import toast from 'react-hot-toast';
import apiFetch from '../../utils/apiFetch';
import useConversation from '../../zustand/useConversation';
import useFriendStore from '../../zustand/useFriend';
import useUnread from '../../zustand/useUnread';

const useRespondToMessageRequests = () => {
    const [loading, setLoading] = useState(false);
    const acceptRequest = async conversationId => {
        if (loading || !conversationId) return;
        setLoading(true);
        try {
            const response = await apiFetch(`/api/conversations/accept/${conversationId}`, { method: 'PUT' });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || data.error || 'Mesaj isteği kabul edilemedi.');
            const state = useConversation.getState();
            const friendStore = useFriendStore.getState();
            const request = friendStore.messageRequests.find(item => item.conversationId === conversationId);
            if (request) {
                const accepted = { ...request, status: 'active' };
                state.setConversations(items => [accepted, ...items.filter(item => item._id !== accepted._id)]);
                if (state.selectedConversation?._id === accepted._id) state.setSelectedConversation(accepted);
            }
            friendStore.setMessageRequests(friendStore.messageRequests.filter(item => item.conversationId !== conversationId));
            toast.success('Mesaj isteği kabul edildi');
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
        } finally { setLoading(false); }
    };
    const declineRequest = async userId => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await apiFetch(`/api/messages/clear/${userId}`, { method: 'DELETE' });
            if (!response.ok) throw new Error('Mesaj isteği reddedilemedi.');
            const state = useConversation.getState();
            state.setConversations(items => items.filter(item => item._id !== userId));
            if (state.selectedConversation?._id === userId) state.setSelectedConversation(null);
            const friendStore = useFriendStore.getState();
            friendStore.setMessageRequests(friendStore.messageRequests.filter(item => item._id !== userId));
            useUnread.getState().clear(userId);
            toast.success('Mesaj isteği gizlendi');
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
        } finally { setLoading(false); }
    };
    return { acceptRequest, declineRequest, loading };
};
export default useRespondToMessageRequests;
