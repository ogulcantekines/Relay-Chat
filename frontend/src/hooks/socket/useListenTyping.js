import { useEffect, useState } from 'react';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';

// Yerel yazıyor göstergesi hook'u - sadece aktif/seçili konuşma için yazıyor durumunu dinler
// Not: useGlobalTyping'den farkı - bu sadece seçili konuşmadaki yazıyor durumunu takip eder

const useListenTyping = () => {
    const { socket } = useSocket();// Socket bağlantısını al(client tarafı)
    const { selectedConversation } = useConversation();
    const [isTyping, setIsTyping] = useState(false); // Yazıyor durumu
    const [typingUser, setTypingUser] = useState(null); // şu an gereksiz ve fazlalık, diğer tekrarda silinebilir

    useEffect(() => {
        if (!socket) return;

        // Kullanıcı yazmaya başladığında
        const handleUserTyping = (data) => {
            // Sadece seçili konuşmadan gelen yazıyor bilgisini göster
            if (selectedConversation && data.senderId === selectedConversation._id) {
                setIsTyping(true);
                setTypingUser(data.senderId);
            }
        };

        // Kullanıcı yazmayı bıraktığında
        const handleUserStoppedTyping = (data) => {
            if (selectedConversation && data.senderId === selectedConversation._id) {
                setIsTyping(false);
                setTypingUser(null);
            }
        };

        // Socket event dinleyicilerini kaydet
        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);

        // Cleanup - component unmount veya socket değiştiğinde temizle
        return () => {
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
        };
    }, [socket, selectedConversation]);

    // Konuşma değiştiğinde yazıyor durumunu sıfırla
    useEffect(() => {
        setIsTyping(false);
        setTypingUser(null);
    }, [selectedConversation]);

    return { isTyping, typingUser };
};

export default useListenTyping;