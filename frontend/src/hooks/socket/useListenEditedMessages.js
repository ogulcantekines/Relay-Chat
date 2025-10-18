import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";

const useListenEditedMessages = () => {
    const { socket } = useSocket();
    const { messages, setMessages } = useConversation();

    useEffect(() => {
        if (!socket) return;

        socket.on("messageEdited", (editedMessage) => {
            const { messageId, newMessage, isEdited, editedAt } = editedMessage;
            setMessages(messages.map(msg => 
                msg._id === messageId
                    ? { ...msg, message: newMessage, isEdited, editedAt }
                    : msg
            ));
        });

        return () => socket.off("messageEdited");
        
    }, [socket, messages, setMessages]);
};

export default useListenEditedMessages;
