import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";

// Karşı taraf bir mesajını sildiğinde açık sohbeti anında güncelle.
const useListenDeletedMessages = () => {
    const { socket } = useSocket();
    const { setMessages } = useConversation();

    useEffect(() => {
        if (!socket) return;

        socket.on("messageDeleted", ({ messageId }) => {
            setMessages(messages => messages.map(msg =>
                msg._id === messageId
                    ? { ...msg, message: "This message was deleted", isDeleted: true }
                    : msg
            ));
        });

        return () => socket.off("messageDeleted");

    }, [socket, setMessages]);
};

export default useListenDeletedMessages;
