import { useEffect } from "react";
import toast from "react-hot-toast";
import useSocket from "../../zustand/useSocket";
import useFriendStore from "../../zustand/useFriend";

// Arkadaşlık olayları için gerçek zamanlı dinleyici.
//
// Backend bu üç olayı gönderiyordu ama hiçbir yerde dinlenmiyordu; bu yüzden
// gelen istek, kabul ve red bilgileri ancak sayfa yenilenince görünüyordu.
// Burada tek yerde dinlenip store güncelleniyor, böylece arayüz anında tepki verir.
const useListenFriendEvents = () => {
    const { socket } = useSocket();
    const {
        addIncomingFriendRequest,
        removeSentFriendRequest,
        addFriend
    } = useFriendStore();

    useEffect(() => {
        if (!socket) return;

        // Biri sana arkadaşlık isteği gönderdi
        const onNewRequest = ({ sender, friendRequest }) => {
            // Store, populate edilmiş senderId bekliyor (gelen kutusu böyle render ediliyor)
            addIncomingFriendRequest({ ...friendRequest, senderId: sender });
            toast.success(`${sender?.fullName || "Birisi"} sana arkadaşlık isteği gönderdi`);
        };

        // Gönderdiğin istek kabul edildi
        const onAccepted = ({ friendRequest, acceptedByUser }) => {
            removeSentFriendRequest(friendRequest._id);
            if (acceptedByUser) addFriend(acceptedByUser);
            toast.success(`${acceptedByUser?.fullName || "Kullanıcı"} arkadaşlık isteğini kabul etti`);
        };

        // Gönderdiğin istek reddedildi
        const onRejected = ({ friendRequest, rejectedByUser }) => {
            removeSentFriendRequest(friendRequest._id);
            toast(`${rejectedByUser?.fullName || "Kullanıcı"} arkadaşlık isteğini reddetti`);
        };

        socket.on("newFriendRequest", onNewRequest);
        socket.on("friendRequestResponse", onAccepted);
        socket.on("friendRequestRejected", onRejected);

        return () => {
            socket.off("newFriendRequest", onNewRequest);
            socket.off("friendRequestResponse", onAccepted);
            socket.off("friendRequestRejected", onRejected);
        };
    }, [socket, addIncomingFriendRequest, removeSentFriendRequest, addFriend]);
};

export default useListenFriendEvents;
