import { useEffect, useRef } from "react";
import Message from "./Message";
import useGetMessages from "../../hooks/messages/useGetMessages";
import MessageSkeleton from "../skeletons/MessageSkeleton";
import useListenMessages from "../../hooks/socket/useListenMessages";

// Gün ayracı etiketi: bugün / dün / tarih
const dayLabel = (date) => {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const same = (a, b) => a.toDateString() === b.toDateString();
    if (same(date, today)) return "Bugün";
    if (same(date, yesterday)) return "Dün";
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Messages = ({ searchTerm = "" }) => {
    const { loading, messages } = useGetMessages();
    const bottomRef = useRef();
    useListenMessages(); // Real-time mesaj dinleme

    // Yeni mesaj geldiğinde en alta kaydır
    useEffect(() => {
        const id = setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 80);
        return () => clearTimeout(id);
    }, [messages]);

    // Arama terimi varsa yalnızca eşleşen mesajları göster
    const visible = searchTerm
        ? messages.filter(m => m.message?.toLowerCase().includes(searchTerm.toLowerCase()))
        : messages;

    if (loading) {
        return (
            <div className='flex-1 overflow-y-auto scroll-slim py-3'>
                {Array.from({ length: 4 }).map((_, i) => <MessageSkeleton key={i} />)}
            </div>
        );
    }

    if (visible.length === 0) {
        return (
            <div className='flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center'>
                <div className='text-4xl opacity-60'>{searchTerm ? '🔍' : '👋'}</div>
                <p className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                    {searchTerm
                        ? 'Bu aramayla eşleşen mesaj yok'
                        : 'Henüz mesaj yok. İlk mesajı sen gönder!'}
                </p>
            </div>
        );
    }

    return (
        <div className='flex-1 overflow-y-auto overflow-x-hidden scroll-slim py-3'>
            {visible.map((message, i) => {
                const prev = visible[i - 1];
                const date = new Date(message.createdAt || message.timestamp);
                const prevDate = prev ? new Date(prev.createdAt || prev.timestamp) : null;

                const newDay = !prevDate || prevDate.toDateString() !== date.toDateString();

                // Aynı kişinin 5 dakika içindeki ardışık mesajlarında avatarı tekrar etme
                const sameSender = prev && String(prev.senderId) === String(message.senderId);
                const closeInTime = prevDate && (date - prevDate) < 5 * 60 * 1000;
                const showAvatar = newDay || !sameSender || !closeInTime;

                return (
                    <div key={message._id}>
                        {newDay && (
                            <div className='flex items-center gap-3 px-4 my-4'>
                                <div className='flex-1 h-px' style={{ background: 'var(--border-subtle)' }} />
                                <span
                                    className='text-[11px] px-2.5 py-1 rounded-full'
                                    style={{ background: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                                >
                                    {dayLabel(date)}
                                </span>
                                <div className='flex-1 h-px' style={{ background: 'var(--border-subtle)' }} />
                            </div>
                        )}
                        <Message message={message} searchTerm={searchTerm} showAvatar={showAvatar} />
                    </div>
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
};

export default Messages;
