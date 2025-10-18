import SearchInput from './SearchInput';
import Conversations from './Conversations';
import LogoutButton from './LogoutButton';
import useSocket from '../../zustand/useSocket';

const Sidebar = () => {

    const { onlineUsers } = useSocket(); // Online kullanıcıları almak için useSocket kullanılıyor, socket.on("getOnlineUsers") ile aldığımız arrayi onlineUsers[] arrayine atamıştık ve burada onu çağırıyoruz.
    
    return (
        <div className="h-full flex flex-col">
            <SearchInput /> {/* Arama çubuğu bileşeni */}
            
            <div className="px-3 py-2">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{onlineUsers.length - 1} online</span> {/* Kendimiz de online listede olacağımız için -1 yapıyoruz */}
                </div>
            </div>
            
            <div className='divider px-3'></div>
           
            <div className="flex-1 overflow-hidden">
                <Conversations /> {/* Konuşulan kişilerin sohbetleri */}
            </div>

            <div className='divider px-3'></div>
            <LogoutButton /> {/* Çıkış butonu */}
        </div>
    );
}
export default Sidebar;