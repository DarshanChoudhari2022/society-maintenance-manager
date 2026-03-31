"use client";

import { Menu } from "lucide-react";
import NotificationCenter from "@/components/ui/NotificationCenter";
import ThemeToggle from "@/components/ui/ThemeToggle";

interface HeaderProps {
  userName?: string;
  userRole?: string;
  onMenuToggle?: () => void;
}

export default function Header({
  userName = "Admin",
  userRole = "chairman",
  onMenuToggle,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border px-4 lg:px-6">
      <div className="flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-surface transition-colors"
          >
            <Menu className="w-5 h-5 text-text-secondary" />
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-medium text-text-secondary">
              Society Maintenance Manager
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NotificationCenter />
          <div className="flex items-center gap-2.5 pl-3 border-l border-border">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-white text-xs font-semibold">
                {userName
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()}
              </span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-text-primary leading-tight">
                {userName}
              </p>
              <p className="text-xs text-text-secondary capitalize">
                {userRole}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
