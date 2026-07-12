import Sidebar from "../../components/sidebar/Sidebar";
import MessageContainer from "../../components/messages/MessageContainer";
import useConversation from "../../zustand/useConversation";

const Home = () => {
	const { selectedConversation } = useConversation();

	return (
		// Masaüstünde iki sütun; dar ekranda tek sütun: sohbet seçiliyse sohbet,
		// değilse liste görünür (mobil mesajlaşma uygulamalarındaki davranış).
		<div
			className='surface w-full h-full sm:h-[min(92vh,900px)] sm:max-w-[1400px] sm:rounded-2xl overflow-hidden flex shadow-2xl'
		>
			<div
				className={`${selectedConversation ? 'hidden' : 'flex'} md:flex w-full md:w-[340px] lg:w-[380px] flex-shrink-0 flex-col`}
				style={{ borderRight: '1px solid var(--border-subtle)' }}
			>
				<Sidebar />
			</div>

			<div className={`${selectedConversation ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>
				<MessageContainer />
			</div>
		</div>
	);
};
export default Home;
