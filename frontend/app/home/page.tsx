import Chatbot from '@/components/Chatbot';

export default function Home() {
    return (
        <div className="p-4 flex justify-start">

            {/* Fixed height chatbot */}
            <div className="w-[70%] min-h-screen">
                <Chatbot />
            </div>

            {/* Or full viewport height */}
            {/* <div className="h-screen">
        <Chatbot />
      </div> */}
        </div>
    );
}