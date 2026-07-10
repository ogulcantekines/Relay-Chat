import Conversation from "./Conversation";
import useGetConversations from "../../hooks/conversation/useGetConversations";

// Conversations Bileşeni - Sidebar'daki "Chats" sekmesinin içeriği
// useGetConversations hook'u ile backend'den çekilen sohbet listesini render eder.
// Arkadaşlık sistemi ile bağlantısı:
// - useGetConversations pending/active filtreleme yapar (sadece uygun olanları gösterir)
// - Boş durumda kullanıcıyı arkadaş eklemeye yönlendirir
// - Yeni draft conversation'lar useSendMessage tarafından bu listeye eklenir

const Conversations = () => {
    // useGetConversations custom hook'u, conversations ve loading state'lerini döndürüyor
    const { loading, conversations } = useGetConversations();

    return (
        <div className="py-1 sm:py-2 flex flex-col overflow-y-auto scrollbar-thin">

            {/* conversations array'ini map ile dönüyoruz ve her bir conversation için Conversation bileşenini render ediyoruz
            map fonksiyonu, her bir conversation'ı alır ve Conversation bileşenine geçirir. Hepsini sırayla döner */}

            {/* Boş durum: Henüz hiç sohbet yoksa kullanıcıyı arkadaş eklemeye yönlendir */}
            {conversations.length === 0 && (
                <div className="flex justify-center py-4">
                    <span className="text-gray-400 text-center text-md">No conversations yet. <br /> Start a conversation by adding a friend!</span>
                </div>
            )}

            {/* Sohbet listesi: Her conversation için <Conversation /> bileşeni render et */}
            {conversations.map((conversation, idx) => (
                <Conversation
                    key={conversation._id}
                    conversation={conversation}
                    isLast={idx === conversations.length - 1}
                />
            ))}

            {/* Loading spinner: Sadece loading VE conversation yoksa görünsün */}
            {/* Zaten yüklenmiş conversation varsa tekrar spinner gösterme */}
            {loading && conversations.length === 0 && (
                <div className="flex justify-center py-4">
                    <span className="loading loading-spinner loading-sm"></span>
                </div>
            )}
        </div>
    );
}

export default Conversations;
