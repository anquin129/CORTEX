'use client';

import {useState} from "react";
import {SidebarLeftIcon} from "@/components/ui/icons/akar-icons-sidebar-left";
import {Input} from "@/components/ui/input";
import {Label} from "@/components/ui/label";

interface PaperNavProps {
    onSelectPdf: (pdfUrl: string) => void;
    selectedPdf: string | null;
    title?: string;
    textColor?: string;
}

interface PdfItem {
    name: string;
    url: string;
}

const initialPdfs: PdfItem[] = [
    { name: 'Research Paper 1', url: '/pdfs/paper1.pdf' },
    { name: 'Research Paper 2', url: '/pdfs/paper2.pdf' },
    { name: 'Research Paper 3', url: '/pdfs/paper3.pdf' },
];

export default function PaperNav({
                                     onSelectPdf,
                                     selectedPdf,
                                     title = 'PAPER DIRECTORY',
                                     textColor = 'text-white'
                                 }: PaperNavProps) {
    const [isOpen, setIsOpen] = useState(true);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [pdfList, setPdfList] = useState<PdfItem[]>(initialPdfs);

    const handlePdfClick = (pdf: PdfItem, index: number) => {
        setSelectedIndex(index);
        onSelectPdf(pdf.url);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file && file.type === 'application/pdf') {
            // Create a URL for the uploaded file
            const fileUrl = URL.createObjectURL(file);

            // Add the new PDF to the list
            const newPdf: PdfItem = {
                name: file.name,
                url: fileUrl
            };

            setPdfList([...pdfList, newPdf]);

            // Optionally, auto-select the newly uploaded PDF
            setSelectedIndex(pdfList.length);
            onSelectPdf(fileUrl);

            // Reset the input
            event.target.value = '';
        } else {
            alert('Please upload a valid PDF file');
        }
    };

    return (
        <aside
            className={`flex flex-col border-l border-gray-200 transition-all duration-300 ${
                isOpen ? 'w-64' : 'w-16'
            }`}
        >
            {/* Header */}
            <div className={`flex items-center justify-between bg-maroon h-12 px-3 font-bold text-lg ${textColor}`}>
                {isOpen && <span className="whitespace-nowrap overflow-hidden">{title}</span>}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="focus:outline-none hover:opacity-80 transition-opacity flex-shrink-0"
                    title={isOpen ? 'Collapse' : 'Expand'}
                >
                    <SidebarLeftIcon />
                </button>
            </div>
            {/* List */}
            {isOpen && (
                <ul className="m-0 p-0 flex-1 overflow-y-auto">
                    {pdfList.map((pdf, index) => (
                        <li
                            key={index}
                            onClick={() => handlePdfClick(pdf, index)}
                            className={`px-3 py-2 cursor-pointer list-none transition-colors ${
                                selectedIndex === index
                                    ? 'bg-blue-100 border-l-4 border-blue-500'
                                    : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-red-500">📄</span>
                                <span className="text-sm truncate">{pdf.name}</span>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
            {/* File Upload - Moved to bottom */}
            {isOpen && (
                <div className="p-3 border-t border-gray-200">
                    <Input
                        id="picture"
                        type="file"
                        accept=".pdf"
                        onChange={handleFileUpload}
                        className="cursor-pointer bg-[#FCFAF6]"
                    />
                </div>
            )}
        </aside>
    );
}