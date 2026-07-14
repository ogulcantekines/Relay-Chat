import useConversation from "../../zustand/useConversation";
import useSocket from "../../zustand/useSocket";
import { FaClock } from "react-icons/fa";
import useGlobalTyping from "../../hooks/socket/useGlobalTyping"; // Tüm konuşmalar için global yazıyor hook'u

// Son mesaj zamanını kısa biçimde göster: bugünse saat, dünse "dün", öncesi tarih
const shortTime = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";

  const now = new Date();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
  }
  if (date.toDateString() === yesterday.toDateString()) return "dün";
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' });
};

const Conversation = (props) => {

  const { selectedConversation, setSelectedConversation } = useConversation();
  const { onlineUsers } = useSocket();
  const { isUserTyping } = useGlobalTyping(); // Tüm konuşmalardaki yazıyor durumunu kontrol et

  const isSelected = selectedConversation?._id === props.conversation._id;
  const isOnline = onlineUsers.includes(props.conversation._id);
  const isThisUserTyping = isUserTyping(props.conversation._id);
  const isPending = props.conversation.status === 'pending';
  const unread = props.unreadCount || 0;

  const lastMessage = props.conversation.lastMessage;

  return (
    <div
      className={`flex gap-3 items-center px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? 'tile-active' : ''}`}
      style={{
        border: `1px solid ${isSelected ? 'var(--border-strong)' : 'transparent'}`
      }}
      onMouseEnter={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'var(--bg-hover)';
      }}
      onMouseLeave={(e) => {
        if (!isSelected) e.currentTarget.style.background = 'transparent';
      }}
      onClick={() => setSelectedConversation(props.conversation)}
    >
      {/* Avatar - online göstergesi ile */}
      <div className='relative flex-shrink-0'>
        <img
          src={props.conversation.profilePic}
          alt=''
          className={`w-11 h-11 avatar-ring ${isOnline ? 'avatar-ring-online' : ''}`}
        />
        {isOnline && (
          <span
            className='absolute bottom-0 right-0 w-3 h-3 rounded-full'
            style={{ background: 'var(--online)', border: '2px solid var(--bg-panel)' }}
          />
        )}
      </div>

      <div className='flex flex-col flex-1 min-w-0'>
        <div className='flex items-center justify-between gap-2'>
          <span
            className='truncate text-sm'
            style={{
              color: 'var(--text-primary)',
              fontWeight: unread > 0 ? 700 : 500
            }}
          >
            {props.conversation.fullName}
          </span>

          <span className='text-[11px] flex-shrink-0' style={{ color: 'var(--text-muted)' }}>
            {isPending
              ? <FaClock className='text-amber-500' title='Yanıt bekleniyor' />
              : shortTime(lastMessage?.createdAt || lastMessage?.timestamp)}
          </span>
        </div>

        <div className='flex items-center justify-between gap-2 mt-0.5'>
          <span className='text-xs truncate' style={{ color: 'var(--text-muted)' }}>
            {isThisUserTyping ? (
              <span className='italic' style={{ color: 'var(--online)' }}>yazıyor...</span>
            ) : isPending ? (
              <span className='italic text-amber-500'>Yanıt bekleniyor</span>
            ) : lastMessage?.message ? (
              lastMessage.isDeleted ? <span className='italic'>Bu mesaj silindi</span> : lastMessage.message
            ) : (
              <span className='italic'>Henüz mesaj yok</span>
            )}
          </span>

          {/* Okunmamış mesaj rozeti */}
          {unread > 0 && (
            <span
              className='flex-shrink-0 min-w-[20px] h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center animate-badge'
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default Conversation;
