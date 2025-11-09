import type { Metadata } from "next";
import {
    Montserrat,
    Roboto,
    Roboto_Condensed,
} from "next/font/google";
import "./globals.css";

const montserrat = Montserrat({
    subsets: ["latin"],
    variable: "--font-montserrat",
    display: "swap",
});

const roboto = Roboto({
    subsets: ["latin"],
    variable: "--font-roboto",
    display: "swap",
});

const robotoCondensed = Roboto_Condensed({
    subsets: ["latin"],
    variable: "--font-roboto-condensed",
    display: "swap",
});

export const metadata: Metadata = {
    title: "My App",
    description: "Using Montserrat, Roboto, and Roboto Condensed fonts",
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className={`${montserrat.className} ${roboto.className} ${robotoCondensed.className}`}
        >
        <body className="antialiased">{children}</body>
        </html>
    );
}
