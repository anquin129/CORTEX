'use client';

import {useState} from "react";
import Chatbot from "@/components/Chatbot";
import PdfViewer from "@/components/PdfViewer";
import PaperNav from "@/components/PaperNav";
import NavBar from "@/components/NavBar";
import WelcomeScreen from "@/components/WelcomeScreen";


interface PdfItem {
    name: string;
    url: string;
    paperId?: string;
}

export default function Home() {
    const [showWelcome, setShowWelcome] = useState(true);
    const [selectedPdf, setSelectedPdf] = useState<string | null>(null);
    const [pdfList, setPdfList] = useState<PdfItem[]>([]);
    const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
    const [selectedPage, setSelectedPage] = useState<number>(1); // Add this

    const handleCitationClick = (filename: string, page: number) => {
        // citation gives "paperid.pdf" — convert to paper_id
        const paperId = filename.replace(".pdf", "");

        // find PDF by its paperId
        const pdf = pdfList.find(p => p.paperId === paperId);

        if (pdf) {
            setSelectedPdf(pdf.url);
            setSelectedPaperId(paperId);
            setSelectedPage(page); // Add this
            console.log('Opening PDF:', pdf.name, 'at page:', page);
        } else {
            console.warn('PDF not found for paper ID:', paperId, pdfList);
        }
    };



    if (showWelcome) {
        return <WelcomeScreen onComplete={() => setShowWelcome(false)} />;
    }

    return (
        <div className="flex flex-col h-screen">
            {/* NavBar at the top */}
            <div>
                <NavBar/>
            </div>

            {/* Main content area with horizontal flex */}
            <div className="flex flex-1 overflow-hidden">
                {/* Chatbot */}
                <div className="w-1/3 p-4 overflow-auto">
                    <Chatbot onCitationClick={handleCitationClick} />
                </div>

                {/* PDF Viewer */}
                <PdfViewer pdfUrl={selectedPdf} />

                {/* PaperNav Sidebar */}
                <div className="flex pt-4 h-screen">
                    <PaperNav
                        title="Paper Directory"
                        textColor="text-black"
                        onSelectPdf={(url) => {
                            setSelectedPdf(url);
                            const pdf = pdfList.find(p => p.url === url);
                            if (pdf) setSelectedPaperId(pdf.paperId!);
                        }}
                        selectedPdf={selectedPdf}
                        selectedPaperId={selectedPaperId}
                        onPdfListChange={setPdfList}

                    />
                </div>
            </div>
        </div>
    );
}