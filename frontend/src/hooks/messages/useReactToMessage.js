import apiFetch from '../../utils/apiFetch';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useConversation from '../../zustand/useConversation';

// Mesaja emoji tepkisi. Aynı emojiye tekrar basmak tepkiyi kaldırır (toggle).
const useReactToMessage = () => {
    const [loading, setLoading] = useState(false);
    const { setMessages } = useConversation();

    const react = async (messageId, emoji) => {
        if (loading) return false;
        setLoading(true);
        try {
            const res = await apiFetch(`/api/messages/react/${messageId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ emoji }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Tepki eklenemedi");

            setMessages(messages => messages.map(msg =>
                msg._id === messageId ? { ...msg, reactions: data.reactions } : msg
            ));
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { react, loading };
};

export default useReactToMessage;
