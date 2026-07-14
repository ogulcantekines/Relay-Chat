import useFriendStore from "../../zustand/useFriend";
import useConversation from "../../zustand/useConversation";

// Requests Bileşeni - Sidebar'daki "Requests" sekmesinin içeriği
// Arkadaş olmayan birinden gelen mesaj isteklerini gösterir.
// Bu veriler useGetMessageRequests hook'u tarafından çekilir ve useFriendStore'da tutulur.
// Bir isteğe tıklandığında, o conversation seçilir ve MessageContainer'da mesajlar + banner görünür.

const Requests = () => {
    // Zustand'dan oku (Sidebar mount olduğunda useGetMessageRequests çalışıp bu veriyi doldurur)
    const { messageRequests } = useFriendStore();
    const { setSelectedConversation } = useConversation();

    // İsteğe tıklandığında çalışır: o kişinin conversation'ını seç
    const handleViewMessage = (request) => {
        // request objesi zaten kişi bilgilerini içerir (fullName, profilePic, _id vb.)
        // status: "pending" ekleyerek MessageContainer'ın bunu bir "mesaj isteği" olarak göstermesini sağlıyoruz
        // _id her zaman Kişi ID'si olmalı ki online/typing gibi socket olayları doğru çalışsın
        setSelectedConversation({
            ...request,     // spread ile tüm kişi bilgilerini kopyala
            status: "pending"  // pending status'u ekliyoruz → MessageContainer'da "Accept/Delete" banner'ı gösterilir
        });
    };

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            {/* Boş durum: Hiç mesaj isteği yoksa bilgilendirici mesaj göster */}
            {messageRequests.length === 0 ? (
                <div className="p-8 text-center text-[color:var(--text-muted)]">
                    <p className="text-lg mb-2">Bekleyen mesaj isteği yok</p>
                    <p className="text-sm">
                        Arkadaşın olmayan kişilerden gelen mesaj istekleri <br />
                        will appear here
                    </p>
                </div>
            ) : (
                <div className="px-2 space-y-4">

                    {/* Mesaj İstekleri Listesi */}
                    {messageRequests.length > 0 && (
                        <div>
                            <h3 className="text-sm font-semibold text-[color:var(--text-muted)] px-3 py-2">
                                Message Requests ({messageRequests.length})
                            </h3>
                            <div className="space-y-2">
                                {/* Her bir mesaj isteği için kart render et */}
                                {messageRequests.map((request) => (
                                    <div
                                        key={request._id}
                                        onClick={() => handleViewMessage(request)}
                                        className="flex items-center gap-3 p-3 bg-[color:var(--bg-panel)] hover:bg-[color:var(--bg-elevated)] rounded-lg cursor-pointer transition-colors border border-transparent hover:border-[color:var(--accent)]/30"
                                    >
                                        {/* Avatar */}
                                        <div className="avatar">
                                            <div className="w-12 rounded-full border border-[color:var(--border-subtle)]">
                                                <img
                                                    src={request.profilePic}
                                                    alt={request.username}
                                                />
                                            </div>
                                        </div>

                                        {/* Kullanıcı Bilgisi */}
                                        <div className="flex-1">
                                            <p className="font-semibold text-white">
                                                {request.fullName}
                                            </p>
                                            <p className="text-sm text-[color:var(--text-muted)]">
                                                Wants to send you a message
                                            </p>
                                        </div>

                                        {/* Tıklama göstergesi */}
                                        <div className="text-[color:var(--text-muted)] text-xs">
                                            Click to view
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default Requests;
