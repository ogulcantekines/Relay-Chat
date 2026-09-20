import { useEffect } from 'react';
import useUnread from '../zustand/useUnread';

// Sekme başlığında toplam okunmamış mesaj sayısını gösterir:
// başka sekmedeyken yeni mesaj geldiği fark edilsin diye.
const BASE_TITLE = 'Relay';

const useDocumentTitle = () => {
    const { counts } = useUnread();

    useEffect(() => {
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
        document.title = total > 0 ? `(${total}) ${BASE_TITLE}` : BASE_TITLE;
    }, [counts]);
};

export default useDocumentTitle;
