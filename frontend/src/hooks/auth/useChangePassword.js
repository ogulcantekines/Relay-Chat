import useAuth from '../../zustand/useAuth';
import useSocket from '../../zustand/useSocket';
import { notifySessionChange } from '../../utils/sessionEvents';

import { useState } from 'react';
import toast from 'react-hot-toast';

// Şifre değiştirme. Backend mevcut şifreyi doğrulamadan değişikliği kabul etmez.
const useChangePassword = () => {
    const [loading, setLoading] = useState(false);

    const changePassword = async (currentPassword, newPassword) => {
        const version = useAuth.getState().sessionVersion;
        setLoading(true);
        try {
            const res = await fetch("/api/auth/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();
            if (useAuth.getState().sessionVersion !== version) return false;
            if (!res.ok) throw new Error(data.message || "Şifre değiştirilemedi");

            useSocket.getState().disconnectSocket();
            useSocket.getState().connectSocket();
            notifySessionChange();
            toast.success("Şifre değiştirildi; diğer oturumlar kapatıldı");
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { changePassword, loading };
};

export default useChangePassword;
