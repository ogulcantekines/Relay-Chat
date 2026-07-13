import { useState } from "react";
import { FaArrowLeft, FaUserPlus, FaSearch, FaComment } from "react-icons/fa";
import useSearchUsers from "../../../hooks/friends/useSearchUsers";
import useSendFriendRequest from "../../../hooks/friends/useSendFriendRequest";
import useConversation from "../../../zustand/useConversation";

// AddFriend Bileşeni - Arkadaş ekleme ve mesaj gönderme sayfası
// Sidebar'daki "Arkadaş ekle" butonuna basıldığında gösterilir.
// Kullanıcı adı veya friend code ile arama yapar.
// Bulunan kullanıcılara arkadaşlık isteği gönderebilir veya direkt mesaj atabilir.
//
// Props:
// - onBack: Ana sidebar'a dönmek için çağrılan fonksiyon

const AddFriend = ({ onBack }) => {
    const [searchQuery, setSearchQuery] = useState("");

    // Hook'lar
    const { users, loading: searchLoading } = useSearchUsers(searchQuery); // Debounce ile arama
    const { sendFriendRequest, loading: sendLoading } = useSendFriendRequest(); // Arkadaşlık isteği gönder
    const { conversations, setSelectedConversation } = useConversation();

    // Arkadaşlık isteği gönder
    const handleSendRequest = async (userId) => {
        const success = await sendFriendRequest(userId);
        if (success) {
            setSearchQuery(""); // Başarılı olunca arama temizle
        }
    };

    // Mesaj gönderme → Draft Conversation mantığı
    // Bu fonksiyon "Mesaj Gönder" butonuna basıldığında çalışır
    // Conversation'ı sidebar'a EKLEMEZ, sadece seçer. Asıl ekleme useSendMessage'da olur.
    const handleSendMessage = (user) => {
        // 1. Bu kişiyle zaten bir konuşmamız var mı kontrol et
        // conversations dizisinde bu kullanıcının ID'siyle eşleşen bir konuşma ara
        const existingConv = conversations.find(c => c._id === user._id);

        if (existingConv) {
            // Eğer varsa, mevcut conversation'ı seç (tekrar oluşturma)
            setSelectedConversation(existingConv);
        } else {
            // Yoksa, sadece kullanıcı bilgilerini "selectedConversation" olarak ayarla
            // Bu bir "taslak" (draft) conversation → henüz DB'de yok
            // Mesaj gönderildiğinde useSendMessage hook'u:
            //   1. Backend'e mesajı gönderir → Backend conversation'ı otomatik oluşturur
            //   2. Return edilen data ile sidebar'a yeni conversation ekler
            setSelectedConversation({
                _id: user._id,            // Kullanıcı ID'si (conversation ID olarak kullanılır)
                fullName: user.fullName,
                profilePic: user.profilePic,
                username: user.username,
            });
        }

        // Son olarak bu "Arkadaş Ekle" sayfasını kapatıp ana ekrana dönelim
        onBack();
    };

    return (
        <div className="h-full flex flex-col">
            {/* ═══════════ HEADER ═══════════ */}
            <div className="p-4 bg-[color:var(--bg-panel)] border-b border-[color:var(--border-subtle)]">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBack} // onclick = {() => {onBack()}} olarakta yazılabilir
                        className="btn btn-sm btn-circle btn-ghost text-[color:var(--text-muted)] hover:text-white hover:bg-[color:var(--bg-elevated)]"
                        title="Geri"
                    >
                        <FaArrowLeft className="text-lg" />
                    </button>
                    <h2 className="text-lg font-bold text-white">Arkadaş Ekle</h2>
                </div>
            </div>

            {/* ═══════════ ARAMA INPUT ═══════════ */}
            <div className="px-4 pt-5 pb-3">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Kullanıcı adı veya arkadaş kodu..."
                        className="input input-bordered rounded-full w-full bg-[color:var(--bg-panel)] text-white border-[color:var(--border-subtle)] focus:border-[color:var(--accent)] pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--text-muted)]" />
                </div>
                {/* Minimum karakter uyarısı */}
                {searchQuery.length > 0 && searchQuery.length < 2 && (
                    <p className="text-xs text-[color:var(--text-muted)] mt-2 ml-4">En az 2 karakter girin</p>
                )}
            </div>

            {/* ═══════════ SONUÇ LİSTESİ ═══════════ */}
            <div className="flex-1 overflow-y-auto px-2">
                {/* Loading durumu */}
                {searchLoading && (
                    <div className="flex justify-center py-8">
                        <span className="loading loading-spinner text-sky-500"></span>
                    </div>
                )}

                {/* Boş durum: Henüz arama yapılmadı */}
                {!searchLoading && searchQuery.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="w-16 h-16 bg-[color:var(--bg-panel)] rounded-full flex items-center justify-center mb-4">
                            <FaUserPlus className="text-3xl text-gray-600" />
                        </div>
                        <h3 className="text-white font-semibold mb-2">Arkadaş ara</h3>
                        <p className="text-sm text-[color:var(--text-muted)]">
                            Search for friends by username or friend code
                        </p>
                    </div>
                )}

                {/* Sonuç yok durumu */}
                {!searchLoading && searchQuery.length >= 2 && users.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                        <div className="text-5xl mb-4">🔍</div>
                        <h3 className="text-white font-semibold mb-2">Kullanıcı bulunamadı</h3>
                        <p className="text-sm text-[color:var(--text-muted)]">
                            User Not Found
                        </p>
                    </div>
                )}

                {/* Kullanıcı kartları listesi */}
                {users.length > 0 && (
                    <div className="space-y-1">
                        {users.map((user) => (
                            <div
                                key={user._id}
                                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[color:var(--bg-panel)] transition-colors cursor-pointer"
                            >
                                {/* Avatar */}
                                <div className="avatar">
                                    <div className="w-12 rounded-full">
                                        <img src={user.profilePic} alt={user.username} />
                                    </div>
                                </div>

                                {/* Kullanıcı Bilgisi */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white truncate">
                                        {user.username}
                                    </p>
                                    <p className="text-sm text-[color:var(--text-muted)]">
                                        #{user.friendCode}
                                    </p>
                                </div>

                                {/* Mesaj Gönder Butonu → handleSendMessage (draft conversation oluşturur) */}
                                <button
                                    onClick={() => handleSendMessage(user)}
                                    className="btn btn-sm bg-green-500 hover:bg-green-600 border-none text-white gap-1"
                                    title="Mesaj gönder"
                                >
                                    <FaComment className="text-sm" />
                                </button>

                                {/* Arkadaş Ekle Butonu → handleSendRequest (FriendRequest oluşturur) */}
                                <button
                                    onClick={() => handleSendRequest(user._id)}
                                    disabled={sendLoading}
                                    className="btn btn-sm bg-[color:var(--accent)] hover:bg-[color:var(--accent-hover)] border-none text-white gap-1"
                                >
                                    {sendLoading ? (
                                        <span className="loading loading-spinner loading-xs"></span>
                                    ) : (
                                        <>
                                            <FaUserPlus className="text-sm" />
                                            Ekle
                                        </>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddFriend;