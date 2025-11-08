// page.tsx
import Chatbot from '@/components/Chatbot';
import PaperNav from '@/components/PaperNav';

export default function Home() {
    return (
        <div className="flex min-h-screen">
            {/* Chatbot takes remaining space */}
            <div className="flex-1 p-4">
                <Chatbot />
            </div>
            {/* PaperNav fixed to right edge */}
            <PaperNav title="Paper Directory" textColor="text-black "/>
        </div>
    );
}