"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Receipt,
  Bell,
  BarChart3,
  Wallet,
  Settings,
  LogOut,
  Building2,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members & Flats", icon: Users },
  { href: "/maintenance", label: "Maintenance", icon: Receipt },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { divider: true },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/expenses", label: "Expenses", icon: Wallet },
  { divider: true },
  { href: "/settings", label: "Settings", icon: Settings },
] as const;

interface SidebarProps {
  societyName?: string;
  societyAddress?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({
  societyName = "Sunshine Apartments",
  societyAddress = "Navi Mumbai",
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-white border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto`}
      >
        {/* Society header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-semibold text-sm text-text-primary leading-tight">
                  {societyName}
                </h2>
                <p className="text-xs text-text-secondary">{societyAddress}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden p-1 rounded hover:bg-surface"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {navItems.map((item, i) => {
              if ("divider" in item) {
                return (
                  <div key={i} className="my-3 border-t border-border" />
                );
              }
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`sidebar-link ${isActive ? "active" : ""}`}
                  onClick={onClose}
                >
                  <Icon className="w-[18px] h-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-border">
          <button
            onClick={handleLogout}
            className="sidebar-link w-full text-danger hover:bg-danger-bg"
          >
            <LogOut className="w-[18px] h-[18px]" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}
