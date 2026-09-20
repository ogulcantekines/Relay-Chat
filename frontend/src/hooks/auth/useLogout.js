import { useState } from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../zustand/useAuth';
import { notifySessionChange } from '../../utils/sessionEvents';

const useLogout = () => {
    const [loading, setLoading] = useState(false);
    const handleLogout = async () => {
        if (loading) return;
        setLoading(true);
        try {
            const response = await fetch('/api/auth/logout', { method: 'POST' });
            if (!response.ok) throw new Error();
            useAuth.getState().logout();
            notifySessionChange();
            toast.success('Çıkış yapıldı');
        } catch {
            toast.error('Çıkış tamamlanamadı. Bağlantını kontrol edip tekrar dene.');
        } finally {
            setLoading(false);
        }
    };
    return { loading, handleLogout };
};
export default useLogout;
