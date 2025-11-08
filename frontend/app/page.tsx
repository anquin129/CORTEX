'use client';

import {useState} from "react";
import Chatbot from "@/components/Chatbot";
import PdfViewer from "@/components/PdfViewer";
import PaperNav from "@/components/PaperNav";
import NavBar from "@/components/NavBar";

export default function Home() {
    const [selectedPdf, setSelectedPdf] = useState(null);

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
                    <Chatbot />
                </div>

                {/* PDF Viewer */}
                <PdfViewer pdfUrl={selectedPdf} />

                {/* PaperNav Sidebar */}
                <div className="flex pt-4 h-screen">  {/* or p-4 if you want padding on all sides */}
                    <PaperNav
                        title="Paper Directory"
                        textColor="text-black"
                        onSelectPdf={setSelectedPdf}
                    />
                </div>
            </div>
        </div>
    );
}