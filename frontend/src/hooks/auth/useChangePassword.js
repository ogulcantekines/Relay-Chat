import { useState } from 'react';
import toast from 'react-hot-toast';

// Şifre değiştirme. Backend mevcut şifreyi doğrulamadan değişikliği kabul etmez.
const useChangePassword = () => {
    const [loading, setLoading] = useState(false);

    const changePassword = async (currentPassword, newPassword) => {
        setLoading(true);
        try {
            const res = await fetch("/api/auth/password", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Şifre değiştirilemedi");

            toast.success("Şifre değiştirildi");
            return true;
        } catch (error) {
            toast.error(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { changePassword, loading };
};

export default useChangePassword;
