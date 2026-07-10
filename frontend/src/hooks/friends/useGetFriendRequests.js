import { useEffect, useState } from "react";
import useFriendStore from "../../zustand/useFriend";

// useGetFriendRequests - Sana gelen arkadaşlık isteklerini backend'den çeken hook
// Sidebar yüklendiğinde çalışır, gelen istekleri useFriendStore'a yazar.
// Friends.jsx'teki "Pending > Incoming" sekmesinde gösterilir.

const useGetFriendRequests = () => {

    const { incomingFriendRequests, setIncomingFriendRequests } = useFriendStore();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getFriendRequests = async () => {
            setLoading(true);
            try {
                // Backend'e GET isteği → /api/friends/requests
                // Backend'de getFriendRequests controller'ı çalışır:
                // FriendRequest.find({ receiverId: req.user._id, status: "pending" }).populate("senderId")
                // populate sayesinde senderId yerine tam kullanıcı objesi gelir (fullName, profilePic vb.)
                const res = await fetch("/api/friends/requests", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    }
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error("Failed to fetch friend requests");
                }

                // Backend { friendRequests: [{_id, senderId: {fullName, profilePic...}, status}] } döner
                setIncomingFriendRequests(data.friendRequests || []);
            } catch (error) {
                console.error("Error fetching friend requests:", error.message);
            } finally {
                setLoading(false);
            }
        };

        getFriendRequests();
    }, [setIncomingFriendRequests]);

    return { incomingFriendRequests, loading };
};

export default useGetFriendRequests;
