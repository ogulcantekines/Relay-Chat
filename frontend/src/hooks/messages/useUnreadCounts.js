import { useEffect } from 'react';
import useUnread from '../../zustand/useUnread';
import useAuth from '../../zustand/useAuth';

// Oturum açıldığında okunmamış sayıları bir kez sunucudan çeker.
// Sonraki değişiklikler socket olaylarıyla yerel olarak güncellenir.
const useUnreadCounts = () => {
    const { setCounts, reset } = useUnread();
    const authUser = useAuth((state) => state.authUser);

    useEffect(() => {
        if (!authUser) {
            reset();
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const res = await fetch("/api/messages/unread/counts");
                if (!res.ok) return;
                const data = await res.json();
                if (!cancelled) setCounts(data);
            } catch {
                // Sayaçlar kritik değil; hata durumunda sessizce geç
            }
        })();

        return () => { cancelled = true; };
    }, [authUser, setCounts, reset]);
};

export default useUnreadCounts;
