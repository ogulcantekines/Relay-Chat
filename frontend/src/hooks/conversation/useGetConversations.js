import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../zustand/useAuth';
import useConversation from '../../zustand/useConversation';

// useGetConversations - Tüm konuşmaları backend'den çeken hook
// Sidebar yüklendiğinde çalışır ve useConversation store'a sohbet listesini yazar.
// Backend'den gelen conversation'ları formatlar ve arkadaşlık sistemi mantığına göre filtreler.
//
// 🔑 Filtreleme Mantığı:
// - "active" conversation → Doğrudan göster (arkadaş olsun olmasın, kabul edilmiş sohbet)
// - "pending" conversation → SADECE SEN gönderdiysen göster (karşı tarafın sidebar'ında gözükmemeli)
// Bu mantık, Discord'un "mesaj isteği" sistemine benzer.

const useGetConversations = () => {
    const [loading, setLoading] = useState(false);
    const authUser = useAuth((state) => state.authUser);
    const { conversations, setConversations, isConversationsLoaded, setIsConversationsLoaded } = useConversation();

    useEffect(() => {
        const getConversations = async () => {
            // 🔥 CACHE KONTROLÜ: Daha önce yüklendiyse tekrar fetch etme
            // isConversationsLoaded flag'i sayfa yenilenene kadar true kalır
            if (isConversationsLoaded) return;

            if (!authUser) return; // Giriş yapılmamışsa çalışma
            setLoading(true);
            try {
                // Backend'e GET isteği → /api/conversations
                // getConversations controller'ı çalışır:
                // Conversation.find({ participants: userId }).populate("participants").populate("messages")
                const res = await fetch('/api/conversations', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch conversations");
                }

                const data = await res.json();
                //res.json() metodu, fetch API'si ile yapılan bir HTTP isteğinin yanıtını JSON formatında ayrıştırmak için kullanılır.
                //res.json() metodu bir Promise döner, bu yüzden await ile beklenir.
                //data artık JS object/array

                // Backend'den gelen conversation'ları frontend için düzenle
                const formattedConversations = data.map(conv => {
                    // participants dizisinden KENDİMİZ OLMAYAN kullanıcıyı bul
                    // Conversation'da 2 participant var: biz ve karşı taraf
                    const otherParticipant = conv.participants.find(
                        part => part._id !== authUser._id
                    );
                    // Sidebar'da gösterilecek formatta döndür
                    return {
                        ...otherParticipant,  // fullName, profilePic, username, _id (karşı tarafın user _id'si)
                        conversationId: conv._id,          // Conversation'ın kendi MongoDB _id'si
                        lastMessage: conv.messages[0] || null, // Son mesaj (populate edilmiş)
                        status: conv.status                 // "active" veya "pending"
                    };
                }).filter(conv => {
                    // ═══════════ ARKADAŞLIK SİSTEMİ FİLTRESİ ═══════════
                    if (conv.status === 'active') {
                        // Active conversation → her zaman göster
                        return true;
                    }
                    else if (conv.status === 'pending') {
                        // Pending conversation → SADECE gönderenin sidebar'ında göster
                        // .toString() önemli! Backend'den gelen senderId ObjectId objesi,
                        // authUser._id ise string. Direkt === ile karşılaştırınca eşleşmez.
                        // ObjectId("675abc123") !== "675abc123" → FALSE (bug!)
                        // ObjectId("675abc123").toString() === "675abc123" → TRUE (doğru!)
                        return conv.lastMessage && conv.lastMessage.senderId.toString() === authUser._id;

                    }
                    return false; // Bilinmeyen status'lar gösterilmez
                });

                setConversations(formattedConversations); // Zustand store'a yaz
                setIsConversationsLoaded(true); // 🔥 Cache flag'i → tekrar fetch etme

            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getConversations();
    }, [authUser]);

    return { loading, conversations };
};


export default useGetConversations;
