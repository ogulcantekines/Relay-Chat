import Messages from "./Messages";
import MessageInput from "./MessageInput";
import { TiMessages } from "react-icons/ti";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import useListenTyping from "../../hooks/socket/useListenTyping";
import useListenMessagesRead from "../../hooks/socket/useListenMessagesRead";
import useClearConversation from "../../hooks/messages/useClearConversation";
import useListenEditedMessages from "../../hooks/socket/useListenEditedMessages";
import useAuth from "../../zustand/useAuth";
import useRespondToMessageRequests from "../../hooks/friends/useRespondToMessageRequests";
import { useEffect, useState } from "react";
import { IoClose } from "react-icons/io5";
import useFriendStore from "../../zustand/useFriend";
import useSendFriendRequest from "../../hooks/friends/useSendFriendRequest";
import useRespondToFriendRequests from "../../hooks/friends/useRespondToFriendRequests";

// MessageContainer Bileşeni - Mesaj görüntüleme alanı
// Bu bileşen arkadaşlık sistemiyle yoğun şekilde entegre çalışır:
// 1. Mesaj isteği Banner'ı → pending conversation'da alıcıya Accept/Delete seçenekleri sunar
// 2. Arkadaşlık durumu Banner'ı → arkadaş değilse "Add Friend" / "Accept Request" banner'ı gösterir
// 3. Online/offline durumu → sadece seçili sohbetin kişisi için gösterilir
// 4. chatOpened event → sadece gerçek conversation'lar için emit edilir (draft'lar için değil)

const MessageContainer = () => {

    const { selectedConversation, conversations } = useConversation();
    const { onlineUsers, socket } = useSocket();
    const { isTyping } = useListenTyping();
    const { clearConversation, loading } = useClearConversation();

    const { authUser } = useAuth();
    const { acceptRequest, declineRequest, loading: actionLoading } = useRespondToMessageRequests();

    // ═══════════ MESAJ İSTEĞİ DURUMU ═══════════
    // isPending → Conversation status'u "pending" mi? (arkadaş olmayan birinden gelen ilk mesaj)
    const isPending = selectedConversation?.status === "pending";
    // isReceiver → Son mesajı BİZ mi gönderdik, yoksa karşı taraf mı?
    // Sadece alıcıysak Accept/Delete banner'ını göster (gönderen kendi isteğini kabul edemez)
    const isReceiver = selectedConversation?.lastMessage && selectedConversation?.lastMessage?.senderId !== authUser._id;

    // ═══════════ ARKADAŞLIK DURUMU BANNER LOGIC ═══════════
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const { friends, incomingFriendRequests, sentFriendRequests, addSentFriendRequest } = useFriendStore();
    const { sendFriendRequest, loading: sendFriendLoading } = useSendFriendRequest();
    const { respondToRequest, loading: respondFriendLoading } = useRespondToFriendRequests();

    // Sohbet değişince banner görünürlüğünü sıfırla (her kişi için yeni şans)
    useEffect(() => {
        setIsBannerDismissed(false);
    }, [selectedConversation?._id]);

    // Seçili kişi arkadaş mı? → friends dizisinde ID'si var mı kontrol et
    const isFriend = selectedConversation && friends.some(f => f._id === selectedConversation._id);
    // Seçili kişiye zaten istek göndermişiz mi? → sentFriendRequests'te kontrol et
    const sentRequest = selectedConversation && sentFriendRequests.find(r => r.receiverId?._id === selectedConversation._id || r._id === selectedConversation._id);
    // Seçili kişi bize istek göndermiş mi? → incomingFriendRequests'te kontrol et
    const incomingRequest = selectedConversation && incomingFriendRequests.find(r => r.senderId?._id === selectedConversation._id || r._id === selectedConversation._id);

    // Arkadaş ekle butonuna basıldığında
    const handleAddFriend = async () => {
        const success = await sendFriendRequest(selectedConversation._id);
        if (success) {
            // Zustand store'a ekle → banner anında "Request already sent" olarak güncellenir
            addSentFriendRequest(selectedConversation);
        }
    };

    useListenMessagesRead(); // Okundu bildirimlerini dinle
    useListenEditedMessages(); // Düzenlenen mesajları dinle

    // ═══════════ CHAT AÇILMA BİLDİRİMİ ═══════════
    // Backend'e "bu sohbeti açtım" bilgisi gönder (okundu bilgisi için)
    // ⚠️ conversations.some kontrolü → Sadece sidebar'da OLAN (gerçek) konuşmalar için emit et
    // AddFriend'den "Mesaj Gönder" denildiğinde selectedConversation set ediliyor
    // ama henüz DB'de conversation yok. Backend'e gereksiz sinyal gitmemeli.
    useEffect(() => {
        const isRealConversation = conversations.some(c => c._id === selectedConversation?._id);
        if (selectedConversation && socket && isRealConversation) {
            socket.emit("chatOpened", {
                otherUserId: selectedConversation._id
            });
        }
    }, [selectedConversation, socket, conversations]);

    // Sohbeti temizle butonuna tıklanınca
    const handleClearChat = () => {
        if (selectedConversation) {
            clearConversation(selectedConversation._id);
        }
    };

    const noChatSelected = !selectedConversation;
    const isOnline = selectedConversation && onlineUsers.includes(selectedConversation._id);

    return (
        <div className="md:min-w-[450px] flex flex-col h-full">
            {noChatSelected ? <NoChatSelected /> : (<> {/* Sohbet seçilmemişse NoChatSelected, seçilmişse mesaj alanı */}

                {/* ═══════════ HEADER ═══════════ */}
                <div className="bg-slate-500 px-4 py-2 mb-2 flex-shrink-0 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="label-text">To:</span>
                        <span className="text-gray-900 font-bold">{selectedConversation.fullName}</span>

                        {/* Yazıyor göstergesi → 3 animasyonlu mavi nokta */}
                        {isTyping && (
                            <div className="flex items-center gap-1">
                                <div className="flex gap-1">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                                <span className="text-blue-400 text-xs font-medium">typing...</span>
                            </div>
                        )}

                        {/* Online durumu göstergesi */}
                        {!isTyping && isOnline && (
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-green-600 text-xs font-medium">Online</span>
                            </div>
                        )}

                        {/* Offline durumu */}
                        {!isTyping && !isOnline && (
                            <span className="text-red-500 text-sm">Offline</span>
                        )}
                    </div>

                    {/* Sohbeti temizle butonu */}
                    <button
                        onClick={handleClearChat}
                        disabled={loading}
                        className="btn btn-sm btn-error btn-outline"
                        title="Clear chat"
                    >
                        {loading ? "..." : "🗑️ Clear Chat"}
                    </button>

                </div>

                {/* ═══════════ MESAJ İSTEĞİ BANNER'I ═══════════ */}
                {/* Gösterilme koşulları:
                    1. isPending → Conversation status "pending" olmalı
                    2. isReceiver → Son mesajı karşı taraf göndermiş olmalı (biz alıcıyız)
                    Bu banner sadece ALICIYA gösterilir → "Accept & Chat" veya "Delete" */}
                {isPending && isReceiver && (
                    <div className="bg-gray-800/95 p-6 border-b border-gray-700 flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md">
                        <div className="text-center px-4">
                            <h3 className="text-white text-lg font-bold flex items-center gap-2 justify-center">
                                📩 New Message Request
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">
                                {selectedConversation.fullName} wants to chat with you.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full max-w-xs justify-center">
                            {/* Kabul → acceptRequest(conversationId) → conversation status "active" olur */}
                            <button
                                onClick={() => acceptRequest(selectedConversation.conversationId)}
                                disabled={actionLoading}
                                className="btn btn-sm flex-1 bg-green-600 hover:bg-green-700 border-none text-white h-11"
                            >
                                {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : "Accept & Chat"}
                            </button>
                            {/* Reddet → declineRequest(userId) → conversation ve mesajlar silinir */}
                            <button
                                onClick={() => declineRequest(selectedConversation._id)}
                                disabled={actionLoading}
                                className="btn btn-sm flex-1 bg-transparent hover:bg-red-500/10 border border-red-500/50 text-red-500 h-11"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════ ARKADAŞLIK DURUMU BANNER'I ═══════════ */}
                {/* Gösterilme koşulları:
                    1. !isPending → Conversation pending DEĞİL (active veya draft)
                    2. !isFriend → Bu kişi arkadaş listende DEĞİL
                    3. !isBannerDismissed → Kullanıcı X ile kapatmamış
                    4. conversations.some → Sidebar'da olan gerçek bir conversation (draft değil)
                    
                    Banner 3 farklı durum gösterir:
                    - sentRequest var → "Request already sent..."
                    - incomingRequest var → "X sent you a request" + Accept butonu
                    - İkisi de yok → "You are not friends with X" + Add Friend butonu */}
                {!isPending && !isFriend && !isBannerDismissed && conversations.some(c => c._id === selectedConversation._id) && (
                    <div className="bg-sky-500/10 p-2 border-b border-sky-500/20 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 ml-2">
                            <TiMessages className="text-sky-400 text-xl" />
                            <div>
                                <span className="text-xs font-semibold text-sky-400 block uppercase tracking-wider">Friendship Status</span>
                                <p className="text-sm text-gray-300">
                                    {sentRequest
                                        ? "Request already sent..."
                                        : incomingRequest
                                            ? `${selectedConversation.fullName} sent you a request`
                                            : `You are not friends with ${selectedConversation.fullName}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Gelen istek varsa → Accept Request butonu */}
                            {incomingRequest && (
                                <button
                                    onClick={() => respondToRequest(incomingRequest._id, "accept")}
                                    disabled={respondFriendLoading}
                                    className="btn btn-xs bg-sky-500 hover:bg-sky-600 border-none text-white px-4"
                                >
                                    {respondFriendLoading ? "..." : "Accept Request"}
                                </button>
                            )}

                            {/* Ne gönderilen ne gelen istek varsa → Add Friend butonu */}
                            {!sentRequest && !incomingRequest && (
                                <button
                                    onClick={handleAddFriend}
                                    disabled={sendFriendLoading}
                                    className="btn btn-xs btn-info bg-sky-500/20 hover:bg-sky-500 border-sky-500/50 text-sky-400 hover:text-white transition-all"
                                >
                                    {sendFriendLoading ? "..." : "Add Friend"}
                                </button>
                            )}

                            {/* Banner'ı kapat (X butonu) */}
                            <button
                                onClick={() => setIsBannerDismissed(true)}
                                className="p-1.5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors ml-2"
                                title="Dismiss"
                            >
                                <IoClose className="text-lg" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════ MESAJLAR ═══════════ */}
                <div className="flex-1 overflow-hidden">
                    <Messages />
                </div>

                {/* ═══════════ MESAJ GİRİŞ ALANI ═══════════ */}
                <div className="flex-shrink-0">
                    <MessageInput />
                </div>
            </>)}
        </div>
    );
}
export default MessageContainer;

// Hiçbir sohbet seçilmediğinde gösterilecek bileşen
const NoChatSelected = () => {
    return (
        <div className='flex items-center justify-center w-full h-full'>
            <div className='px-4 text-center sm:text-lg md:text-xl text-gray-200 font-semibold flex flex-col items-center gap-2'>
                <p>Welcome 👋 ❄</p>
                <p>Select a chat to start messaging</p>
                <TiMessages className='text-3xl md:text-6xl text-center' />
            </div>
        </div>
    );
};
export { NoChatSelected };