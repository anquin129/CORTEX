'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import toast from "react-hot-toast";

// Validation schema for Cortex
const formSchema = z.object({
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
});

export default function SignupPage() {
    const router = useRouter();
    const [formValues, setFormValues] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState<{ [key: string]: string }>({});

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormValues({ ...formValues, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = formSchema.safeParse(formValues);

        if (!result.success) {
            const fieldErrors: { [key: string]: string } = {};

            result.error.issues.forEach((err) => {
                if (err.path[0]) {
                    fieldErrors[err.path[0] as string] = err.message;
                }
            });

            setErrors(fieldErrors);
            return;
        }

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'https://cortex-production-8481.up.railway.app'}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(result.data),
            });

            if (!response.ok) {
                const msg = await response.text();
                console.error(msg);
                toast.error('Failed to create user');
                return;
            }

            toast.success('Account created successfully');
            router.push('/account/login');
        } catch (error) {
            console.error(error);
            toast.error('An error occurred');
        }
    };

    return (
        <div>
            <div className="flex items-center justify-center min-h-screen p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-center text-2xl font-semibold">Create Your Account</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Email */}
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    value={formValues.email}
                                    onChange={handleChange}
                                />
                                {errors.email && (
                                    <p className="text-sm text-red-600">{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div className="space-y-1">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formValues.password}
                                    onChange={handleChange}
                                />
                                {errors.password && (
                                    <p className="text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            <Button type="submit" className="w-full">
                                Sign Up
                            </Button>

                            <div className="mt-4 text-center text-sm">
                                Already have an account?{' '}
                                <a href="/account/login" className="underline underline-offset-4">
                                    Log in
                                </a>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
