import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";

const useListenEditedMessages = () => {
    const { socket } = useSocket();
    const { setMessages } = useConversation();

    useEffect(() => {
        if (!socket) return;

        socket.on("messageEdited", (editedMessage) => {
            const { messageId, newMessage, isEdited, editedAt } = editedMessage;
            setMessages(messages => messages.map(msg =>
                msg._id === messageId
                    ? { ...msg, message: newMessage, isEdited, editedAt }
                    : msg
            ));
        });

        return () => socket.off("messageEdited");

    }, [socket, setMessages]);
};

export default useListenEditedMessages;
