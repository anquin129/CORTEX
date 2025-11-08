import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
} from "@/components/ui/navigation-menu"
import Image from "next/image"
import { MdAccountCircle } from "react-icons/md";

export default function NavBar() {
    return (
        <header className="w-full bg-white shadow-sm">
            <div className="flex justify-between items-center px-6 py-4">
                <div className="flex-1">
                    <h1 className="text-xl font-semibold text-gray-700">CORTEX</h1>
                </div>

                <div className="flex-1 flex justify-center">
                    <img src="/logo.png" alt="Logo" className="w-15" />
                </div>

                <div className="flex-1 flex justify-end">
                    <MdAccountCircle className="w-8 h-8 text-gray-700 cursor-pointer hover:text-gray-900" />
                </div>
            </div>
        </header>


    );
}