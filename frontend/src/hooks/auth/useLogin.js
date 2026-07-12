import { useState } from "react";
import toast from "react-hot-toast";
import useAuth from "../../zustand/useAuth";
import useSocket from "../../zustand/useSocket";

const useLogin = () => {
    const [loading, setLoading] = useState(false); //yükleniyor durumu

    const setAuthUser = useAuth((state) => state.setAuthUser);//zustanddaki setAuthUser fonksiyonunu alıyoruz
    //const { setAuthUser } = useAuth(); //destructorla da alabiliriz ama bu kodda stateli kullanımını göstermek istiyoruz
    //yani state ile alıp setAuthUsera eşitledik
    const { connectSocket } = useSocket(); //socket bağlantısı kurmak için, anlık server bağlantısı

    const handleInputErrors = (userData) => { //input hatalarını kontrol eden fonksiyon
        const { username, password } = userData;
        if (!username || !password) { //js de "falsy" değerlere false der, boş string, null, undefined, 0, NaN hepsi false kabul edilir
            toast.error("All fields are required");
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
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || "Login failed");
            }
            // Success case - Sadece Zustand store'a kaydet (localStorage otomatik olur yani zustand içinde localStorage'a kaydediliyor)
            const userToSave = data.user || data;
            setAuthUser(userToSave); // Zustand store'daki setAuthUser fonksiyonu ile kullanıcı bilgisi kaydediliyor
            connectSocket(userToSave._id);// localstorage a kaydedilen userın id sini alıp socket bağlantısı kuruyoruz

            toast.success("Login successful");
            
        } catch (err) {
            console.error("Login error:", err);
            toast.error(err.message);
        }     finally {
            setLoading(false);
        }
    };

    return { loading, login };
}
export default useLogin;