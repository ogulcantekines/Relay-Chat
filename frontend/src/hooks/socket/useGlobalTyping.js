import { useEffect, useState } from 'react';
import useSocket from '../../zustand/useSocket';

// Global yazıyor göstergesi hook'u - tüm konuşmalarda yazıyor durumunu takip eder
// Yerel typing hook'larından farkı: aktif sohbette olmasa bile yazıyor göstergesi gösterir
const useGlobalTyping = () => {
    const { socket } = useSocket();
    // Set kullanarak benzersiz kullanıcı ID'lerini verimli şekilde sakla
    const [typingUsers, setTypingUsers] = useState(new Set());

    useEffect(() => {
        if (!socket) return;

        // Herhangi bir kullanıcı bize yazmaya başladığında dinle
        const handleUserTyping = (data) => {
            setTypingUsers(prev => new Set([...prev, data.senderId]));
        };

        // Herhangi bir kullanıcı bize yazmayı bıraktığında dinle
        const handleUserStoppedTyping = (data) => {
            setTypingUsers(prev => {
                const newSet = new Set(prev);
                newSet.delete(data.senderId); // Kullanıcıyı yazıyor listesinden çıkar
                return newSet;
            });
        };

        // Socket olay dinleyicilerini kaydet
        socket.on("userTyping", handleUserTyping);
        socket.on("userStoppedTyping", handleUserStoppedTyping);

        // Temizlik - unmount veya socket değiştiğinde dinleyicileri kaldır
        return () => {
            socket.off("userTyping", handleUserTyping);
            socket.off("userStoppedTyping", handleUserStoppedTyping);
        };
    }, [socket]);

    // Belirli kullanıcının yazıyor olup olmadığını kontrol eden yardımcı fonksiyon
    const isUserTyping = (userId) => {
        return typingUsers.has(userId);
    };

    return { isUserTyping, typingUsers };
};

export default useGlobalTyping;
