import { notifySessionChange } from '../../utils/sessionEvents';
import apiFetch from '../../utils/apiFetch';
import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../zustand/useAuth";

const useLogin = () => {
    const [loading, setLoading] = useState(false); //yükleniyor durumu

    const setAuthUser = useAuth((state) => state.setAuthUser);//zustanddaki setAuthUser fonksiyonunu alıyoruz
    //const { setAuthUser } = useAuth(); //destructorla da alabiliriz ama bu kodda stateli kullanımını göstermek istiyoruz
    //yani state ile alıp setAuthUsera eşitledik

    const handleInputErrors = (userData) => { //input hatalarını kontrol eden fonksiyon
        const { username, password } = userData;
        if (!username || !password) { //js de "falsy" değerlere false der, boş string, null, undefined, 0, NaN hepsi false kabul edilir
            toast.error("Tüm alanları doldur");
            return false;
        }
        return true;
    };

    const login = async (userData) => { //login işlemini yapan fonksiyon,userData parametre olarak alınıyor ve 
    // bu Login.jsx deki inputs objesi
        const success = handleInputErrors(userData);
        if(!success) return; //yanlışssa fonksiyondan çık

        setLoading(true);
        try {
            const res = await apiFetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Giriş yapılamadı");
            }
            // Keep the public profile in memory; authentication remains in the HttpOnly cookie.
            const userToSave = data.user || data;
            setAuthUser(userToSave);
            notifySessionChange(); // Zustand store'daki setAuthUser fonksiyonu ile kullanıcı bilgisi kaydediliyor

            toast.success("Hoş geldin");
            
        } catch (err) {
            console.error("Login error:", err);
            if (err.name !== 'AbortError') toast.error(err.message);
        }     finally {
            setLoading(false);
        }
    };

    return { loading, login };
}
export default useLogin;