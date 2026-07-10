import { useState, useEffect } from "react";
import useFriendStore from "../../zustand/useFriend";

// useGetFriends - Arkadaş listesini backend'den çeken hook
// Sidebar yüklendiğinde otomatik çalışır ve useFriendStore'a arkadaş listesini yazar.
// Bu sayede tüm componentler (Friends.jsx, MessageContainer.jsx vb.) aynı arkadaş verisine erişir.

const useGetFriends = () => {
    const { friends, setFriends } = useFriendStore(); // Zustand store'dan friends state'i ve setter'ı al
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getFriends = async () => {
            setLoading(true);
            try {
                // Backend'e GET isteği at → /api/friends/list
                // protectRoute middleware'i sayesinde JWT token cookie'den otomatik gönderilir
                const res = await fetch(`/api/friends/list`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const data = await res.json(); // Backend'den gelen JSON'ı JS objesine çevir

                if (!res.ok || data.message) {
                    throw new Error(data.message || "Failed to fetch friends");
                }

                // Backend { friends: [{_id, fullName, profilePic, username}, ...] } formatında döner
                // Bu veriyi global state'e (Zustand) yaz, tüm componentler erişebilsin
                setFriends(data.friends || []);
            } catch (error) {
                console.error("Error fetching friends:", error.message);
            } finally {
                setLoading(false); // Başarılı veya başarısız, loading'i kapat
            }
        };

        getFriends();
    }, [setFriends]); // setFriends dependency'si → Zustand setter'ı değişmez ama ESLint kuralı için gerekli

    return { friends, loading }; // Component'e hem listeyi hem loading durumunu döndür
};

export default useGetFriends;