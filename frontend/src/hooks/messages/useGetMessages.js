import {useEffect, useState} from 'react';
import useConversation from '../../zustand/useConversation';
import toast from 'react-hot-toast';


const useGetMessages = () => {
    const [loading, setLoading] = useState(false); //loading state
    const {messages,setMessages,selectedConversation} = useConversation();//zustanddan gerekli state ve fonksiyonları al

    useEffect(() => {

        const getMessages = async () => { //fonksiyon tanımı, çağrılmadıkça çalışmaz, 
        setLoading(true);
        try {
            const res = await fetch(`/api/messages/${selectedConversation._id}`, {//backenddeki messages route'una istek atıyoruz, ${selectedConversation._id} kısmı seçili konuşmanın id'si ve backendde yerine geçer
                method: 'GET', //get metodu
                headers: { // bu kısmda header bilgisi veriyoruz yani ne tür veri beklediğimizi söylüyoruz
                    'Content-Type': 'application/json'
                }
            });
            if (res.ok) {
                const data = await res.json(); // cevap ok ise js object formatına çevir ve data ya eşitle
                setMessages(data || []); // seçili konuşmanın mesajlarını set et zustanddaki setMessages fonksiyonu ile
            } else {
                throw new Error("Failed to fetch messages");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    if(selectedConversation?._id) { //null u da false alır ama gerek yok kontrol yapılıyor
        getMessages();
    }//uygulama açılırken ilk render oluyor ve konuşma seçili olmadığından
        //null oluyor. selectedConversation null olunca selectedConversation._id kısmı hata veriyor
        //bunun için güvenli erişim operatörü ? kullanıyoruz. selectedConversation null ise hata vermez
        //undefined olur ve if kontrolü false döner. selectedConversation null değilse ._id kısmına erişir konuşma seçildiyse mesajları yükler

    }, [selectedConversation?._id,setMessages]); //güvenli erişim operatörü ile selectedConversation null ise hata verme
    //burada ? kullanımı, selectedConversation null olduğunda bile hatasız çalışmasını sağlar aama bizim kod yapımızda
    //null olma durumu zaten kontrol ediliyor nochatselected kısmında eğer chat seçili ise yani selectedConversation null değilse mesajları yükle diyoruz
    //ondan gerek yok ama ek bir güvenlik katmanı olarak kullanılabilir

    return { loading, messages };
};

export default useGetMessages;