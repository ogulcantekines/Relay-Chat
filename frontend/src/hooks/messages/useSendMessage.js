import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";
import useFriendStore from "../../zustand/useFriend"; // Arkadaş listesi kontrolü için eklendi

// useSendMessage - Mesaj gönderme hook'u
// MessageInput bileşeninde kullanılır. Hem normal sohbetlerde hem de "draft" sohbetlerde çalışır.
//
// 🔑 Draft Conversation Mantığı:
// Kullanıcı AddFriend'den birine mesaj yazmak istediğinde, sidebar'a henüz eklenmemiş bir
// "taslak" (draft) conversation oluşur. İlk mesaj gönderildiğinde:
// 1. Backend conversation'ı otomatik oluşturur (DB'ye kaydeder)
// 2. Bu hook sidebar'da yeni conversation'ı gösterir
// Bu "lazy creation" yaklaşımı gereksiz boş conversation'ların DB'de oluşmasını önler.

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation, setSelectedConversation, conversations, setConversations } = useConversation();
    const friends = useFriendStore((state) => state.friends); // Arkadaş listesini al

    const sendMessage = async (message) => {
        if (!selectedConversation) {
            toast.error("No conversation selected");
            return;
        }
        setLoading(true);
        try {
            // Backend'e POST isteği → /api/messages/send/:receiverId
            const res = await fetch(`/api/messages/send/${selectedConversation._id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ message: message })
            });

            if (res.ok) {
                const data = await res.json();
                console.log('Message sent:', data);
                toast.success("Message sent successfully"); // UX: Sürekli toast çıkması rahatsız edebilir

                // Mesajı local state'e ekle (anında UI'da görünsün)
                setMessages([...messages, data]);

                // 🔥 DRAFT CONVERSATION → SIDEBAR'A EKLEME
                const existsInSidebar = conversations.some(c => c._id === selectedConversation._id);
                if (!existsInSidebar) {

                    // ✅ KRİTİK FIX: Gönderilen kişi zaten arkadaşımız mı kontrol et
                    // Eğer arkadaşımızsa status "active" olmalı, değilse "pending" (Waiting for reply)
                    const isFriend = friends.some(f => f._id === selectedConversation._id);

                    const newConv = {
                        ...selectedConversation,
                        status: isFriend ? "active" : "pending", // Arkadaşsa aktif, değilse bekleyen
                        lastMessage: data
                    };

                    setConversations([newConv, ...conversations]);
                    setSelectedConversation(newConv);
                }
            } else {
                throw new Error("Failed to send message");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { loading, sendMessage };
};

export default useSendMessage;


/* socket üzerinden anlık mesajlaşma yapılırsa

import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../zustand/useConversation";
import useSocket from "../zustand/useSocket";
import useAuth from "../zustand/useAuth";

const useSendMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages, selectedConversation } = useConversation();
    const { socket } = useSocket();
    const { authUser } = useAuth();

    const sendMessage = async (message) => {
        if (!selectedConversation) {
            toast.error("No conversation selected");
            return;
        }
        
        if (!socket) {
            toast.error("Socket not connected");
            return;
        }

        setLoading(true);
        
        try {
            // HTTP yerine Socket kullan
            socket.emit("sendMessage", {
                receiverId: selectedConversation._id,
                message: message,
                senderId: authUser?._id
            });
            
            toast.success("Message sent successfully");
            
            // Gönderilen mesajı hemen local state'e ekle (optimistic update) using real authUser._id
            const newMessage = {
                _id: Date.now(), // Geçici ID
                senderId: authUser?._id || "",
                receiverId: selectedConversation._id,
                message: message,
                timestamp: Date.now()
            };
            
            setMessages([...messages, newMessage]);
            
        } catch {
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
        }
    };

    return { loading, sendMessage };
};

export default useSendMessage;
*/
