import useAuth from "../../zustand/useAuth";
import useConversation from "../../zustand/useConversation";
import { useState } from 'react';
import useEditMessage from "../../hooks/messages/useEditMessage";
import useDeleteMessage from "../../hooks/messages/useDeleteMessage";


const Message = ({ message }) => { //props ile de yapılabilir o zaman
    //props.message şeklinde erişilir

    const { authUser } = useAuth();
    const { selectedConversation } = useConversation();

    //edit ile ilgili kısım
    const { editMessage, loading } = useEditMessage(); //edit message hookunu kullanıyoruz
    const { deleteMessage, loading: deleteLoading } = useDeleteMessage(); //mesaj silme hooku
    const [isEditing, setIsEditing] = useState(false); //mesaj düzenleme modunda mı değil mi
    const [editedText, setEditedText] = useState(message.message); // düzenlenen metin burada tutulacak

    // ObjectId/string uyuşmazlığını önlemek için String() kullan
    const fromMe = String(message.senderId) === String(authUser._id);

    //bu kısım mesajın kimden geldiğine göre sağa veya sola yaslanmasını,profil fotoğrafını,adını ve balon rengini ayarlıyor
    const chatClassName = fromMe ? "chat chat-end" : "chat chat-start";
    const profilePic = fromMe ? authUser.profilePic : selectedConversation?.profilePic;
    const fullName = fromMe ? authUser.fullName : selectedConversation?.fullName;
    const bubbleBgColor = fromMe ? "bg-blue-500" : "bg-gray-300 text-black";

    // Mesaj zamanını formatla
    const formatTime = (timestamp) => {
        const ts = timestamp || message.createdAt || message.timestamp;
        const date = new Date(ts);
        if (isNaN(date.getTime())) return "";
        return date.toLocaleTimeString('tr-TR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleDelete = async () => { //mesaj silme işlemi, çöp kutusuna basılırsa çalışır
        if (!window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) return;
        await deleteMessage(message._id);
    };

    const handleEditSave = async () => { //mesaj düzenleme kaydetme işlemi, save a basılırsa çalışır
        if (editedText.trim() === message.message) {
            setIsEditing(false);
            return;
        }
        const success = await editMessage(message._id, editedText); //düzenlenirse true döner
        if (success) {
            setIsEditing(false);
        }
    };

    const handleEditCancel = () => { //mesaj düzenleme iptal işlemi, cancel a basılırsa çalışır
        setEditedText(message.message); //orjinal mesaja geri dön
        setIsEditing(false);
    };

    return (
        <div className={chatClassName}>
            <div className="chat-image avatar">
                <div className="w-10 rounded-full">
                    <img
                        alt="Tailwind CSS chat bubble component"
                        src={profilePic} />
                </div>
            </div>

            <div className="chat-header">
                {fullName}
            </div>

            {isEditing ? ( //eğer düzenleme modundaysa düzenleme arayüzü göster
                <div className="flex flex-col gap-2">
                    <input
                        type="text"
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        className="input input-bordered input-sm w-full max-w-xs"
                        disabled={loading}
                    />
                    <div className="flex gap-2">
                        <button
                            onClick={handleEditSave}
                            className="btn btn-success btn-xs"
                            disabled={loading}
                        >
                            ✓ save
                        </button>
                        <button
                            onClick={handleEditCancel}
                            className="btn btn-error btn-xs"
                            disabled={loading}
                        >
                            ✕ cancel
                        </button>
                    </div>
                </div>
            ) : ( //eğer düzenleme modunda değilse normal mesaj gösterimi
                <>
                    <div className={`chat-bubble text-white ${bubbleBgColor} break-words max-w-xs relative group ${message.isDeleted ? "italic opacity-60" : ""}`}>
                        {message.message}

                        {/* Silinen mesaj artık düzenlenemez, bu yüzden butonlar gizlenir */}
                        {fromMe && !message.isDeleted && (
                            <div className="absolute -top-2 -right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn btn-xs btn-circle"
                                    title="Düzenle"
                                >
                                    ✏️
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleteLoading}
                                    className="btn btn-xs btn-circle"
                                    title="Sil"
                                >
                                    🗑️
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="chat-footer opacity-70 ml-2 flex items-center gap-1.5">
                        <span className="text-xs">{formatTime()}</span>

                        {message.isEdited && !message.isDeleted && (
                            <span className="text-xs italic">(edited)</span> // mesaj düzenlendiyse edited ibaresi gösterilir
                        )}

                        {fromMe && (
                            message.isRead ? (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 15" className="inline-block">
                                    <path fill="#53bdeb" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.033l-.358-.325a.32.32 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 15" className="inline-block">
                                    <path fill="#92a58c" d="M10.91 3.316l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" />
                                </svg>
                            )
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
export default Message;
