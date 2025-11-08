'use client';

import {useState} from "react";
import Chatbot from "@/components/Chatbot";
import PdfViewer from "@/components/PdfViewer";
import PaperNav from "@/components/PaperNav";

export default function Home() {
    const [selectedPdf, setSelectedPdf] = useState(null);

    return (
        <div className="flex h-screen mt-5">
            {/* Chatbot */}
            <div className="w-1/3 p-4 overflow-auto">
                <Chatbot />
            </div>

            {/* PDF Viewer */}
            <PdfViewer pdfUrl={selectedPdf} />

            {/* PaperNav Sidebar */}
            <PaperNav
                title="Paper Directory"
                textColor="text-black"
                onSelectPdf={setSelectedPdf}
            />
        </div>
    );
}