import { useState, useEffect, useCallback } from "react";
import useFriendStore from "../../zustand/useFriend";
import useAuth from "../../zustand/useAuth";

// useGetMessageRequests - Arkadaş olmayan birinden gelen mesaj isteklerini çeken hook
// Bu hook, pending durumundaki conversation'ları backend'den çeker ve filtreleyerek
// sadece SANA gönderilen mesaj isteklerini (karşı tarafın başlattığı) gösterir.
// Sidebar'daki "Requests" sekmesinde gösterilir.

const useGetMessageRequests = () => {
    const { authUser } = useAuth();
    const { setMessageRequests } = useFriendStore();
    const [loading, setLoading] = useState(false);

    // useCallback ile fonksiyonu memoize ediyoruz (gereksiz yeniden oluşturmayı önler)
    // Bu sayede refreshRequests fonksiyonu sadece authUser veya setMessageRequests değiştiğinde yeniden oluşturulur
    const getMessageRequests = useCallback(async () => {
        if (!authUser) return; // Giriş yapılmamışsa çalışma
        setLoading(true);
        try {
            // Backend'e GET isteği → /api/conversations/status/pending
            // getConversationsByStatus controller'ı çalışır ve pending conversation'ları döner
            const res = await fetch(`/api/conversations/status/pending`);
            const data = await res.json();

            if (!res.ok || data.message) {
                throw new Error(data.message || "Failed to fetch message requests");
            }

            // Backend'den gelen conversation listesini işle:
            // 1. Her conversation'dan "diğer kullanıcıyı" (karşı tarafı) bul
            // 2. Conversation ID'si ve son mesajı ekle
            const requests = data.map(conv => {
                // participants dizisinden kendimiz OLMAYAN kullanıcıyı bul
                const otherUser = conv.participants.find(p => p._id !== authUser._id);
                return {
                    ...otherUser,                          // Karşı tarafın bilgileri (fullName, profilePic, username)
                    conversationId: conv._id,              // Conversation'ın MongoDB _id'si
                    lastMessage: conv.messages[0] || null  // Son mesaj (populate edilmiş)
                };
            }).filter(req => req.lastMessage && req.lastMessage.senderId.toString() !== authUser._id.toString());
            // ⬆️ Filtre: Sadece SON MESAJI SEN GÖNDERMEDİĞİN conversation'ları al
            // Yani: karşı taraf sana mesaj atmış → bu bir "mesaj isteği"
            // .toString() → ObjectId ile String karşılaştırma hatasını önler

            setMessageRequests(requests); // Zustand store'a yaz
        } catch (error) {
            console.error("Error fetching message requests:", error.message);
        } finally {
            setLoading(false);
        }
    }, [authUser, setMessageRequests]);

    // Component mount olduğunda otomatik çalış
    useEffect(() => {
        getMessageRequests();
    }, [getMessageRequests]);

    // refreshRequests: Dışarıdan tekrar çekmek istendiğinde kullanılır (örn: istek kabul edildikten sonra)
    return { loading, refreshRequests: getMessageRequests };
};

export default useGetMessageRequests;
