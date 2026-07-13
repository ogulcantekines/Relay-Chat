import { FaTimes, FaBell } from "react-icons/fa";

const NotificationModal = ({ onClose }) => {

    return (
        <div className="fixed top-16 left-48 w-80 bg-[color:var(--bg-panel)] backdrop-blur-sm rounded-lg shadow-xl border border-[color:var(--border-subtle)] z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-[color:var(--border-subtle)] flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FaBell className="text-[color:var(--accent-hover)]" />
                    <h3 className="font-semibold text-white">Bildirimler</h3>
                </div>
                <button onClick={onClose} className="text-[color:var(--text-muted)] hover:text-white">
                    <FaTimes />
                </button>
            </div>

            {/* Content */}
            <div className="p-12 text-center">
                <FaBell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-[color:var(--text-muted)]">Bildiriminiz yok</p>
                <p className="text-xs text-[color:var(--text-muted)] mt-2">Hook'lar eklenecek</p>
            </div>
        </div>
    );
};

export default NotificationModal;