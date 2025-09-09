import SearchInput from './SearchInput';
import Conversations from './Conversations';
import LogoutButton from './LogoutButton';

const Sidebar = () => {
    return (
        <div className="h-full flex flex-col">
            <SearchInput />
            
            <div className='divider px-3'></div>
           
            <div className="flex-1 overflow-hidden">
                <Conversations />
            </div>

            <div className='divider px-3'></div>
            <LogoutButton />
        </div>
    );
}
export default Sidebar;