import { useLayoutEffect, useRef, useState } from 'react';
import Message from './Message';
import useGetMessages from '../../hooks/messages/useGetMessages';
import MessageSkeleton from '../skeletons/MessageSkeleton';
import useAuth from '../../zustand/useAuth';
import { IoArrowDown } from 'react-icons/io5';

const dayLabel = date => {
    const today = new Date(), yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Bugün';
    if (date.toDateString() === yesterday.toDateString()) return 'Dün';
    return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

const Messages = ({ searchTerm = '' }) => {
    const { loading, messages, hasMore, loadingOlder, error, retry, loadOlder } = useGetMessages();
    const userId = useAuth(state => state.authUser?._id);
    const listRef = useRef(null);
    const nearBottom = useRef(true);
    const historyPosition = useRef(null);
    const [showJump, setShowJump] = useState(false);
    const lastId = messages.at(-1)?._id;
    const lastSender = messages.at(-1)?.senderId;

    useLayoutEffect(() => {
        const list = listRef.current;
        if (!list || loadingOlder) return;
        if (historyPosition.current) {
            list.scrollTop = list.scrollHeight - historyPosition.current.height + historyPosition.current.top;
            historyPosition.current = null;
        } else if (!searchTerm && (nearBottom.current || lastSender === userId)) {
            list.scrollTop = list.scrollHeight;
        }
    }, [lastId, lastSender, userId, loading, loadingOlder, searchTerm]);

    const visible = searchTerm ? messages.filter(message => message.message?.toLocaleLowerCase('tr').includes(searchTerm.toLocaleLowerCase('tr'))) : messages;
    const handleOlder = async () => {
        const list = listRef.current;
        historyPosition.current = list ? { height: list.scrollHeight, top: list.scrollTop } : null;
        await loadOlder();
    };

    if (loading && messages.length === 0) return <div className="flex-1 min-h-0 overflow-hidden py-3" role="status" aria-label="Mesajlar yükleniyor">{Array.from({ length: 4 }, (_, i) => <MessageSkeleton key={i} />)}</div>;
    return (
        <div className="relative flex-1 min-h-0 flex flex-col">
            {error && <div className="px-4 py-2 text-xs text-center text-red-300" role="alert">{error} <button className="underline ml-2" onClick={retry}>Tekrar dene</button></div>}
            <div ref={listRef} aria-label="Mesaj geçmişi" className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scroll-slim py-3 flex flex-col"
                onScroll={event => {
                    const el = event.currentTarget;
                    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
                    setShowJump(!nearBottom.current);
                }}>
                {hasMore && <button className="self-center text-xs py-2 px-4 mb-3 rounded-full text-[color:var(--accent-hover)] bg-[color:var(--accent-soft)]"
                    disabled={loadingOlder} onClick={handleOlder}>{loadingOlder ? 'Yükleniyor...' : 'Önceki mesajları yükle'}</button>}
                {searchTerm && <p className="text-xs text-center mb-3 text-[color:var(--text-muted)]" role="status">{visible.length} sonuç · Yüklenen mesajlarda aranıyor</p>}
                {visible.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 text-center">
                        <div className="text-4xl opacity-60" aria-hidden="true">{searchTerm ? '🔍' : '👋'}</div>
                        <p className="text-sm text-[color:var(--text-secondary)]">{searchTerm ? 'Bu aramayla eşleşen mesaj yok' : 'Henüz mesaj yok. İlk mesajı sen gönder!'}</p>
                    </div>
                ) : <div className="mt-auto">
                    {visible.map((message, i) => {
                        const prev = visible[i - 1];
                        const date = new Date(message.createdAt || message.timestamp);
                        const prevDate = prev ? new Date(prev.createdAt || prev.timestamp) : null;
                        const newDay = !prevDate || prevDate.toDateString() !== date.toDateString();
                        const showAvatar = newDay || prev?.senderId !== message.senderId || date - prevDate >= 5 * 60 * 1000;
                        return <div key={message._id}>
                            {newDay && <div className="flex items-center gap-3 px-4 my-4">
                                <div className="flex-1 h-px bg-[color:var(--border-subtle)]" />
                                <span className="text-[11px] px-2.5 py-1 rounded-full bg-[color:var(--bg-elevated)] text-[color:var(--text-muted)]">{dayLabel(date)}</span>
                                <div className="flex-1 h-px bg-[color:var(--border-subtle)]" />
                            </div>}
                            <Message message={message} searchTerm={searchTerm} showAvatar={showAvatar} />
                        </div>;
                    })}
                </div>}
            </div>
            {showJump && !searchTerm && <button className="absolute bottom-3 right-4 icon-btn w-10 h-10 shadow-xl" title="Son mesaja git" aria-label="Son mesaja git" onClick={() => { listRef.current.scrollTop = listRef.current.scrollHeight; }}><IoArrowDown /></button>}
        </div>
    );
};
export default Messages;
