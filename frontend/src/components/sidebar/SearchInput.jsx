import { useState } from "react";
import { IoSearchSharp } from "react-icons/io5";
import useConversation from "../../zustand/useConversation";
import useGetConversations from "../../hooks/conversation/useGetConversations";
import toast from "react-hot-toast";

const SearchInput = () => {

    const [search, setSearch] = useState(""); // arama inputunun state'i
    const setSelectedConversation = useConversation((state) => state.setSelectedConversation); // seçilen conversation'ı ayarlamak için zustand store'dan fonksiyon
    // {selectedConversation, setSelectedConversation} = useConversation(); şeklinde de alınabilir. ama state ile almak zustand kullanımını gösterir.
    const { conversations } = useGetConversations(); // tüm conversation'ları getiren custom hook.

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!search) return;
        if (search.length < 3) {
            return toast.error("Search term must be at least 3 characters long");
        }

        //find fonksiyonu, conversations array'inde arama yapıyor. aradığı kritere uyan ilk elemanı döndürüyor.onu bulunca aramayı durduruyor.

        const conversation = conversations.find(conv => {
            return conv.fullName.toLowerCase().includes(search.toLowerCase());
        });
        //conv öcelikle 1.eleman için fullName'i alıyor,sonra onu küçük harfe çeviriyor.includes ise arama teriminin (search) bu
        //fullName'in içinde olup olmadığını kontrol ediyor. includes metodu boolean döndürüyor.true veya false.
        //eğer includes true dönerse find fonksiyonu o conversation'ı döndürüyor ve aramayı durduruyor.
        //eğer includes false dönerse find bir sonraki conversation'a geçiyor ve aynı işlemi tekrarlıyor.

        if (conversation) {
            setSelectedConversation(conversation);
            setSearch("");
        }
        else {
            toast.error("No conversation found");
        }
    };
    return (
        <form className="flex items-center gap-4 mt-5 mr-4 ml-2" onSubmit={handleSubmit}>
            <input
                type='text'
                placeholder='Ara...'
                className="input input-bordered rounded-full"
                value={search} // inputun değeri state'e bağlı
                onChange={(e) => setSearch(e.target.value)} // input değiştiğinde,yeni bir şey yazılıp veya silindiğinde state güncelleniyor
            />
            <button type="submit" className="btn btn-circle bg-[color:var(--accent)] text-white" >
                <IoSearchSharp className="w-6 h-6 outline-none" />
            </button>
        </form>
    );
}
export default SearchInput;