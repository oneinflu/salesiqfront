"use client";

import Link from "next/link";
import { Button } from "@/components/base/buttons/button";
import { SocialButton } from "@/components/base/buttons/social-button";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";

export default function LoginPage() {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 rounded-xl bg-primary p-8 shadow-sm ring-1 ring-border-primary sm:p-10">
                <div className="flex flex-col items-center justify-center text-center">
                    <UntitledLogo className="h-10 w-auto" />
                    <h2 className="mt-6 text-display-xs font-semibold tracking-tight text-primary">Log in to your account</h2>
                    <p className="mt-2 text-md text-tertiary">Welcome back! Please enter your details.</p>
                </div>

                <form className="mt-8 space-y-6" action="#" method="POST">
                    <div className="space-y-5">
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            isRequired
                            label="Email"
                            placeholder="Enter your email"
                            size="md"
                        />

                        <Input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            isRequired
                            label="Password"
                            placeholder="••••••••"
                            size="md"
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <Checkbox label="Remember for 30 days" size="sm" />
                        <div className="text-sm">
                            <Link href="#" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
                                Forgot password?
                            </Link>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <Button type="submit" size="lg" color="primary" className="w-full">
                            Sign in
                        </Button>

                    
                    </div>
                </form>

                <p className="mt-6 text-center text-sm text-tertiary">
                    Don&apos;t have an account?{" "}
                    <Link href="#" className="font-semibold text-brand-secondary hover:text-brand-secondary_hover">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}
