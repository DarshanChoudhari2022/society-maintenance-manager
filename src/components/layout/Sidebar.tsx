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
  Megaphone,
  AlertTriangle,
  UserCheck,
  Car,
  CalendarCheck,
  Phone,
  FileText,
  Vote,
  FolderOpen
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members & Flats", icon: Users },
  { href: "/maintenance", label: "Maintenance", icon: Receipt },
  { href: "/notices", label: "Notice Board", icon: Megaphone },
  { href: "/complaints", label: "Complaints", icon: AlertTriangle },
  { href: "/reminders", label: "Reminders", icon: Bell },
  { divider: true },
  { href: "/visitors", label: "Visitors", icon: UserCheck },
  { href: "/parking", label: "Parking", icon: Car },
  { href: "/facilities", label: "Facilities", icon: CalendarCheck },
  { href: "/emergency", label: "Emergency", icon: Phone },
  { divider: true },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/meetings", label: "Meetings", icon: FileText },
  { href: "/polls", label: "Polls & Voting", icon: Vote },
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
  userRole?: string;
}

export default function Sidebar({
  societyName = "Sunshine Apartments",
  societyAddress = "Navi Mumbai",
  isOpen = false,
  onClose,
  userRole = "member",
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
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-[100dvh] pb-safe w-64 bg-white border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:static lg:z-auto`}
      >
        {/* Society header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary-light flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h2 className="font-semibold text-sm text-text-primary truncate">
                  {societyName}
                </h2>
                <p className="text-xs text-text-secondary truncate">{societyAddress}</p>
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
          <div className="space-y-0.5">
            {navItems.map((item, i) => {
              if ("divider" in item) {
                return (
                  <div key={i} className="my-2 border-t border-border" />
                );
              }
              
              // Role-based filtering
              if (userRole === "member") {
                const hiddenForMembers = [
                  "/members",
                  "/reminders",
                  "/reports",
                  "/expenses"
                ];
                if (hiddenForMembers.includes(item.href)) {
                  return null;
                }
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
        <div className="p-3 border-t border-border mt-auto">
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
