'use client';
import 'react-pdf-highlighter/dist/style.css';


import { PdfLoader, PdfHighlighter } from "react-pdf-highlighter";

interface PdfViewerProps {
    pdfUrl: string | null;
}

export default function PdfViewer({ pdfUrl }: PdfViewerProps) {
    if (!pdfUrl) {
        return (
            <div className="flex-1 flex items-center justify-center bg-gray-50 border-x border-gray-200">
                <div className="text-center text-gray-400">
                    <svg
                        className="mx-auto h-16 w-16 mb-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                    </svg>
                    <p className="text-lg font-medium">No PDF Selected</p>
                    <p className="text-sm mt-2">Select a paper from the sidebar to view</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col p-4">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between rounded-md">
                <h3 className="text-sm font-semibold text-gray-700">PDF Viewer</h3>
                <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1 bg-[#5c050c] text-white rounded hover:bg-[#8f0913] transition-colors"
                >
                    Open in New Tab
                </a>
            </div>

            {/* PDF Container */}
            <div className="flex-1 relative">
                <div className="absolute inset-0">
                    <PdfLoader url={pdfUrl}>
                        {(pdfDocument) => (
                            <div className="absolute inset-0">
                                <PdfHighlighter
                                    pdfDocument={pdfDocument}
                                    enableAreaSelection={false}
                                    highlights={[]}
                                    onSelectionFinished={() => {}}
                                />
                            </div>
                        )}
                    </PdfLoader>
                </div>
            </div>
        </div>
    );
}
