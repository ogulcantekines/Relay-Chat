import { create } from 'zustand';
import useConversation from './useConversation';
import useFriendStore from './useFriend';
import useUnread from './useUnread';
import useSocket from './useSocket';

// The HttpOnly cookie is the authority; localStorage never authenticates a user.
try { localStorage.removeItem('chat-user'); } catch { /* Storage can be unavailable. */ }

const clearSessionData = () => {
    useSocket.getState().disconnectSocket();
    useConversation.getState().reset();
    useFriendStore.getState().reset();
    useUnread.getState().reset();
};

const useAuth = create((set, get) => ({
    authUser: null,
    sessionVersion: 0,
    setAuthUser: (user) => {
        if (get().authUser?._id !== user?._id) {
            set({ sessionVersion: get().sessionVersion + 1 });
            clearSessionData();
        }
        set({ authUser: user });
    },
    logout: () => {
        set({ authUser: null, sessionVersion: get().sessionVersion + 1 });
        clearSessionData();
    },
}));
export default useAuth;
