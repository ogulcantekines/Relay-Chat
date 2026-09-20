import { useEffect } from 'react';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';
import useFriendStore from '../../zustand/useFriend';
import useAuth from '../../zustand/useAuth';
import useUnread from '../../zustand/useUnread';
import playSound from '../../utils/playSound';

const useListenMessages = () => {
    const socket = useSocket(state => state.socket);
    const userId = useAuth(state => state.authUser?._id);
    useEffect(() => {
        if (!socket || !userId) return;
        const onMessage = (message) => {
            if (useAuth.getState().authUser?._id !== userId) return;
            const state = useConversation.getState();
            const incoming = message.senderId !== userId;
            const otherId = incoming ? message.senderId : message.receiverId;
            const selected = state.selectedConversation?._id === otherId;
            const visible = selected && document.visibilityState === 'visible';
            if (selected) state.setMessages(items => items.some(item => item._id === message._id) ? items : [...items, message]);
            if (visible && incoming) socket.emit('chatOpened', { otherUserId: otherId });

            const existing = state.conversations.find(item => item._id === otherId);
            const person = existing || (incoming ? message.sender : null);
            if (person) {
                const conversation = {
                    ...person,
                    status: message.conversationStatus || person.status || 'active',
                    conversationId: message.conversationId || person.conversationId,
                    lastMessage: message,
                };
                if (conversation.status === 'pending' && incoming) {
                    const friendStore = useFriendStore.getState();
                    friendStore.setMessageRequests([conversation, ...friendStore.messageRequests.filter(item => item._id !== otherId)]);
                } else {
                    state.setConversations(items => [conversation, ...items.filter(item => item._id !== otherId)]);
                }
                if (selected) state.setSelectedConversation({ ...state.selectedConversation, ...conversation });
            }
            if (incoming) {
                if (!visible) useUnread.getState().increment(otherId);
                playSound(visible);
            }
        };
        socket.on('newMessage', onMessage);
        return () => socket.off('newMessage', onMessage);
    }, [socket, userId]);
};
export default useListenMessages;
