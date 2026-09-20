import { refreshConversationStatuses } from '../../utils/refreshConversations';
import apiFetch from '../../utils/apiFetch';
import { useState } from "react";
import toast from "react-hot-toast";
import useFriendStore from "../../zustand/useFriend";

// useRespondToFriendRequests - Gelen arkadaşlık isteğine yanıt verme hook'u
// Friends.jsx'teki "Pending > Incoming" sekmesinde ✅ (kabul) veya ❌ (red) butonlarıyla çalışır.
// İsteği kabul ederse: arkadaş listesine ekler + isteği listeden kaldırır
// İsteği reddederse: sadece isteği listeden kaldırır

const useRespondToFriendRequests = () => {
    const [loading, setLoading] = useState(false);
    const { removeIncomingFriendRequest, addFriend } = useFriendStore();

    // requestId: FriendRequest belgesinin _id'si
    // response: "accept" veya "reject" string'i
    const respondToRequest = async (requestId, response) => {
        setLoading(true);
        try {
            // Backend'e POST isteği → /api/friends/respond
            // respondToFriendRequest controller'ı çalışır:
            // Kabul: her iki kullanıcının friends dizisine birbirini ekler + FriendRequest status'u "accepted" yapar
            // Red: FriendRequest status'u "rejected" yapar
            const res = await apiFetch("/api/friends/respond", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ requestId, response }), // body'de istek ID'si ve yanıt gönderiyoruz
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Arkadaşlık isteği yanıtlanamadı");
            }

            if (response === "accept") {
                // Kabul edildi → Zustand store'dan isteği kaldır + yeni arkadaşı ekle
                removeIncomingFriendRequest(requestId);
                addFriend(data.friend);
                refreshConversationStatuses(); // Backend kabul edilen arkadaşın bilgilerini döner
            } else {
                // Red edildi → Sadece isteği listeden kaldır
                removeIncomingFriendRequest(requestId);
            }

            toast.success(response === "accept" ? "Arkadaşlık isteği kabul edildi" : "Arkadaşlık isteği reddedildi"); // "Friend request accept" veya "Friend request reject"
        } catch (error) {
            console.error("Error responding to friend request:", error.message);
            if (error.name !== "AbortError") toast.error("Arkadaşlık isteği yanıtlanamadı");
        } finally {
            setLoading(false);
        }
    };

    return { respondToRequest, loading };
};

export default useRespondToFriendRequests;
