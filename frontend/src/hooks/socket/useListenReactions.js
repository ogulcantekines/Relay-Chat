import { useEffect } from "react";
import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";

// Karşı taraf bir mesaja tepki verdiğinde açık sohbeti anında güncelle.
const useListenReactions = () => {
    const { socket } = useSocket();
    const { setMessages } = useConversation();

    useEffect(() => {
        if (!socket) return;

        const onReaction = ({ messageId, reactions }) => {
            setMessages(messages => messages.map(msg =>
                msg._id === messageId ? { ...msg, reactions } : msg
            ));
        };

        socket.on("messageReaction", onReaction);
        return () => socket.off("messageReaction", onReaction);

    }, [socket, setMessages]);
};

export default useListenReactions;
