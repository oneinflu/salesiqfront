"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/base/buttons/button";
import { Input } from "@/components/base/input/input";
import { UntitledLogo } from "@/components/foundations/logo/untitledui-logo";
import { authService } from "@/services/auth-service";

export default function AdminRegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      await authService.register(name, email, password);
      setSuccess("Admin created. You can now log in.");
      setTimeout(() => router.push("/login"), 800);
    } catch (err: any) {
      setError(err?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-secondary px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-primary p-8 shadow-sm ring-1 ring-border-primary sm:p-10">
        <div className="flex flex-col items-center justify-center text-center">
          <UntitledLogo className="h-10 w-auto" />
          <h2 className="mt-6 text-display-xs font-semibold tracking-tight text-primary">Create admin</h2>
          <p className="mt-2 text-md text-tertiary">Set up your first admin account.</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-5">
            <Input
              id="name"
              name="name"
              isRequired
              label="Name"
              placeholder="Admin name"
              size="md"
              value={name}
              onChange={setName}
            />
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              isRequired
              label="Email"
              placeholder="admin@example.com"
              size="md"
              value={email}
              onChange={setEmail}
            />
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              isRequired
              label="Password"
              placeholder="••••••••"
              size="md"
              value={password}
              onChange={setPassword}
            />
          </div>

          <div className="space-y-4">
            <Button type="submit" size="lg" color="primary" className="w-full" isDisabled={loading}>
              Register
            </Button>
            {error && <p className="text-sm text-error_secondary">{error}</p>}
            {success && <p className="text-sm text-quaternary">{success}</p>}
          </div>
        </form>
      </div>
    </div>
  );
}
