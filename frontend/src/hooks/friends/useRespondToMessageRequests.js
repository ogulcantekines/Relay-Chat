import { useState } from "react";
import toast from "react-hot-toast";
import useConversation from "../../zustand/useConversation";
import useFriendStore from "../../zustand/useFriend";

// useRespondToMessageRequests - Mesaj isteğine yanıt verme hook'u
// MessageContainer.jsx'teki "Message Request" banner'ında kullanılır.
// Arkadaş olmayan biri mesaj gönderdiğinde, alıcı bu banner'da "Accept & Chat" veya "Delete" seçer.
//
// ⚠️ DİKKAT: Bu hook arkadaşlık isteğinden (FriendRequest) farklıdır!
// FriendRequest → Arkadaş olmak ister misin?
// MessageRequest → Pending conversation → Mesajı kabul eder misin?

const useRespondToMessageRequests = () => {
    const [loading, setLoading] = useState(false);
    const { selectedConversation, setSelectedConversation, conversations, setConversations, setMessages } = useConversation();
    const { messageRequests, setMessageRequests } = useFriendStore();

    // ✅ KABUL ET: Bekleyen conversation'ı "active" durumuna çevirir
    const acceptRequest = async (conversationId) => {
        setLoading(true);
        try {
            // Backend'e PUT isteği → /api/conversations/accept/:conversationId
            // Conversation'ın status'unu "pending" → "active" yapar
            const res = await fetch(`/api/conversations/accept/${conversationId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to accept request");

            // Zustand Store Güncellemeleri:
            // 1. Sidebar'daki conversation'ın status'unu "active" yap
            // conversationId ile eşleşen conversation'ı bul ve güncelle
            setConversations(conversations.map(c => {
                if (c.conversationId === conversationId || c._id === conversationId) {
                    return { ...c, status: "active" }; // spread ile kopyala, sadece status'u değiştir
                }
                return c; // diğerlerini olduğu gibi bırak
            }));

            // 2. Seçili konuşma statüsünü güncelle (ID bozulmadan)
            // Kullanıcı şu an bu conversation'ı görüntülüyorsa, banner'ın kaybolması için status güncellemeli
            if (selectedConversation && (selectedConversation.conversationId === conversationId || selectedConversation._id === conversationId)) {
                setSelectedConversation({ ...selectedConversation, status: "active" });
            }

            // 3. Requests sekmesindeki istekler listesinden çıkar
            setMessageRequests(messageRequests.filter(req => req.conversationId !== conversationId && req._id !== conversationId));

            toast.success("Chat request accepted!");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // ❌ REDDET: İsteği ve conversation'daki mesajları tamamen siler
    const declineRequest = async (userId) => {
        setLoading(true);
        try {
            // Backend'e DELETE isteği → /api/messages/clear/:userId
            // Bu endpoint conversation'ı ve tüm mesajları siler
            const res = await fetch(`/api/messages/clear/${userId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' }
            });
            if (!res.ok) throw new Error("Failed to delete request");

            // Zustand Store Temizliği:
            setConversations(conversations.filter(c => c._id !== userId)); // Sidebar'dan kaldır
            setSelectedConversation(null);  // Seçili conversation'ı temizle
            setMessages([]);                // Mesajları temizle
            setMessageRequests(messageRequests.filter(req => req._id !== userId)); // Requests listesinden kaldır

            toast.success("Request deleted");
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return { acceptRequest, declineRequest, loading };
};

export default useRespondToMessageRequests;
