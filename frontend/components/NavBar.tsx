'use client'

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { jwtDecode } from "jwt-decode" // npm install jwt-decode

interface DecodedToken {
    sub?: string
    exp?: number
    [key: string]: any
}

export default function NavBar() {
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    useEffect(() => {
        const token = localStorage.getItem("token") // or whatever key you use
        if (!token) {
            setIsLoggedIn(false)
            return
        }

        try {
            const decoded: DecodedToken = jwtDecode(token)
            // Check expiration (optional)
            if (decoded.exp && decoded.exp * 1000 > Date.now()) {
                setIsLoggedIn(true)
            } else {
                localStorage.removeItem("token")
                setIsLoggedIn(false)
            }
        } catch {
            setIsLoggedIn(false)
        }
    }, [])

    const handleSignOut = () => {
        localStorage.removeItem("token")
        setIsLoggedIn(false)
        window.location.href = "/" // optional redirect
    }

    return (
        <header className="w-full h-16 bg-white shadow-sm">
            <div className="flex h-full justify-between items-center px-6">
                {/* Left: Logo */}
                <div className="flex items-center">
                    <img src="/cortext.png" alt="Logo" className="h-16 w-auto" />
                </div>

                {/* Right: Auth Buttons */}
                <div className="flex items-center gap-3">
                    {isLoggedIn ? (
                        <Button
                            variant="outline"
                            className="text-sm font-medium"
                            onClick={handleSignOut}
                        >
                            Sign Out
                        </Button>
                    ) : (
                        <>
                            <Link href="/account/login">
                                <Button variant="outline" className="text-sm font-medium">
                                    Log In
                                </Button>
                            </Link>
                            <Link href="/account/signup">
                                <Button className="text-sm font-medium">
                                    Sign Up
                                </Button>
                            </Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
