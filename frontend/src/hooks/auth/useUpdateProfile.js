import apiFetch from '../../utils/apiFetch';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../zustand/useAuth';

// Görünen ad ve avatar güncelleme.
// Kullanıcı adı değiştirilemez: arkadaşlıklar ve sohbetler ona bağlı.
const useUpdateProfile = () => {
    const [loading, setLoading] = useState(false);
    const setAuthUser = useAuth((state) => state.setAuthUser);

    const updateProfile = async ({ fullName, profilePic }) => {
        setLoading(true);
        try {
            const res = await apiFetch("/api/auth/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fullName, profilePic }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Profil güncellenemedi");

            // Store'u güncelle ki değişiklik her yerde anında görünsün
            setAuthUser(data.user);
            toast.success("Profil güncellendi");
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') toast.error(error.message);
            return false;
        } finally {
            setLoading(false);
        }
    };

    return { updateProfile, loading };
};

export default useUpdateProfile;
