import { useState } from "react";
import { FaTimes } from "react-icons/fa";

const SearchModal = ({ onClose }) => {
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-96">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-white">Arkadaş Ara</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                <input
                    type="text"
                    placeholder="Kullanıcı adı veya friend code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input input-bordered w-full mb-4"
                />

                <div className="text-center text-gray-400 py-8">
                    Hook'lar eklenecek
                </div>
            </div>
        </div>
    );
};

export default SearchModal;