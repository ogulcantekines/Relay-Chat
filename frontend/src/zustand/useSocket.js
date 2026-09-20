import { create } from 'zustand';
import io from 'socket.io-client';

const useSocket = create((set, get) => ({
    socket: null,
    onlineUsers: [],
    isConnected: false,
    connectionVersion: 0,
    connectSocket: () => {
        // A reconnecting socket is still owned by this session.
        if (get().socket) return;
        const socket = io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
            withCredentials: true,
            autoConnect: false,
        });
        socket.on('connect', () => {
            set((state) => ({ isConnected: true, connectionVersion: state.connectionVersion + 1 }));
        });
        socket.on('getOnlineUsers', (onlineUsers) => set({ onlineUsers }));
        socket.on('disconnect', () => set({ isConnected: false, onlineUsers: [] }));
        set({ socket });
        socket.connect();
    },
    disconnectSocket: () => {
        const socket = get().socket;
        if (socket) {
            socket.removeAllListeners();
            socket.disconnect();
        }
        set({ socket: null, isConnected: false, onlineUsers: [], connectionVersion: 0 });
    },
}));
export default useSocket;
