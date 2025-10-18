import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../zustand/useAuth";
import useSocket from "../../zustand/useSocket";


const useSignup = () => {
    const [loading, setLoading] = useState(false); //yükleniyor durumu
    const setAuthUser = useAuth((state) => state.setAuthUser); //Zustand store'daki setAuthUser fonksiyonu. auth işlemleri her yerde kullanılabilmesi için Zustand store'da tutuluyor
    // const setAuthUser = useAuth(); böyle de kullanılır ama zustand ile genelde state tercih edilir.
    const { connectSocket } = useSocket(); //Socket bağlantısı için kullanılır(io bağlantısı)

    const handleInputErrors = (userData) => { //input hatalarını kontrol eden fonksiyon
        const { fullName, username, password, confirmPassword, gender } = userData;

        if (!username || !fullName || !password || !confirmPassword || !gender) {
            toast.error("All fields are required");
            return false;
        }

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return false;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return false;
        }

        return true;
    };

    const signUp = async (userData) => { //kayıt işlemini yapan fonksiyon ve inputs objesini parametre olarak alıyor.
        const success = handleInputErrors(userData); //inputs objesi handleInputErrors fonksiyonuna gönderilip doğrulanıyor
        if (!success) return;

        setLoading(true);
        try {
            const res = await fetch('/api/auth/signup', { //backende istek atılıyor
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData) // inputs objesi json stringe çevrilip body olarak gönderiliyor
            });

            const data = await res.json(); //response json formatına çevriliyor

            if (!res.ok) {
                throw new Error(data.message || "Sign up failed");
            }

            // Success case - Sadece Zustand store'a kaydet (localStorage otomatik olur)

            const userToSave = data.user || data; // API yanıtında user objesi olabilir veya doğrudan data olabilir
            setAuthUser(userToSave); // Zustand store'daki setAuthUser fonksiyonu ile kullanıcı bilgisi kaydediliyor, localStorage'a kaydediliyor oradaki fonksiyonun içinde
            connectSocket(userToSave._id); //io bağlantısı kuruluyor

            console.log('Signup successful:', data);
            toast.success("Sign up successful");

        } catch (err) {
            console.error("Signup error:", err);
            toast.error(err.message);
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