import apiFetch from '../../utils/apiFetch';
import { useState } from "react";
import toast from "react-hot-toast";
import useFriendStore from "../../zustand/useFriend";

// useCancelRequest - Gönderdiğin arkadaşlık isteğini iptal etme hook'u
// Friends.jsx'teki "Pending > Outgoing" sekmesinde "Cancel" butonuyla çalışır.
// Backend'deki FriendRequest belgesini siler ve Zustand store'dan kaldırır.

const useCancelRequest = () => {
    const [loading, setLoading] = useState(false);
    const { removeSentFriendRequest } = useFriendStore(); // Zustand'dan sent request kaldırma fonksiyonu

    const cancelRequest = async (requestId) => {
        setLoading(true);
        try {
            // Backend'e DELETE isteği → /api/friends/cancel/:requestId
            // cancelFriendRequest controller'ı çalışır:
            // FriendRequest.findByIdAndDelete(requestId) ile belgeyi tamamen siler
            const res = await apiFetch(`/api/friends/cancel/${requestId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to cancel friend request");
            }

            // Zustand store'dan gönderilen istekler listesinden kaldır
            // Bu sayede UI anında güncellenir (sayfa yenilemeden)
            removeSentFriendRequest(requestId);
            toast.success("Friend request cancelled");
        } catch (error) {
            console.error("Error cancelling friend request:", error.message);
            toast.error("Failed to cancel friend request");
        } finally {
            setLoading(false);
        }
    };

    return { cancelRequest, loading };
};

export default useCancelRequest;