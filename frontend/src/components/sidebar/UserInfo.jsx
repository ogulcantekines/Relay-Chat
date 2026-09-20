import Avatar from '../Avatar';
import { useState, useRef, useEffect } from "react";
import { FaUserPlus, FaBell, FaUserFriends } from "react-icons/fa";
import { IoSettingsOutline } from "react-icons/io5";
import SettingsModal from "../modals/SettingsModal";
import { BiMessageSquareDetail } from "react-icons/bi";
import useAuth from "../../zustand/useAuth";
import useFriendStore from "../../zustand/useFriend";

// burası zaman algısı kısmı
const formatTimestamp = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInMs = now - date;
    const diffInMinutes = Math.floor(diffInMs / 60000);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return "az önce";
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    if (diffInHours < 24) return `${diffInHours} sa önce`;
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    return date.toLocaleDateString("tr-TR");
};

const UserInfo = ({ onAddFriendClick, onNotificationClick }) => { // onAddFriendClick ve onNotificationClick propsları Sidebar.jsx dosyasından gelir constr
    // destructure ile alınır

    const authUser = useAuth((state) => state.authUser);
    const { incomingFriendRequests, messageRequests } = useFriendStore();
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const dropdownRef = useRef(null);

    const totalNotifications = incomingFriendRequests.length + messageRequests.length;

    // useEffect ilk mount olunca ve dependincy array değişince çalışır
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false); 
            }
        };

        const handleEscape = event => { if (event.key === "Escape") setIsDropdownOpen(false); };
        if (isDropdownOpen) {
            document.addEventListener("keydown", handleEscape);
            document.addEventListener("mousedown", handleClickOutside);//yönetici,çalıştıran fonksiyonu aracı gibi düşün
        }//yönetici,çalıştıran fonksiyonu aracı gibi düşün
        //yani handleClickOutside yazılırsa tanımlanmış o fonksiyonu çağır anlamına gelir
        //aracı bir fonksiyon ile çağrılır. burada o fonksyion tarayıcıdır.
        /*
        const vergiEkle = (miktar, oran) => { 
            return miktar * oran; 
        };
        function yonetici(fonk) {
            const a = 100;
            const b = 1.18;
            fonk(a, b); // Yönetici her zaman 2 tane şey yolluyor.
        }
        yonetici(vergiEkle); 
        // a (100) -> miktar'a denk gelir.
        // b (1.18) -> oran'a denk gelir.

        bu örnekteki gibi yonetici ara fonksiyondur ve kendisi degerler ekleyerek çağrılan
        fonksiyonu döndürür ve onu çağırmış oluruz

        (e)=>{handleCLickOutside(e)}  şeklindede çağrılabilir ama burada yönetici
        fonksiyon dıştaki adsız fonksiyonun içine event koyar. bu sefer kendisine koymaz.
        bu eventi hedef fonksiyona koyar ve return ederek çalıştırır

        */

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [isDropdownOpen]);

    const handleNotificationClick = (destination) => {
        setIsDropdownOpen(false);
        if (onNotificationClick) {
            onNotificationClick(destination);
        }
    };
  

    return (
        <div className="relative p-4 bg-[color:var(--bg-panel)] border-b border-[color:var(--border-subtle)]">
            <div className="flex items-center justify-between">

                {/* sol: Kullanıcı Bilgisi */}
                <div className="flex items-center gap-3 min-w-0">
                    <Avatar name={authUser?.fullName} src={authUser?.profilePic} alt="" className="w-11 h-11 avatar-ring flex-shrink-0" />
                    <div className="min-w-0">
                        {/* Görünen ad birincil: ayarlardan değiştirilebilen budur.
                            Kullanıcı adı ve arkadaş kodu altında ikincil olarak durur. */}
                        <p className="font-semibold text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                            {authUser?.fullName}
                        </p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                            @{authUser?.username} · #{authUser?.friendCode}
                        </p>
                    </div>
                </div>

                {/* Sağ: Butonlar */}
                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {/* Arkadaş Ekle */}
                    <button
                        onClick={onAddFriendClick} // Tıklayınca Sidebar'daki setView("addFriend") fonksiyonunu çağır
                        className="w-9 h-9 rounded-xl flex items-center justify-center btn-primary-grad btn-icon-only"
                        title="Arkadaş ekle"
                    >
                        <FaUserPlus size={16} />
                    </button>

                    {/* Hesap ayarları */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="w-9 h-9 icon-btn"
                        title="Hesap ayarları"
                    >
                        <IoSettingsOutline />
                    </button>

                    {/* Bildirimler */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="w-9 h-9 icon-btn relative"
                            title="Bildirimler"
                            aria-expanded={isDropdownOpen}
                            onKeyDown={event => { if (event.key === "Escape") setIsDropdownOpen(false); }}
                        >
                            <FaBell />
                            {totalNotifications > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center animate-badge">
                                    {totalNotifications}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Menu */}
                        {isDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-[min(21rem,calc(100vw-2rem))] bg-[color:var(--bg-panel)] rounded-lg shadow-lg border border-[color:var(--border-subtle)] z-50">
                                {/* Header */}
                                <div className="p-3 border-b border-[color:var(--border-subtle)]">
                                    <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                        Bildirimler ({totalNotifications})
                                    </h3>
                                </div>

                                {/* Content */}
                                <div className="max-h-96 overflow-y-auto">
                                    {totalNotifications === 0 ? (
                                        <div className="p-4 text-center text-[color:var(--text-muted)]">
                                            Yeni bildirim yok
                                        </div>
                                    ) : (
                                        <>
                                            {/* Individual Friend Requests */}
                                            {incomingFriendRequests.map((request) => (
                                                <button
                                                    key={request._id}
                                                    onClick={() => handleNotificationClick("friends")}
                                                    className="w-full p-3 hover:bg-[color:var(--bg-hover)] transition-colors text-left border-b border-[color:var(--border-subtle)]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-[color:var(--accent)] rounded-full">
                                                            <FaUserFriends className="text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-medium">
                                                                {request.senderId?.username} #{request.senderId?.friendCode}
                                                            </p>
                                                            <p className="text-sm text-[color:var(--text-muted)]">
                                                                sent you a friend request
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-[color:var(--text-muted)] flex-shrink-0">
                                                            {formatTimestamp(request.createdAt)}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}

                                            {/* Individual Message Requests */}
                                            {messageRequests.map((request) => (
                                                <button
                                                    key={request._id}
                                                    onClick={() => handleNotificationClick("requests")}
                                                    className="w-full p-3 hover:bg-[color:var(--bg-hover)] transition-colors text-left border-b border-[color:var(--border-subtle)]"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-green-500 rounded-full">
                                                            <BiMessageSquareDetail className="text-white" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white font-medium">
                                                                {request.senderId?.username} #{request.senderId?.friendCode}
                                                            </p>
                                                            <p className="text-sm text-[color:var(--text-muted)]">
                                                                sent you a message request
                                                            </p>
                                                        </div>
                                                        <span className="text-xs text-[color:var(--text-muted)] flex-shrink-0">
                                                            {formatTimestamp(request.createdAt)}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
        </div>
    );
};

export default UserInfo;


/*
Düşüncen tam olarak doğru: O "Aracı" (Tarayıcının Olay Motoru) sen bilgisayarı açtığından beri, hatta tarayıcıyı başlattığından beri hep orada ve her milisaniye çalışıyor.

İşte o devasa yapıyı şöyle hayal et:

1. "Her Şeyi Dinleyen Dev" (The Browser Engine) 🕵️‍♂️
Tarayıcı, senin yazdığın koda bakmaksızın, her mousedown, her klavye vuruşu, her mouse hareketi için zaten bir "Olay Raporu" (Event Object) oluşturur.

Sen kod yazmasan bile tarayıcı fıstık gibi "Şu an şuraya basıldı" diye kendi içinde rapor tutmaya devam eder.
2. "Abonelik" (The Call List) 📋
Senin addEventListener dediğin şey, aslında tarayıcıdaki koca bir "Beni Ara" (Callback Listesi) tablosuna bir satır eklemektir.

Tarayıcıya diyorsun ki: "Bak, biliyorum sen zaten her mousedown olayını raporluyorsun. Ama bu mousedown olduğunda, zahmet olmazsa şu benim 
handleClickOutside
 fonksiyonumu da bir çaldır."
3. "Dönmek" ve "Çekilmek"
Abonelik Anı: "Beni listeye ekle."
Olay Anı: Tarayıcı zaten ürettiği o paketi (event), listedeki herkese (sana ve diğer tüm abonelere) sırayla fırlatır.
Temizlik Anı (removeEventListener): "Beni listeden sil."


*/