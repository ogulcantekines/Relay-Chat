import { useEffect, useState } from "react";
import useFriendStore from "../../zustand/useFriend";

// useGetSentRequests - Senin gönderdiğin arkadaşlık isteklerini backend'den çeken hook
// Sidebar yüklendiğinde çalışır, gönderilen istekleri useFriendStore'a yazar.
// Friends.jsx'teki "Pending > Outgoing" sekmesinde gösterilir.

const useGetSentRequests = () => {
    const { sentFriendRequests, setSentFriendRequests } = useFriendStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        const getSentRequests = async () => {

            setLoading(true);
            try {
                // Backend'e GET isteği → /api/friends/sentRequests
                // Backend'de getSentFriendRequests controller'ı çalışır:
                // FriendRequest.find({ senderId: req.user._id, status: "pending" }).populate("receiverId")
                // populate ile receiverId'nin tam kullanıcı bilgileri gelir
                const res = await fetch("/api/friends/sentRequests", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error("Failed to fetch sent friend requests");
                }

                // Backend { sentRequests: [{_id, receiverId: {fullName, profilePic...}, status}] } döner
                setSentFriendRequests(data.sentRequests || []);
            } catch (error) {
                console.error("Error fetching sent friend requests:", error.message);
            } finally {
                setLoading(false);
            }
        };

        getSentRequests();
    }, [setSentFriendRequests]);

    return { sentFriendRequests, loading };
};

export default useGetSentRequests;
