import apiFetch from './apiFetch';
import useAuth from '../zustand/useAuth';
import useConversation from '../zustand/useConversation';
import useFriendStore from '../zustand/useFriend';

// Acceptance can arrive before the first outgoing message has a conversation ID.
export const refreshConversationStatuses = async () => {
    const userId = useAuth.getState().authUser?._id;
    if (!userId) return;
    try {
        const response = await apiFetch('/api/conversations');
        const data = await response.json();
        if (!response.ok) return;
        const formatted = data.map(conversation => ({
            ...conversation.participants.find(person => person._id !== userId),
            conversationId: conversation._id,
            lastMessage: conversation.messages[0] || null,
            status: conversation.status,
        })).filter(item => item._id);
        const visible = formatted.filter(item => item.status === 'active' || item.lastMessage?.senderId === userId);
        const state = useConversation.getState();
        state.setConversations(current => {
            const byId = new Map(current.map(item => [item._id, item]));
            for (const item of visible) byId.set(item._id, { ...byId.get(item._id), ...item });
            return [...byId.values()].sort((a, b) => (b.lastMessage?._id || '').localeCompare(a.lastMessage?._id || ''));
        });
        const selected = formatted.find(item => item._id === state.selectedConversation?._id);
        if (selected) state.setSelectedConversation(selected);
        const friends = useFriendStore.getState();
        const active = new Set(formatted.filter(item => item.status === 'active').map(item => item._id));
        friends.setMessageRequests(friends.messageRequests.filter(item => !active.has(item._id)));
    } catch { /* Reconnect refreshes the same canonical lists. */ }
};
