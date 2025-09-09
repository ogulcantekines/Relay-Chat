
const Conversation = () => {
    return (

      <>
        <div className="flex gap-2 items-center hover:bg-sky-500 rounded p-2 py-4 cursor-pointer ">
            <div className="avatar online">
              <div className="w-12 rounded-full">
                <img src="https://img.daisyui.com/images/stock/photo-1534528741775-53994a69daeb.webp" />
              </div>
            </div>

            <div className="flex flex-col flex-1">
              <div className="font-semibold">John Doe</div>
              <div className="text-sm opacity-50">Last message...</div>
            </div>

        </div>
      </>
    );
}
export default Conversation;