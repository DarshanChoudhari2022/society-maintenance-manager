"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { Building2, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Welcome back!");
        router.push("/dashboard");
      } else {
        toast.error(data.error || "Invalid credentials");
      }
    } catch {
      toast.error("Something went wrong — please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">
            Society Maintenance
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Smart & Transparent Maintenance Collection
          </p>
        </div>

        {/* Login form */}
        <div className="card">
          <h2 className="text-lg font-semibold text-text-primary mb-6">
            Sign in to your account
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="label">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                className="input"
                placeholder="admin@sunshine.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  className="input pr-10"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary w-full btn-lg mt-2"
            >
              {loading ? (
                <div className="spinner !w-5 !h-5 !border-white/30 !border-t-white" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-text-secondary">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="text-primary font-medium hover:underline"
              >
                Register
              </Link>
            </p>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-3 bg-warning-bg rounded-lg border border-warning/20">
          <p className="text-xs font-medium text-warning-text mb-1">
            Demo Credentials
          </p>
          <p className="text-xs text-warning-text/80">
            Email: admin@sunshine.com | Password: admin123
          </p>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-text-secondary">
            Powered by{" "}
            <a
              href="https://www.buzyhub.in"
              target="_blank"
              className="text-primary hover:underline"
            >
              Buzyhub.in
            </a>{" "}
            | Pramod Ranpise
          </p>
        </div>
      </div>
    </div>
  );
}
