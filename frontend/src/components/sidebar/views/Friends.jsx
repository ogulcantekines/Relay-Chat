import Avatar from '../../Avatar';
import { useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import { FiMessageSquare, FiUserMinus, FiCheck, FiX } from "react-icons/fi";
import useGetFriends from "../../../hooks/friends/useGetFriends";
import useRemoveFriend from "../../../hooks/friends/useRemoveFriend";
import useGetFriendRequests from "../../../hooks/friends/useGetFriendRequests";
import useGetSentRequests from "../../../hooks/friends/useGetSentRequests";
import useRespondToFriendRequests from "../../../hooks/friends/useRespondToFriendRequests";
import useCancelRequest from "../../../hooks/friends/useCancelRequest";
import useSocket from "../../../zustand/useSocket";
import useConversation from "../../../zustand/useConversation";

// Friends Bileşeni - Arkadaş yönetim sayfası
// Sidebar'daki "Arkadaşlar" butonuna basıldığında gösterilir.
// 3 ana sekme içerir:
// 1. Tümü → Mevcut arkadaş listesi (mesaj gönder, arkadaştan çıkar)
// 2. Bekleyen → Gelen ve gönderilen arkadaşlık istekleri (kabul/red/iptal)
//
// Props:
// - onBack: Ana sidebar'a dönmek için çağrılan fonksiyon
// - initialTab: Başlangıç sekmesi (bildirimden açılınca "pending" gelir, normal açılınca "all")

const Friends = ({ onBack, initialTab }) => {
    // initialTab prop'u varsa onu kullan, yoksa "all" kullan
    // Bildirimden açılınca initialTab="pending" gelir
    const [activeTab, setActiveTab] = useState(initialTab || "all");
    const [pendingSubTab, setPendingSubTab] = useState("incoming"); // Pending sekmesinin alt sekmesi

    // ═══════════ HOOK'LAR ═══════════
    // Her hook kendi verisini çeker ve ilgili aksiyonu döndürür
    const { friends, loading } = useGetFriends();                        // Arkadaş listesi
    const { handleRemoveFriend, loading: removingFriend } = useRemoveFriend(); // Arkadaş çıkarma
    const { incomingFriendRequests, loading: loadingIncoming } = useGetFriendRequests();  // Gelen istekler
    const { sentFriendRequests, loading: loadingOutgoing } = useGetSentRequests();        // Gönderilen istekler
    const { respondToRequest, loading: responding } = useRespondToFriendRequests();       // İsteğe yanıt ver
    const { cancelRequest, loading: canceling } = useCancelRequest();                    // İstek iptal et
    const { onlineUsers } = useSocket();                                 // Online kullanıcı ID listesi
    const { setSelectedConversation } = useConversation();               // Conversation seçme

    // loading: sendLoading gibi alias kullanımı → aynı anda birden fazla hook'un loading'ini ayırt etmek için
    // Örnek: { loading: removingFriend } → hook'un loading'ini "removingFriend" adıyla kullan

    return (
        <div className="h-full flex flex-col bg-[color:var(--bg-base)]">
            {/* ═══════════ HEADER ═══════════ */}
            <div className="p-4  flex items-center gap-3">
                {/* Geri butonu → onBack prop'u ile ana sidebar'a döner */}
                <button
                    onClick={onBack}
                    className="w-9 h-9 icon-btn transition-colors"
                >
                    <IoArrowBack />
                </button>
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Arkadaşlar</h2>
            </div>

            {/* ═══════════ ANA SEKMELER ═══════════ */}
            <div className="px-4 py-3 ">
                <div className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("all")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors`}
                        style={{
                            background: activeTab === "all" ? 'var(--accent-soft)' : 'transparent',
                            color: activeTab === "all" ? 'var(--accent-hover)' : 'var(--text-secondary)'
                        }}
                    >
                        Tümü
                    </button>
                    <button
                        onClick={() => setActiveTab("pending")}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors relative`}
                        style={{
                            background: activeTab === "pending" ? 'var(--accent-soft)' : 'transparent',
                            color: activeTab === "pending" ? 'var(--accent-hover)' : 'var(--text-secondary)'
                        }}
                    >
                        Bekleyen
                        {/* Gelen istek sayısı badge'i - 0'dan büyükse kırmızı yuvarlak */}
                        {(incomingFriendRequests.length) > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                                {incomingFriendRequests.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* ═══════════ PENDING ALT SEKMELERI ═══════════ */}
            {/* Sadece Pending sekmesi aktifken göster */}
            {activeTab === "pending" && (
                <div className="px-4 py-2" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPendingSubTab("incoming")}
                            className='px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
                            style={{
                                background: pendingSubTab === "incoming" ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                                color: pendingSubTab === "incoming" ? 'var(--accent-hover)' : 'var(--text-secondary)',
                                border: `1px solid ${pendingSubTab === "incoming" ? 'var(--accent)' : 'transparent'}`
                            }}
                        >
                            Gelen ({incomingFriendRequests.length})
                        </button>
                        <button
                            onClick={() => setPendingSubTab("outgoing")}
                            className='px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'
                            style={{
                                background: pendingSubTab === "outgoing" ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                                color: pendingSubTab === "outgoing" ? 'var(--accent-hover)' : 'var(--text-secondary)',
                                border: `1px solid ${pendingSubTab === "outgoing" ? 'var(--accent)' : 'transparent'}`
                            }}
                        >
                            Giden ({sentFriendRequests.length})
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════════ İÇERİK ALANI ═══════════ */}
            <div className="flex-1 overflow-y-auto p-4">

                {/* ──────── ALL FRIENDS (Tüm Arkadaşlar) ──────── */}
                {activeTab === "all" && (
                    <div className="space-y-2">
                        <h3 className="text-xs font-semibold mb-2.5">
                            Tüm arkadaşlar ({friends.length})
                        </h3>

                        {loading ? (
                            <div className="flex justify-center py-8">
                                <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent)' }} />
                            </div>
                        ) : friends.length === 0 ? (
                            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                Henüz arkadaşın yok
                            </div>
                        ) : (
                            // Arkadaş listesini map ile dön, her biri için kart render et
                            friends.map((friend) => {
                                const isOnline = onlineUsers.includes(friend._id); // Online mı kontrol

                                return (
                                    <div
                                        key={friend._id}
                                        className="flex items-center gap-3 p-3 rounded-xl transition-colors"
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                    >
                                        {/* Avatar + Online göstergesi */}
                                        <div className="relative">
                                            <Avatar
                                                name={friend.fullName} src={friend.profilePic}
                                                alt={friend.username}
                                                className="w-12 h-12 rounded-full"
                                            />
                                            {isOnline && (
                                                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></div>
                                            )}
                                        </div>

                                        {/* İsim ve Kullanıcı Adı */}
                                        <div className="flex-1">
                                            <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{friend.fullName}</p>
                                            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{friend.username}</p>
                                        </div>

                                        {/* Aksiyon Butonları */}
                                        <div className="flex gap-2">
                                            {/* Mesaj gönder → conversation seç ve ana sidebar'a dön */}
                                            <button
                                                onClick={() => {
                                                    setSelectedConversation(friend);
                                                    onBack(); // Friends sayfasından çık
                                                }}
                                                className="btn-primary-grad flex items-center gap-1.5 px-3 py-2 text-xs flex-shrink-0"
                                                title="Mesaj gönder"
                                            >
                                                <FiMessageSquare size={14} />
                                                Mesaj
                                            </button>
                                            {/* Arkadaştan çıkar */}
                                            <button
                                                onClick={() => handleRemoveFriend(friend._id)}
                                                disabled={removingFriend}
                                                className="w-9 h-9 rounded-xl flex items-center justify-center text-sm disabled:opacity-50 flex-shrink-0"
                                                style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}
                                                title="Arkadaşlıktan çıkar"
                                            >
                                                <FiUserMinus />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ──────── PENDING (Bekleyen İstekler) ──────── */}
                {activeTab === "pending" && (
                    <div className="space-y-2">

                        {/* ── Incoming (Gelen İstekler) ── */}
                        {pendingSubTab === "incoming" && (
                            <>
                                <h3 className="text-xs font-semibold mb-2.5">
                                    Gelen istekler ({incomingFriendRequests.length})
                                </h3>

                                {loadingIncoming ? (
                                    <div className="flex justify-center py-8">
                                        <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent)' }} />
                                    </div>
                                ) : incomingFriendRequests.length === 0 ? (
                                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                        Gelen istek yok
                                    </div>
                                ) : (
                                    // request.senderId → populate edilmiş, tam kullanıcı objesi
                                    incomingFriendRequests.map((request) => (
                                        <div
                                            key={request._id}
                                            className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <Avatar
                                                src={request.senderId.profilePic}
                                                alt={request.senderId.username}
                                                className="w-12 h-12 rounded-full"
                                            />

                                            <div className="flex-1">
                                                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{request.senderId.fullName}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{request.senderId.username}</p>
                                            </div>

                                            <div className="flex gap-2">
                                                {/* Kabul et → respondToRequest(id, "accept") */}
                                                <button
                                                    onClick={() => respondToRequest(request._id, "accept")}
                                                    disabled={responding}
                                                    className="p-2 bg-green-500 hover:bg-green-600 rounded-lg transition-colors disabled:opacity-50"
                                                    title="Kabul et"
                                                >
                                                    <FiCheck className="text-white" />
                                                </button>
                                                {/* Reddet → respondToRequest(id, "reject") */}
                                                <button
                                                    onClick={() => respondToRequest(request._id, "reject")}
                                                    disabled={responding}
                                                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm disabled:opacity-50 flex-shrink-0"
                                                style={{ background: 'color-mix(in srgb, var(--danger) 14%, transparent)', color: 'var(--danger)', border: '1px solid color-mix(in srgb, var(--danger) 30%, transparent)' }}
                                                    title="Reddet"
                                                >
                                                    <FiX className="text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}

                        {/* ── Outgoing (Gönderilen İstekler) ── */}
                        {pendingSubTab === "outgoing" && (
                            <>
                                <h3 className="text-xs font-semibold mb-2.5">
                                    Gönderilen istekler ({sentFriendRequests.length})
                                </h3>

                                {loadingOutgoing ? (
                                    <div className="flex justify-center py-8">
                                        <span className="w-5 h-5 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent)' }} />
                                    </div>
                                ) : sentFriendRequests.length === 0 ? (
                                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                        Gönderilen istek yok
                                    </div>
                                ) : (
                                    // request.receiverId → populate edilmiş, tam kullanıcı objesi
                                    sentFriendRequests.map((request) => (
                                        <div
                                            key={request._id}
                                            className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <Avatar
                                                src={request.receiverId.profilePic}
                                                alt={request.receiverId.username}
                                                className="w-12 h-12 rounded-full"
                                            />

                                            <div className="flex-1">
                                                <p className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{request.receiverId.fullName}</p>
                                                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>@{request.receiverId.username}</p>
                                            </div>

                                            {/* İptal et → cancelRequest(id) */}
                                            <button
                                                onClick={() => cancelRequest(request._id)}
                                                disabled={canceling}
                                                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 text-white text-sm font-medium"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

export default Friends;