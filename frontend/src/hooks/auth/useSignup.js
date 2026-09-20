import { passwordIsValid } from '../../utils/password';
import { notifySessionChange } from '../../utils/sessionEvents';
import apiFetch from '../../utils/apiFetch';
import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../zustand/useAuth";


const useSignup = () => {
    const [loading, setLoading] = useState(false); //yükleniyor durumu
    const setAuthUser = useAuth((state) => state.setAuthUser); //Zustand store'daki setAuthUser fonksiyonu. auth işlemleri her yerde kullanılabilmesi için Zustand store'da tutuluyor
    // const setAuthUser = useAuth(); böyle de kullanılır ama zustand ile genelde state tercih edilir.

    const handleInputErrors = (userData) => { //input hatalarını kontrol eden fonksiyon
        const { fullName, username, password, confirmPassword, gender } = userData;

        if (!username || !fullName || !password || !confirmPassword || !gender) {
            toast.error("Tüm alanları doldur");
            return false;
        }

        if (password !== confirmPassword) {
            toast.error("Parolalar eşleşmiyor");
            return false;
        }

        if (!passwordIsValid(password)) {
            toast.error("Parola en az 8 karakter ve en fazla 72 UTF-8 bayt olmalı");
            return false;
        }

        return true;
    };

    const signUp = async (userData) => { //kayıt işlemini yapan fonksiyon ve inputs objesini parametre olarak alıyor.
        const success = handleInputErrors(userData); //inputs objesi handleInputErrors fonksiyonuna gönderilip doğrulanıyor
        if (!success) return;

        setLoading(true);
        try {
            const res = await apiFetch('/api/auth/signup', { //backende istek atılıyor
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData) // inputs objesi json stringe çevrilip body olarak gönderiliyor
            });

            const data = await res.json(); //response json formatına çevriliyor

            if (!res.ok) {
                throw new Error(data.message || "Hesap oluşturulamadı");
            }

            // Keep the public profile in memory after the server creates the session.

            const userToSave = data.user || data; // API yanıtında user objesi olabilir veya doğrudan data olabilir
            setAuthUser(userToSave);
            notifySessionChange(); // Other tabs revalidate the shared session cookie.

            toast.success("Hesabın oluşturuldu");

        } catch (err) {
            console.error("Signup error:", err);
            if (err.name !== 'AbortError') toast.error(err.message);
        } finally {
            setLoading(false); //işlem bittiğinde loading false yapılır
        }
    };

    return { //dışarıya açılan özellikler
        loading,
        signUp
    };
};

export default useSignup;