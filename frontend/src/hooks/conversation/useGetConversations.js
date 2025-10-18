import {useEffect, useState} from 'react';
import toast from 'react-hot-toast';
import useAuth from '../../zustand/useAuth';

const useGetConversations = () => {
    const[loading, setLoading] = useState(false);
    const authUser = useAuth((state) => state.authUser);
    const [conversations, setConversations] = useState([]);

    useEffect(() => {
        const getConversations = async () => {
            if(!authUser) return;
            setLoading(true);
            
            try {
                const res = await fetch('/api/users', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });

                if (!res.ok) {
                    throw new Error("Failed to fetch conversations");
                }

                const data = await res.json();//res.json metodu, fetch API'si ile yapılan bir HTTP isteğinin yanıtını JSON formatında ayrıştırmak için kullanılır.
                //res.json() metodu bir Promise döner, bu yüzden await ile beklenir.
                //data artık JS object/array
                setConversations(data);

            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getConversations();
    }, [authUser]);

    return { loading, conversations };
};

            
export default useGetConversations;
