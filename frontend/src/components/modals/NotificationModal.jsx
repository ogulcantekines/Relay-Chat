import { FaTimes, FaBell } from "react-icons/fa";

const NotificationModal = ({ onClose }) => {

    return (
        <div className="fixed top-16 left-48 w-80 bg-gray-800/95 backdrop-blur-sm rounded-lg shadow-xl border border-gray-700 z-50 max-h-96 overflow-y-auto">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FaBell className="text-sky-400" />
                    <h3 className="font-semibold text-white">Bildirimler</h3>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-white">
                    <FaTimes />
                </button>
            </div>

            {/* Content */}
            <div className="p-12 text-center">
                <FaBell className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">Bildiriminiz yok</p>
                <p className="text-xs text-gray-500 mt-2">Hook'lar eklenecek</p>
            </div>
        </div>
    );
};

export default NotificationModal;