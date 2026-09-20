import { useEffect, useState } from 'react';
import useSocket from '../../zustand/useSocket';
import useConversation from '../../zustand/useConversation';

const useListenTyping = () => {
    const socket = useSocket(state => state.socket);
    const id = useConversation(state => state.selectedConversation?._id);
    const [isTyping, setIsTyping] = useState(false);
    useEffect(() => {
        setIsTyping(false);
        if (!socket) return;
        let timeout;
        const stop = () => { clearTimeout(timeout); setIsTyping(false); };
        const onTyping = ({ senderId }) => {
            if (senderId !== id) return;
            setIsTyping(true);
            clearTimeout(timeout);
            timeout = setTimeout(stop, 4000);
        };
        const onStopped = ({ senderId }) => { if (senderId === id) stop(); };
        socket.on('userTyping', onTyping);
        socket.on('userStoppedTyping', onStopped);
        socket.on('disconnect', stop);
        return () => {
            clearTimeout(timeout);
            socket.off('userTyping', onTyping);
            socket.off('userStoppedTyping', onStopped);
            socket.off('disconnect', stop);
        };
    }, [socket, id]);
    return { isTyping };
};
export default useListenTyping;
