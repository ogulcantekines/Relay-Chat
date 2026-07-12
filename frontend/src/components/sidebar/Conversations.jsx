import Conversation from "./Conversation";
import useGetConversations from "../../hooks/conversation/useGetConversations";
import useUnread from "../../zustand/useUnread";

// Conversations Bileşeni - Sidebar'daki "Sohbetler" sekmesinin içeriği
// useGetConversations hook'u ile backend'den çekilen sohbet listesini render eder.
// Arkadaşlık sistemi ile bağlantısı:
// - useGetConversations pending/active filtreleme yapar
// - Boş durumda kullanıcıyı arkadaş eklemeye yönlendirir
// - Yeni draft conversation'lar useSendMessage tarafından bu listeye eklenir

const Conversations = ({ filter = "" }) => {
    const { loading, conversations } = useGetConversations();
    const { counts } = useUnread();

    // Kenar çubuğundaki arama kutusuna göre isme/kullanıcı adına filtrele
    const visible = filter
        ? conversations.filter(c =>
            c.fullName?.toLowerCase().includes(filter.toLowerCase()) ||
            c.username?.toLowerCase().includes(filter.toLowerCase()))
        : conversations;

    if (loading && conversations.length === 0) {
        return (
            <div className='flex justify-center py-6'>
                <span
                    className='w-5 h-5 border-2 rounded-full animate-spin'
                    style={{ borderColor: 'var(--border-subtle)', borderTopColor: 'var(--accent)' }}
                />
            </div>
        );
    }

    if (visible.length === 0) {
        return (
            <div className='flex flex-col items-center gap-1.5 px-4 py-8 text-center'>
                <span className='text-2xl opacity-60'>{filter ? '🔍' : '💬'}</span>
                <span className='text-sm' style={{ color: 'var(--text-secondary)' }}>
                    {filter ? 'Eşleşen sohbet yok' : 'Henüz sohbet yok'}
                </span>
                {!filter && (
                    <span className='text-xs' style={{ color: 'var(--text-muted)' }}>
                        Arkadaş ekleyerek sohbete başla
                    </span>
                )}
            </div>
        );
    }

    return (
        <div className='flex flex-col gap-0.5 px-2 py-2 overflow-y-auto scroll-slim'>
            {visible.map((conversation, idx) => (
                <Conversation
                    key={conversation._id}
                    conversation={conversation}
                    isLast={idx === visible.length - 1}
                    unreadCount={counts[conversation._id] || 0}
                />
            ))}
        </div>
    );
};

export default Conversations;
