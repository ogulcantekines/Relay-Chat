import SearchInput from './SearchInput';
import Conversations from './Conversations';
import LogoutButton from './LogoutButton';
import useSocket from '../../zustand/useSocket';
import UserInfo from './UserInfo';
import { useState } from 'react';
import Friends from './views/Friends';
import Requests from './Requests';
import { FaUserFriends } from 'react-icons/fa';
import useFriendStore from '../../zustand/useFriend';
import useGetMessageRequests from '../../hooks/friends/useGetMessageRequests';
import AddFriend from './views/AddFriend';
import useGetFriendRequests from '../../hooks/friends/useGetFriendRequests';
import useGetFriends from '../../hooks/friends/useGetFriends';
import useGetSentRequests from '../../hooks/friends/useGetSentRequests';

// Sidebar Bileşeni - Uygulamanın sol paneli
// Bu bileşen arkadaşlık sistemi ile doğrudan entegre çalışır:
// 1. Tüm arkadaşlık verilerini çeker (mount olduğunda)
// 2. Online arkadaş sayısını hesaplayıp gösterir
// 3. Farklı view'lar arasında geçiş yapar (main, addFriend, friends)
// 4. "Chats" ve "Requests" sekmeleri arasında geçiş sağlar

// 📌 View Yapısı:
// view === "main"      → Ana sidebar (sekmeler + sohbet listesi)
// view === "addFriend"  → AddFriend bileşeni (kullanıcı arama + ekleme)
// view === "friends"    → Friends bileşeni (arkadaş listesi + pending istekler)

const Sidebar = () => {

    const { onlineUsers } = useSocket(); // socket.on("getOnlineUsers") ile gelen ID dizisi
    const [activeTab, setActiveTab] = useState("conversations"); // "conversations" veya "requests"
    const [view, setView] = useState("main"); // Aktif görünüm: "main", "addFriend", "friends"
    const [friendsInitialTab, setFriendsInitialTab] = useState("all"); // Friends sayfası açılınca hangi sekme?

    const friends = useFriendStore((state) => state.friends);
    const onlineFriends = friends.filter(user => onlineUsers.includes(user._id));

    // ═══════════ ARKADAŞLIK VERİLERİNİ ÇEKME ═══════════
    // Bu 4 hook Sidebar mount olduğunda çalışır ve tüm arkadaşlık verilerini global state'e yazar
    // Böylece alt bileşenler (Friends.jsx, Requests.jsx, MessageContainer.jsx) veriyi Zustand'dan okur
    useGetMessageRequests();   // Mesaj istekleri → useFriendStore.messageRequests
    useGetFriendRequests();    // Gelen arkadaşlık istekleri → useFriendStore.incomingFriendRequests
    useGetFriends();           // Arkadaş listesi → useFriendStore.friends
    useGetSentRequests();      // Gönderilen arkadaşlık istekleri → useFriendStore.sentFriendRequests

    const { messageRequests } = useFriendStore();

    // ═══════════ BİLDİRİM YÖNLENDİRME ═══════════
    // UserInfo component'indeki bildirim dropdown'ından tıklama geldiğinde
    // doğru sekmeye/view'a yönlendirir
    const handleNotificationClick = (destination) => {

        if (destination === "friends") {
            // Friends view'ı "pending" tab'de aç (gelen istekleri göster)
            setFriendsInitialTab("pending");
            setView("friends");

        } else if (destination === "requests") {
            // Requests tab'ine geç (mesaj istekleri)
            setActiveTab("requests");
        }
    };

    // ═══════════ VIEW ROUTING ═══════════
    // view state'ine göre hangi bileşeni gösterecek belirle
    if (view === "addFriend") {
        return <AddFriend onBack={() => setView("main")} />;
    }
    else if (view === "friends") {
        return <Friends
            onBack={() => {
                setView("main");              // Ana sidebar'a dön
                setFriendsInitialTab("all");  // Tab'i "all"a reset et (bir sonraki açılışta "all" açılsın)
            }}
            initialTab={friendsInitialTab}    // Hangi tab açılacağını Friends'e söyle
        />;

    }

    // ═══════════ ANA SIDEBAR GÖRÜNÜMÜ ═══════════
    return (
        <div className="h-full flex flex-col">

            {/* Kullanıcı bilgileri + Arkadaş ekle butonu + Bildirim dropdown */}
            <UserInfo
                onAddFriendClick={() => setView("addFriend")}
                onNotificationClick={handleNotificationClick}
            />
            <SearchInput /> {/* Sohbet arama çubuğu */}

            {/* Online arkadaş sayısı göstergesi */}
            <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{onlineFriends.length} online</span>
                </div>
            </div>

            {/* ═══════════ SEKMELER ═══════════ */}
            <div className="px-4 mb-2">
                <div className="flex items-center gap-3">
                    {/* Sol: Chats ve Requests sekmeleri */}
                    <div className="inline-flex gap-4 border-b border-gray-700">
                        <button
                            onClick={() => setActiveTab("conversations")}
                            className={`py-3 px-2 text-sm font-medium transition-colors duration-200 relative whitespace-nowrap ${activeTab === "conversations"
                                ? "text-sky-400"
                                : "text-white hover:text-gray-400"
                                }`}
                        >
                            Chats
                            {/* Aktif sekme altı çizgi göstergesi */}
                            {activeTab === "conversations" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-t-full" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            className={`py-3 px-2 text-sm font-medium transition-colors duration-200 relative whitespace-nowrap ${activeTab === "requests"
                                ? "text-sky-400"
                                : "text-white hover:text-gray-400"
                                }`}
                        >
                            <span className="flex items-center gap-2">
                                Requests
                                {/* Mesaj istekleri badge'i → bekleyen istek varsa sayıyı göster */}
                                {messageRequests.length > 0 && (
                                    <span className="">({messageRequests.length})</span>
                                )}
                            </span>

                            {activeTab === "requests" && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-t-full" />
                            )}
                        </button>
                    </div>

                    {/* Sağ: Friends ikonu → Friends view'ına geç */}
                    <button
                        onClick={() => setView("friends")}
                        className={`p-2 rounded-lg transition-colors duration-200 ml-auto ${view === "friends"
                            ? "bg-sky-700 text-white"
                            : "bg-sky-500 text-white hover:bg-sky-600"
                            }`}
                        title="Friends"
                    >
                        <FaUserFriends className="text-lg" />
                    </button>
                </div>
            </div>

            {/* ═══════════ SEKME İÇERİĞİ ═══════════ */}
            {/* className ile hidden/göster kontrolü yapılıyor (mount/unmount yerine gizle/göster)
                Bu sayede Conversations bileşeni her sekme değişiminde yeniden mount olmaz, state korunur */}
            <div className="flex-1 overflow-hidden">
                <div className={activeTab === "conversations" ? "h-full" : "hidden"}>
                    <Conversations />
                </div>
                <div className={activeTab === "requests" ? "h-full" : "hidden"}>
                    <Requests />
                </div>
            </div>

            <div className='divider px-3'></div>
            <LogoutButton /> {/* Çıkış butonu */}
        </div>
    );
}
export default Sidebar;