import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../zustand/useAuth';
import useConversation from '../../zustand/useConversation';
import useSocket from '../../zustand/useSocket';


const useLogout = () => {
    
    const [loading, setLoading] = useState(false);
    const  logout  = useAuth((state) => state.logout);//kısacası logout fonksiyonunu destructorla almadıkta state ile alıp logouta eşitledik
    const setSelectedConversation = useConversation((state) => state.setSelectedConversation);
    /*destructorla normalde böyle lullanıyoruz ama bu kodda stateli kullanımını göstermek istiyoruz
    const { logout } = useAuth();                           
    const { setSelectedConversation } = useConversation(); 
    */ 
    const { disconnectSocket } = useSocket(); //io bağlantısını kesmek için

    const handleLogout = async () => {
        setLoading(true);

        try {
            const res = await fetch('/api/auth/logout', { //backendde logout route'una istek atıyoruz
                method: 'POST',
            });

            if (res.ok) {
                toast.success("Logout successful");
            } else {
                // Server hatası var ama yine de client-side logout yapacağız
                toast.error("Server error, logged out locally");
            }
        } catch {
            // Network hatası (offline, timeout vb.) - yine de client-side logout yap
            toast.error("Network error, logged out locally");
        } finally {
            // Her durumda (başarılı/başarısız/error) cleanup yap
            disconnectSocket(); // Socket bağlantısını kes
            logout(); // Zustand store'u temizle
            setSelectedConversation(null); // Seçili conversation'ı temizle
            setLoading(false);
        }
    };

    return { loading, handleLogout };
};

export default useLogout;