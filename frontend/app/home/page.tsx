'use client';

import {useState} from "react";
import Chatbot from "@/components/Chatbot";
import PdfViewer from "@/components/PdfViewer";
import PaperNav from "@/components/PaperNav";

export default function Home() {
    const [selectedPdf, setSelectedPdf] = useState(null);

    return (
        <>
            <h1 className="text-center text-5xl font-bold mt-3">Cortex AI</h1>
            <div className="flex h-screen mt-3">
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
        </>
    );
}