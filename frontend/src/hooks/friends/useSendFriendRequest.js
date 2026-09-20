import useFriendStore from '../../zustand/useFriend';
import apiFetch from '../../utils/apiFetch';
import { useState } from "react";
import toast from "react-hot-toast";

// useSendFriendRequest - Arkadaşlık isteği gönderme hook'u
// AddFriend.jsx'te "Ekle" butonuna basıldığında çalışır.
// Backend'e POST isteği atar ve FriendRequest belgesi oluşturur.
// Başarılı olursa true, başarısız olursa false döner (çağıran yerde kontrol edilebilsin diye).

const useSendFriendRequest = () => {
    const [loading, setLoading] = useState(false);

    const sendFriendRequest = async (userId) => {
        setLoading(true);
        try {
            // Backend'e POST isteği → /api/friends/send/:receiverId
            // sendFriendRequest controller'ı çalışır:
            // 1. Zaten arkadaş mı kontrol eder
            // 2. Zaten bekleyen istek var mı kontrol eder
            // 3. Yoksa yeni FriendRequest belgesi oluşturur (status: "pending")
            // 4. Socket.IO ile karşı tarafa gerçek zamanlı bildirim gönderir
            const res = await apiFetch(`/api/friends/send/${userId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            const data = await res.json();

            // Sadece HTTP status code'a bak, message field'ına bakma (backend başarılı olsa bile message dönüyor)
            if (!res.ok) {
                throw new Error(data.message || "Arkadaşlık isteği gönderilemedi");
            }

            if (data.friendRequest) useFriendStore.getState().addSentFriendRequest(data.friendRequest);
            toast.success("Arkadaşlık isteği gönderildi");
            return true; // Başarılı → çağıran yerde aramayı temizlemek için kullanılır

        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
            return false; // Başarısız

        } finally {
            setLoading(false);
        }
    };

    return { sendFriendRequest, loading };
};

export default useSendFriendRequest;