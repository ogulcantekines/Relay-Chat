import Messages from "./Messages";
import MessageInput from "./MessageInput";
import { TiMessages } from "react-icons/ti";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import useListenTyping from "../../hooks/socket/useListenTyping";
import useListenMessagesRead from "../../hooks/socket/useListenMessagesRead";
import useClearConversation from "../../hooks/messages/useClearConversation";
import useListenEditedMessages from "../../hooks/socket/useListenEditedMessages";
import useListenDeletedMessages from "../../hooks/socket/useListenDeletedMessages";
import useListenReactions from "../../hooks/socket/useListenReactions";
import useUnread from "../../zustand/useUnread";
import useAuth from "../../zustand/useAuth";
import useRespondToMessageRequests from "../../hooks/friends/useRespondToMessageRequests";
import { useEffect, useState } from "react";
import { IoClose, IoSearch, IoArrowBack } from "react-icons/io5";
import useFriendStore from "../../zustand/useFriend";
import useSendFriendRequest from "../../hooks/friends/useSendFriendRequest";
import useRespondToFriendRequests from "../../hooks/friends/useRespondToFriendRequests";

// MessageContainer Bileşeni - Mesaj görüntüleme alanı
// Bu bileşen arkadaşlık sistemiyle yoğun şekilde entegre çalışır:
// 1. Mesaj isteği Banner'ı → pending conversation'da alıcıya Accept/Delete seçenekleri sunar
// 2. Arkadaşlık durumu Banner'ı → arkadaş değilse "Arkadaş ekle" / "İsteği kabul et" banner'ı gösterir
// 3. Online/offline durumu → sadece seçili sohbetin kişisi için gösterilir
// 4. chatOpened event → sadece gerçek conversation'lar için emit edilir (draft'lar için değil)

const MessageContainer = () => {

    const { selectedConversation, setSelectedConversation, conversations } = useConversation();
    const { onlineUsers, socket } = useSocket();
    const clearUnread = useUnread((s) => s.clear);
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
    const [searchTerm, setSearchTerm] = useState("");   // sohbet içi mesaj arama
    const [showSearch, setShowSearch] = useState(false);
    const { friends, incomingFriendRequests, sentFriendRequests, addSentFriendRequest } = useFriendStore();
    const { sendFriendRequest, loading: sendFriendLoading } = useSendFriendRequest();
    const { respondToRequest, loading: respondFriendLoading } = useRespondToFriendRequests();

    // Sohbet değişince banner görünürlüğünü sıfırla (her kişi için yeni şans)
    useEffect(() => {
        setIsBannerDismissed(false);
        setSearchTerm("");      // sohbet değişince arama sıfırlansın
        setShowSearch(false);
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
    useListenDeletedMessages(); // Silinen mesajları dinle
    useListenReactions(); // Emoji tepkilerini dinle

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
        // Sohbet açıldığında o kişiye ait okunmamış rozetini sıfırla
        if (selectedConversation) clearUnread(selectedConversation._id);
    }, [selectedConversation, socket, conversations, clearUnread]);

    // Sohbeti temizle butonuna tıklanınca
    const handleClearChat = () => {
        if (selectedConversation) {
            clearConversation(selectedConversation._id);
        }
    };

    const noChatSelected = !selectedConversation;
    const isOnline = selectedConversation && onlineUsers.includes(selectedConversation._id);

    return (
        <div className="flex flex-col h-full w-full min-w-0" style={{ background: 'var(--bg-base)' }}>
            {noChatSelected ? <NoChatSelected /> : (<> {/* Sohbet seçilmemişse NoChatSelected, seçilmişse mesaj alanı */}

                {/* ═══════════ HEADER ═══════════ */}
                <div
                    className='flex items-center gap-3 px-4 py-2.5 flex-shrink-0'
                    style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--bg-panel)' }}
                >
                    {/* Dar ekranda listeye dön */}
                    <button
                        onClick={() => setSelectedConversation(null)}
                        className='md:hidden w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0'
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                        title='Geri'
                    >
                        <IoArrowBack />
                    </button>

                    <div className='relative flex-shrink-0'>
                        <img
                            src={selectedConversation.profilePic}
                            alt=''
                            className='w-10 h-10 rounded-full object-cover'
                            style={{ border: '1px solid var(--border-subtle)' }}
                        />
                        {isOnline && (
                            <span
                                className='absolute bottom-0 right-0 w-3 h-3 rounded-full'
                                style={{ background: 'var(--online)', border: '2px solid var(--bg-panel)' }}
                            />
                        )}
                    </div>

                    <div className='min-w-0 flex-1'>
                        <div className='font-semibold text-sm truncate' style={{ color: 'var(--text-primary)' }}>
                            {selectedConversation.fullName}
                        </div>
                        <div className='text-xs flex items-center gap-1.5' style={{ color: 'var(--text-muted)' }}>
                            {isTyping ? (
                                <span className='flex items-center gap-1' style={{ color: 'var(--accent-hover)' }}>
                                    <span className='flex gap-0.5'>
                                        <span className='w-1 h-1 rounded-full dot-blink' style={{ background: 'currentColor' }} />
                                        <span className='w-1 h-1 rounded-full dot-blink' style={{ background: 'currentColor', animationDelay: '0.2s' }} />
                                        <span className='w-1 h-1 rounded-full dot-blink' style={{ background: 'currentColor', animationDelay: '0.4s' }} />
                                    </span>
                                    yazıyor
                                </span>
                            ) : isOnline ? (
                                <span style={{ color: 'var(--online)' }}>çevrimiçi</span>
                            ) : (
                                <span>çevrimdışı</span>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setShowSearch(v => !v)}
                        className='w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0'
                        style={{
                            background: showSearch ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                            color: showSearch ? 'var(--accent-hover)' : 'var(--text-secondary)'
                        }}
                        title='Mesajlarda ara'
                    >
                        <IoSearch />
                    </button>

                    <button
                        onClick={handleClearChat}
                        disabled={loading}
                        className='w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 text-sm'
                        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                        title='Sohbeti temizle'
                    >
                        {loading ? '...' : '🗑️'}
                    </button>
                </div>

                {/* Sohbet içi arama çubuğu */}
                {showSearch && (
                    <div className='px-4 py-2 flex-shrink-0' style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <input
                            autoFocus
                            type='text'
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder='Bu sohbette ara...'
                            className='field text-sm'
                        />
                    </div>
                )}

                {/* ═══════════ MESAJ İSTEĞİ BANNER'I ═══════════ */}
                {/* Gösterilme koşulları:
                    1. isPending → Conversation status "pending" olmalı
                    2. isReceiver → Son mesajı karşı taraf göndermiş olmalı (biz alıcıyız)
                    Bu banner sadece ALICIYA gösterilir → "Kabul et ve sohbet et" veya "Delete" */}
                {isPending && isReceiver && (
                    <div className="bg-[color:var(--bg-panel)] p-6 border-b border-[color:var(--border-subtle)] flex flex-col items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500 backdrop-blur-md">
                        <div className="text-center px-4">
                            <h3 className="text-white text-lg font-bold flex items-center gap-2 justify-center">
                                📩 Yeni mesaj isteği
                            </h3>
                            <p className="text-sm text-[color:var(--text-muted)] mt-1">
                                {selectedConversation.fullName} seninle sohbet etmek istiyor.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full max-w-xs justify-center">
                            {/* Kabul → acceptRequest(conversationId) → conversation status "active" olur */}
                            <button
                                onClick={() => acceptRequest(selectedConversation.conversationId)}
                                disabled={actionLoading}
                                className="btn btn-sm flex-1 bg-green-600 hover:bg-green-700 border-none text-white h-11"
                            >
                                {actionLoading ? <span className="loading loading-spinner loading-sm"></span> : "Kabul et ve sohbet et"}
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
                    - sentRequest var → "İstek zaten gönderildi"
                    - incomingRequest var → "X sana istek gönderdi" + Accept butonu
                    - İkisi de yok → "Arkadaş değilsiniz: X" + Add Friend butonu */}
                {!isPending && !isFriend && !isBannerDismissed && conversations.some(c => c._id === selectedConversation._id) && (
                    <div className="bg-[color:var(--accent)]/10 p-2 border-b border-[color:var(--accent)]/20 flex items-center justify-between group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 ml-2">
                            <TiMessages className="text-[color:var(--accent-hover)] text-xl" />
                            <div>
                                <span className="text-xs font-semibold text-[color:var(--accent-hover)] block uppercase tracking-wider">Arkadaşlık durumu</span>
                                <p className="text-sm text-[color:var(--text-secondary)]">
                                    {sentRequest
                                        ? "İstek zaten gönderildi"
                                        : incomingRequest
                                            ? `${selectedConversation.fullName} sana istek gönderdi`
                                            : `Arkadaş değilsiniz: ${selectedConversation.fullName}`}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Gelen istek varsa → Accept Request butonu */}
                            {incomingRequest && (
                                <button
                                    onClick={() => respondToRequest(incomingRequest._id, "accept")}
                                    disabled={respondFriendLoading}
                                    className="btn btn-xs bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] border-none text-white px-4"
                                >
                                    {respondFriendLoading ? "..." : "İsteği kabul et"}
                                </button>
                            )}

                            {/* Ne gönderilen ne gelen istek varsa → Add Friend butonu */}
                            {!sentRequest && !incomingRequest && (
                                <button
                                    onClick={handleAddFriend}
                                    disabled={sendFriendLoading}
                                    className="btn btn-xs btn-info bg-[color:var(--accent)]/20 hover:bg-[color:var(--accent)] border-[color:var(--accent)]/50 text-[color:var(--accent-hover)] hover:text-white transition-all"
                                >
                                    {sendFriendLoading ? "..." : "Arkadaş ekle"}
                                </button>
                            )}

                            {/* Banner'ı kapat (X butonu) */}
                            <button
                                onClick={() => setIsBannerDismissed(true)}
                                className="p-1.5 hover:bg-white/10 rounded-full text-[color:var(--text-muted)] hover:text-white transition-colors ml-2"
                                title="Kapat"
                            >
                                <IoClose className="text-lg" />
                            </button>
                        </div>
                    </div>
                )}

                {/* ═══════════ MESAJLAR ═══════════ */}
                <div className="flex-1 min-h-0 flex flex-col">
                    <Messages searchTerm={searchTerm} />
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
    const { authUser } = useAuth();
    return (
        <div className='flex flex-col items-center justify-center w-full h-full gap-3 px-6 text-center'>
            <div
                className='w-16 h-16 rounded-2xl flex items-center justify-center text-3xl'
                style={{ background: 'var(--accent-soft)' }}
            >
                <TiMessages style={{ color: 'var(--accent-hover)' }} />
            </div>
            <h2 className='text-lg font-semibold' style={{ color: 'var(--text-primary)' }}>
                Hoş geldin, {authUser?.fullName?.split(' ')[0] || 'yolcu'} 👋
            </h2>
            <p className='text-sm max-w-xs' style={{ color: 'var(--text-secondary)' }}>
                Soldaki listeden bir sohbet seç ya da arkadaş kodunu paylaşarak yeni biriyle konuşmaya başla.
            </p>
        </div>
    );
};

export { NoChatSelected };
