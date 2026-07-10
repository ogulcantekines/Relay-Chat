import Sidebar from "../../components/sidebar/Sidebar";
import MessageContainer from "../../components/messages/MessageContainer";

const Home = () => {
	return (
		<div className='flex sm:h-[450px] md:h-[550px] rounded-lg overflow-hidden bg-gray-400 bg-clip-padding backdrop-filter backdrop-blur-lg bg-opacity-0'>
			<div className="w-80 flex-shrink-0"> {/* Sabit genişlik: 320px (w-80), içerik değişse bile genişlik sabit kalır */}
				<Sidebar />
			</div>
			<MessageContainer />
		</div>
	);
};
export default Home;
