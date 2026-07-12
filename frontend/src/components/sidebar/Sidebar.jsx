import Conversations from './Conversations';
import LogoutButton from './LogoutButton';
import useSocket from '../../zustand/useSocket';
import UserInfo from './UserInfo';
import { useState } from 'react';
import Friends from './views/Friends';
import Requests from './Requests';
import { FaUserFriends } from 'react-icons/fa';
import { IoSearch } from 'react-icons/io5';
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
    const [filter, setFilter] = useState(""); // Sohbet listesi filtresi

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
        <div className='h-full flex flex-col' style={{ background: 'var(--bg-panel)' }}>

            {/* Kullanıcı bilgileri + Arkadaş ekle butonu + Bildirim dropdown */}
            <UserInfo
                onAddFriendClick={() => setView("addFriend")}
                onNotificationClick={handleNotificationClick}
            />

            {/* Sohbet filtreleme kutusu */}
            <div className='px-3 pt-2 pb-1'>
                <div className='relative'>
                    <IoSearch
                        className='field-icon-glyph'
                    />
                    <input
                        type='text'
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder='Sohbetlerde ara...'
                        className='field field-icon text-sm'
                    />
                </div>
            </div>

            {/* ═══════════ SEKMELER ═══════════ */}
            <div className='flex items-center gap-1 px-3 pt-1' style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                <button
                    onClick={() => setActiveTab("conversations")}
                    className='relative py-2.5 px-3 text-sm font-medium transition-colors'
                    style={{ color: activeTab === "conversations" ? 'var(--accent-hover)' : 'var(--text-secondary)' }}
                >
                    Sohbetler
                    {activeTab === "conversations" && (
                        <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full' style={{ background: 'var(--accent)' }} />
                    )}
                </button>

                <button
                    onClick={() => setActiveTab("requests")}
                    className='relative py-2.5 px-3 text-sm font-medium transition-colors flex items-center gap-1.5'
                    style={{ color: activeTab === "requests" ? 'var(--accent-hover)' : 'var(--text-secondary)' }}
                >
                    İstekler
                    {messageRequests.length > 0 && (
                        <span
                            className='min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-semibold flex items-center justify-center'
                            style={{ background: 'var(--accent)', color: '#fff' }}
                        >
                            {messageRequests.length}
                        </span>
                    )}
                    {activeTab === "requests" && (
                        <span className='absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full' style={{ background: 'var(--accent)' }} />
                    )}
                </button>

                <button
                    onClick={() => setView("friends")}
                    className='ml-auto mb-1 w-8 h-8 rounded-lg flex items-center justify-center transition-colors'
                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
                    title='Arkadaşlar'
                >
                    <FaUserFriends />
                </button>
            </div>

            {/* Çevrimiçi arkadaş sayısı */}
            <div className='flex items-center gap-2 px-4 py-1.5 text-xs' style={{ color: 'var(--text-muted)' }}>
                <span className='w-1.5 h-1.5 rounded-full' style={{ background: 'var(--online)' }} />
                <span>{onlineFriends.length} kişi çevrimiçi</span>
            </div>

            {/* ═══════════ SEKME İÇERİĞİ ═══════════ */}
            {/* hidden ile gizlenir: bileşen unmount olmadığı için state korunur */}
            <div className='flex-1 overflow-hidden'>
                <div className={activeTab === "conversations" ? "h-full overflow-hidden flex flex-col" : "hidden"}>
                    <Conversations filter={filter} />
                </div>
                <div className={activeTab === "requests" ? "h-full overflow-y-auto scroll-slim" : "hidden"}>
                    <Requests />
                </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)' }}>
                <LogoutButton />
            </div>
        </div>
    );
}
export default Sidebar;
