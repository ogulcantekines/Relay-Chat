import { useEffect } from 'react';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';
import useAuth from '../../zustand/useAuth';
import useUnread from '../../zustand/useUnread';
import playSound from '../../utils/playSound';

// Real-time mesajları dinleyen hook - gelen yeni mesajları state'e ekler
const useListenMessages = () => {
    const { socket } = useSocket(); //frontend side socket bağlantısı
    const {
        messages,
        setMessages,
        selectedConversation,
        conversations,
        setConversations
    } = useConversation();
    const authUser = useAuth((state) => state.authUser); //localstoragedan okunan kullanıcı
    const { increment } = useUnread();

    useEffect(() => {

        if (!socket || !authUser || !authUser._id) return; // socket veya kullanıcı yoksa çık

        const handleNewMessage = (newMessage) => {
            const isFromOther = newMessage.senderId !== authUser._id;
            const isChatOpen = selectedConversation && newMessage.senderId === selectedConversation._id;

            // SADECE aktif konuşmaya ait mesajları listeye ekle
            if (selectedConversation &&
                (newMessage.senderId === selectedConversation._id ||
                    newMessage.receiverId === selectedConversation._id)) {
                setMessages([...messages, newMessage]);

                // Chat açıkken mesaj geldiyse hemen okundu işaretle
                if (isChatOpen && socket) {
                    socket.emit("chatOpened", {
                        otherUserId: selectedConversation._id
                    });
                }
            }

            if (isFromOther) {
                // Sohbet kapalıysa okunmamış sayacını artır
                if (!isChatOpen) increment(newMessage.senderId);

                // Gönderen kenar çubuğunda yoksa sohbeti anında oluştur.
                // Önceden bu durumda sayfayı yenilemek gerekiyordu; backend artık
                // mesajla birlikte gönderenin bilgisini de yolladığı için
                // kutucuk kendiliğinden açılabiliyor.
                const exists = conversations.some(c => c._id === newMessage.senderId);
                if (!exists && newMessage.sender) {
                    setConversations([
                        {
                            ...newMessage.sender,
                            status: newMessage.conversationStatus || "active",
                            lastMessage: newMessage
                        },
                        ...conversations
                    ]);
                } else if (exists) {
                    // Varsa son mesajı güncelle ve listenin en üstüne taşı
                    const updated = conversations.map(c =>
                        c._id === newMessage.senderId ? { ...c, lastMessage: newMessage } : c
                    );
                    const moved = updated.find(c => c._id === newMessage.senderId);
                    setConversations([moved, ...updated.filter(c => c._id !== newMessage.senderId)]);
                }

                playSound(isChatOpen);
            }
        };

        // Server'dan gelen "newMessage" eventini dinle
        socket.on("newMessage", handleNewMessage);

        return () => {
            socket.off("newMessage", handleNewMessage);
        };
        //useEffect'in cleanup fonksiyonu: component unmount olduğunda veya
        //bağımlılıklar değiştiğinde önceki listener temizlenir, böylece
        //aynı olay birden fazla kez işlenmez ve hafıza sızıntısı önlenir
    }, [socket, messages, setMessages, selectedConversation, authUser, conversations, setConversations, increment]);
};

export default useListenMessages;
