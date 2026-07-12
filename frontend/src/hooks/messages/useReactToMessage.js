import { useState } from 'react';
import toast from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';

// Mesaja emoji tepkisi. Aynı emojiye tekrar basmak tepkiyi kaldırır (toggle).
const useReactToMessage = () => {
    const [loading, setLoading] = useState(false);
    const { messages, setMessages } = useConversation();

    const react = async (messageId, emoji) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/messages/react/${messageId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emoji }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to react");

            setMessages(messages.map(msg =>
                msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
            ));
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { react, loading };
};

export default useReactToMessage;
