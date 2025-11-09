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
        <header className="w-full h-16 bg-white shadow-sm"> {/* fixed height */}
            <div className="flex h-full justify-between items-center px-6"> {/* fill height; no py */}
                <div className="flex-1 flex items-center">
                    <img src="/cortext.png" alt="Logo" className="h-16 w-auto" />
                </div>

                <div className="flex-1 flex justify-end">
                    <MdAccountCircle className="w-8 h-8 text-gray-700 cursor-pointer hover:text-gray-900" />
                </div>
            </div>
        </header>
    )
}