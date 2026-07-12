import { useState } from 'react';
import useAuth from "../../zustand/useAuth";
import useConversation from "../../zustand/useConversation";
import useEditMessage from "../../hooks/messages/useEditMessage";
import useDeleteMessage from "../../hooks/messages/useDeleteMessage";
import useReactToMessage from "../../hooks/messages/useReactToMessage";

const REACTIONS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

// Arama terimini mesaj metni içinde vurgula.
// Kullanıcı girdisi regex'e gömüldüğü için özel karakterler kaçırılıyor.
const highlight = (text, term) => {
    if (!term) return text;
    const safe = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const parts = text.split(new RegExp(`(${safe})`, "gi"));
    return parts.map((part, i) =>
        part.toLowerCase() === term.toLowerCase()
            ? <mark key={i} className="hit">{part}</mark>
            : part
    );
};

const Message = ({ message, searchTerm = "", showAvatar = true }) => {

    const { authUser } = useAuth();
    const { selectedConversation } = useConversation();

    const { editMessage, loading } = useEditMessage();
    const { deleteMessage, loading: deleteLoading } = useDeleteMessage();
    const { react } = useReactToMessage();

    const [isEditing, setIsEditing] = useState(false);
    const [editedText, setEditedText] = useState(message.message);
    const [showPicker, setShowPicker] = useState(false);

    // ObjectId/string uyuşmazlığını önlemek için String() kullan
    const fromMe = String(message.senderId) === String(authUser._id);
    const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;

    const formatTime = () => {
        const ts = message.createdAt || message.timestamp;
        const date = new Date(ts);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    };

    const handleEditSave = async () => {
        if (editedText.trim() === message.message) {
            setIsEditing(false);
            return;
        }
        const success = await editMessage(message._id, editedText);
        if (success) setIsEditing(false);
    };

    const handleEditCancel = () => {
        setEditedText(message.message);
        setIsEditing(false);
    };

    const handleDelete = async () => {
        if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
        await deleteMessage(message._id);
    };

    // Aynı emojiye basanları tek rozette topla
    const grouped = (message.reactions || []).reduce((acc, r) => {
        acc[r.emoji] = (acc[r.emoji] || 0) + 1;
        return acc;
    }, {});

    if (isEditing) {
        return (
            <div className={`flex ${fromMe ? 'justify-end' : 'justify-start'} px-4 py-1`}>
                <div className='flex flex-col gap-2 w-full max-w-md'>
                    <input
                        type='text'
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleEditSave();
                            if (e.key === 'Escape') handleEditCancel();
                        }}
                        className='field'
                        disabled={loading}
                        autoFocus
                    />
                    <div className='flex gap-2 justify-end'>
                        <button onClick={handleEditCancel} className='text-xs px-3 py-1.5 rounded-lg'
                            style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }} disabled={loading}>
                            Vazgeç
                        </button>
                        <button onClick={handleEditSave} className='btn-primary-grad text-xs px-3 py-1.5' disabled={loading}>
                            Kaydet
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div
            className={`group flex gap-2 px-4 ${showAvatar ? 'mt-3' : 'mt-0.5'} ${fromMe ? 'flex-row-reverse' : 'flex-row'} animate-rise`}
            onMouseLeave={() => setShowPicker(false)}
        >
            {/* Avatar yalnızca karşı taraf için gösterilir; kendi mesajlarımızda
                kim olduğumuz zaten belli, tekrar etmek yer kaplıyordu.
                Ardışık mesajlarda da tekrar edilmez, yerine boşluk bırakılır. */}
            {!fromMe && (
                <div className='w-8 flex-shrink-0'>
                    {showAvatar && (
                        <img
                            src={profilePic}
                            alt=''
                            className='w-8 h-8 rounded-full object-cover'
                            style={{ border: '1px solid var(--border-subtle)' }}
                        />
                    )}
                </div>
            )}

            <div className={`flex flex-col min-w-0 max-w-[min(34rem,calc(100%-3.5rem))] ${fromMe ? 'items-end' : 'items-start'}`}>
                <div className='relative'>
                    <div
                        className={`bubble ${fromMe ? 'bubble-out' : 'bubble-in'} ${message.isDeleted ? 'italic opacity-60' : ''}`}
                    >
                        {message.isDeleted
                            ? "Bu mesaj silindi"
                            : highlight(message.message, searchTerm)}
                    </div>

                    {/* Eylem çubuğu: yalnızca imleç mesajın üstündeyken görünür */}
                    {!message.isDeleted && (
                        <div
                            // Dar ekranda balonun yanında yer yok; butonlar balonun
                            // üstüne alınır. Geniş ekranda yanda durmaya devam eder.
                            className={`absolute z-10 flex items-center gap-0.5 opacity-0 group-hover:opacity-100
                                        focus-within:opacity-100 transition-opacity
                                        bottom-full mb-1 md:bottom-auto md:top-1/2 md:mb-0 md:-translate-y-1/2
                                        ${fromMe ? 'right-0 md:right-full md:mr-1.5' : 'left-0 md:left-full md:ml-1.5'}`}
                        >
                            <button
                                onClick={() => setShowPicker(v => !v)}
                                className='w-7 h-7 rounded-full flex items-center justify-center text-xs'
                                style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                title='Tepki ver'
                            >
                                🙂
                            </button>
                            {fromMe && (
                                <>
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className='w-7 h-7 rounded-full flex items-center justify-center text-xs'
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                        title='Düzenle'
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={deleteLoading}
                                        className='w-7 h-7 rounded-full flex items-center justify-center text-xs'
                                        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                                        title='Sil'
                                    >
                                        🗑️
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {/* Emoji seçici */}
                    {showPicker && (
                        <div
                            className={`absolute z-20 bottom-full mb-1.5 ${fromMe ? 'right-0' : 'left-0'}
                                        flex gap-1 p-1.5 rounded-xl shadow-xl max-w-[90vw] flex-wrap`}
                            style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
                        >
                            {REACTIONS.map(emoji => (
                                <button
                                    key={emoji}
                                    onClick={() => { react(message._id, emoji); setShowPicker(false); }}
                                    className='w-8 h-8 rounded-lg text-base hover:scale-110 transition-transform'
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Tepki rozetleri */}
                {Object.keys(grouped).length > 0 && (
                    <div className='flex gap-1 mt-1 flex-wrap'>
                        {Object.entries(grouped).map(([emoji, count]) => {
                            const mine = (message.reactions || [])
                                .some(r => r.emoji === emoji && String(r.userId) === String(authUser._id));
                            return (
                                <button
                                    key={emoji}
                                    onClick={() => react(message._id, emoji)}
                                    className='flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs transition-colors'
                                    style={{
                                        background: mine ? 'var(--accent-soft)' : 'var(--bg-elevated)',
                                        border: `1px solid ${mine ? 'var(--accent)' : 'var(--border-subtle)'}`,
                                        color: 'var(--text-secondary)'
                                    }}
                                >
                                    <span>{emoji}</span>
                                    {count > 1 && <span>{count}</span>}
                                </button>
                            );
                        })}
                    </div>
                )}

                <div className='flex items-center gap-1.5 mt-0.5 px-1'>
                    <span className='text-[11px]' style={{ color: 'var(--text-muted)' }}>{formatTime()}</span>

                    {message.isEdited && !message.isDeleted && (
                        <span className='text-[11px] italic' style={{ color: 'var(--text-muted)' }}>düzenlendi</span>
                    )}

                    {fromMe && !message.isDeleted && (
                        <span title={message.isRead ? 'Okundu' : 'İletildi'}>
                            {message.isRead ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 15">
                                    <path fill="#53bdeb" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 16 15">
                                    <path fill="#8696a0" d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                </svg>
                            )}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Message;
