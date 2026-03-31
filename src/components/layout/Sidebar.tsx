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
  FolderOpen,
  History,
  Search,
  Wrench,
} from "lucide-react";
import { useState } from "react";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  roles?: string[]; // if specified, only these roles see it
}

interface NavDivider {
  divider: true;
}

type SidebarItem = NavItem | NavDivider;

const navItems: SidebarItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members & Flats", icon: Users, roles: ["chairman", "secretary", "treasurer"] },
  { href: "/maintenance", label: "Maintenance", icon: Receipt, roles: ["chairman", "secretary", "treasurer"] },
  { href: "/my-bills", label: "My Bills", icon: Receipt, roles: ["member"] },
  { href: "/notices", label: "Notice Board", icon: Megaphone },
  { href: "/complaints", label: "Complaints", icon: AlertTriangle },
  { href: "/reminders", label: "Reminders", icon: Bell, roles: ["chairman", "secretary", "treasurer"] },
  { divider: true },
  { href: "/visitors", label: "Visitors", icon: UserCheck, roles: ["chairman", "secretary", "treasurer", "security"] },
  { href: "/my-visitors", label: "Expected Visitors", icon: UserCheck, roles: ["member"] },
  { href: "/parking", label: "Parking", icon: Car },
  { href: "/facilities", label: "Facilities", icon: CalendarCheck },
  { href: "/emergency", label: "Emergency", icon: Phone },
  { divider: true },
  { href: "/documents", label: "Documents", icon: FolderOpen },
  { href: "/meetings", label: "Meetings", icon: FileText },
  { href: "/polls", label: "Polls & Voting", icon: Vote },
  { href: "/reports", label: "Reports", icon: BarChart3, roles: ["chairman", "secretary", "treasurer"] },
  { href: "/expenses", label: "Expenses", icon: Wallet, roles: ["chairman", "treasurer"] },
  { href: "/vendors", label: "Vendors & AMC", icon: Wrench, roles: ["chairman", "secretary", "treasurer"] },
  { divider: true },
  { href: "/activity-log", label: "Activity Log", icon: History, roles: ["chairman", "secretary", "treasurer"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["chairman"] },
];

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
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const filteredItems = navItems.filter((item) => {
    if ("divider" in item) return true;
    // Role-based filtering
    if (item.roles && !item.roles.includes(userRole)) return false;
    // Search filtering
    if (searchQuery && !item.label.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Remove consecutive dividers and leading/trailing dividers
  const cleanedItems = filteredItems.filter((item, i) => {
    if (!("divider" in item)) return true;
    if (i === 0 || i === filteredItems.length - 1) return false;
    const prevItem = filteredItems[i - 1];
    return !("divider" in prevItem);
  });

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
                <p className="text-xs text-text-secondary truncate">
                  {societyAddress}
                </p>
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

        {/* Search */}
        <div className="px-3 pt-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-secondary" />
            <input
              type="text"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-xs border border-border rounded-lg focus:border-primary-light focus:ring-1 focus:ring-primary-light/20 outline-none transition-all"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-0.5">
            {cleanedItems.map((item, i) => {
              if ("divider" in item) {
                return (
                  <div key={`divider-${i}`} className="my-2 border-t border-border" />
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

        {/* User info + Logout */}
        <div className="p-3 border-t border-border mt-auto">
          <div className="flex items-center gap-2 px-3 py-2 mb-1">
            <span className="text-[10px] uppercase font-semibold text-text-secondary tracking-wider">
              {userRole}
            </span>
          </div>
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
