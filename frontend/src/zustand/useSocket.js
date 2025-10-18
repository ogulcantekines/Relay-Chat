import { create } from 'zustand';
import io from 'socket.io-client';

// Socket.io bağlantısını yöneten Zustand store
const useSocket = create((set, get) => ({
    socket: null, // Socket.io bağlantı nesnesi
    onlineUsers: [], // Online kullanıcıların listesi
    isConnected: false, // Bağlantı durumu

    //frontenddeki socket tarafını başlatır
    connectSocket: (userId) => { 
        if (get().socket?.connected) return; // Zaten bağlıysa çık

        //ana http bağlantı adresi
        const socket = io("http://localhost:5000", { //backenddeki socket aktif oluyor, backenddeki io.on("connection", ...) kısmı tetiklenir
            query: {
                userId: userId // Kullanıcı kimliğini handshake'e ekleriz ve backend ile bağlantı kurarız
            }
        });
        //handshake kurulduktan sonra websocket bağlantısı kurulur ve adres http://localhost:5000/socket.io/?EIO=4&transport=websocket&sid=xxxxxx gibi olur
        //express serverda adres http://localhost:5000/api/xxx olur
        
        // Bağlantı kurulduğunda
        socket.on("connect", () => {
            set({ isConnected: true });
        });
        // Online kullanıcı listesi güncellendiğinde
        socket.on("getOnlineUsers", (users) => {
            set({ onlineUsers: users });
        });
        // Bağlantı kesildiğinde
        socket.on("disconnect", () => {
            set({ isConnected: false });
        });

        set({ socket });
    },

    // Socket bağlantısını kes ve state'i temizle
    disconnectSocket: () => {
        const { socket } = get();
        if (socket && socket.connected) {
            socket.disconnect();
            set({ 
                socket: null, 
                isConnected: false, 
                onlineUsers: [] 
            });
        }
    },

   
}));

export default useSocket;
