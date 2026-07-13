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
// Sidebar'daki "Friends" butonuna basıldığında gösterilir.
// 3 ana sekme içerir:
// 1. All → Mevcut arkadaş listesi (mesaj gönder, arkadaştan çıkar)
// 2. Pending → Gelen ve gönderilen arkadaşlık istekleri (kabul/red/iptal)
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
                    className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
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
                <div className="px-4 py-2 bg-gray-850 border-b border-[color:var(--border-subtle)]">
                    <div className="flex gap-3">
                        <button
                            onClick={() => setPendingSubTab("incoming")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pendingSubTab === "incoming"
                                ? "" : ""
                                }`}
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                        >
                            Incoming ({incomingFriendRequests.length})
                        </button>
                        <button
                            onClick={() => setPendingSubTab("outgoing")}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${pendingSubTab === "outgoing"
                                ? "" : ""
                                }`}
                                style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                        >
                            Outgoing ({sentFriendRequests.length})
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
                                <span className="loading loading-spinner loading-md"></span>
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
                                            <img
                                                src={friend.profilePic}
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
                                                className="w-9 h-9 rounded-lg flex items-center justify-center transition-colors btn-primary-grad p-0"
                                                title="Mesaj gönder"
                                            >
                                                <FiMessageSquare />
                                            </button>
                                            {/* Arkadaştan çıkar */}
                                            <button
                                                onClick={() => handleRemoveFriend(friend._id)}
                                                disabled={removingFriend}
                                                className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
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
                                    Incoming Requests ({incomingFriendRequests.length})
                                </h3>

                                {loadingIncoming ? (
                                    <div className="flex justify-center py-8">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </div>
                                ) : incomingFriendRequests.length === 0 ? (
                                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                        No incoming requests
                                    </div>
                                ) : (
                                    // request.senderId → populate edilmiş, tam kullanıcı objesi
                                    incomingFriendRequests.map((request) => (
                                        <div
                                            key={request._id}
                                            className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <img
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
                                                    className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
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
                                    Outgoing Requests ({sentFriendRequests.length})
                                </h3>

                                {loadingOutgoing ? (
                                    <div className="flex justify-center py-8">
                                        <span className="loading loading-spinner loading-md"></span>
                                    </div>
                                ) : sentFriendRequests.length === 0 ? (
                                    <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
                                        No outgoing requests
                                    </div>
                                ) : (
                                    // request.receiverId → populate edilmiş, tam kullanıcı objesi
                                    sentFriendRequests.map((request) => (
                                        <div
                                            key={request._id}
                                            className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                        >
                                            <img
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