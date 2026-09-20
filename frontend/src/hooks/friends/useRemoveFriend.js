import apiFetch from '../../utils/apiFetch';
import { useState } from "react";
import toast from "react-hot-toast";
import useFriendStore from "../../zustand/useFriend";

// useRemoveFriend - Arkadaş listesinden birini çıkarma hook'u
// Friends.jsx'teki "All" sekmesinde 🗑️ (çıkar) butonuyla çalışır.
// Backend'de her iki kullanıcının friends dizisinden birbirlerini çıkarır.
// ⚠️ Not: Conversation'ın durumu (active/pending) değişmez, sadece arkadaşlık ilişkisi silinir.

const useRemoveFriend = () => {
    const [loading, setLoading] = useState(false);
    const { removeFriend } = useFriendStore(); // Zustand'dan arkadaş kaldırma fonksiyonu

    const handleRemoveFriend = async (friendId) => {

        setLoading(true);

        try {
            // Backend'e DELETE isteği → /api/friends/remove/:friendId
            // removeFriend controller'ı çalışır:
            // 1. User.findById ile her iki kullanıcıyı bulur
            // 2. $pull operatörü ile her iki kullanıcının friends dizisinden birbirinin ID'sini çıkarır
            // 3. Her iki kullanıcıyı kaydeder
            const res = await apiFetch(`/api/friends/remove/${friendId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                }
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Arkadaş listeden çıkarılamadı");
            }

            // Zustand store'dan arkadaşı kaldır → UI anında güncellenir
            removeFriend(friendId);
            toast.success(data.message);

        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);

        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        handleRemoveFriend,
    };
};

export default useRemoveFriend;
