import { useEffect } from 'react';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';
import useAuth from '../../zustand/useAuth';
import playSound from '../../utils/playSound';

// Real-time mesajları dinleyen hook - gelen yeni mesajları state'e ekler
const useListenMessages = () => {
    const { socket } = useSocket(); //frontend side socket bağlantısı
    const { messages, setMessages, selectedConversation } = useConversation();//zustanddan gerekli state ve fonksiyonları al
    const authUser = useAuth((state) => state.authUser); //localstoragedan okunan kullanıcı

    useEffect(() => {
        
        if (!socket || !authUser || !authUser._id) return; // <-- Hata engelleyen satır, eğer socket aktif değilse veya authUser null ise veya authUser._id yoksa fonksiyondan çık

        const handleNewMessage = (newMessage) => {
            // SADECE aktif konuşmaya ait mesajları ekle
            if (selectedConversation && 
                (newMessage.senderId === selectedConversation._id || 
                 newMessage.receiverId === selectedConversation._id)) {
                setMessages([...messages, newMessage]);
                
                // Chat açıkken mesaj geldiyse hemen okundu işaretle.yani chat açıkken yeni mesaj dinlendiği sırada koşullar sağlanırsa chatopened emit et
                // böylece backenddeki ilgili kod çalışır ve mesajlar okundu olarak işaretlenir
                //yani chat açıkken yeni mesaj gelirse o anlık okundu olarak işaretleniyor,
                if (newMessage.senderId === selectedConversation._id && socket) {
                    socket.emit("chatOpened", {
                        otherUserId: selectedConversation._id
                    });
                }
            }
            
            // Ses çal - başkasından mesaj geldiğinde
            if (newMessage.senderId !== authUser._id) {
                // Chat açık mı kontrol et
                const isChatOpen = selectedConversation && selectedConversation._id === newMessage.senderId;
                playSound(isChatOpen);
            }
        };

        // Server'dan gelen "newMessage" eventini dinle . bu bir listener ve socketin dinleme yaptığı kısımı gibi düşün
        //newMessage eadlı event gelince bu listener aktif olur ve gelen nesneyi adını çağırdığı fonksiyona parametre olarak verir
        socket.on("newMessage", handleNewMessage);

        return () => {
            console.log("Cleanup çağrıldı! Socket listener temizleniyor...");
            socket.off("newMessage", handleNewMessage);
        };
        //bu returnun mantığı useEffectin cleanup fonksiyonu. component unmount olduğunda veya bağımlılıklar değiştiğinde çalışır
        //örneğin kullanıcı logout olduğunda component unmount olur ve bu cleanup fonksiyonu çalışır
        //böylece socket listener temizlenir ve hafıza sızıntısı (memory leak) önlenir
        //aynı şekilde selectedConversation değiştiğinde de önceki listener temizlenir ve yeni listener eklenir
        //böylece eski konuşmanın mesajları yeni konuşmaya karışmaz,
        //ilk başlangıçta ama cleanup çalışmaz çünkü component mount oluyor, cleanup component unmount olduğunda çalışır
    }, [socket, messages, setMessages, selectedConversation, authUser]);
};

export default useListenMessages;