"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Receipt, 
  AlertTriangle, 
  UserCheck, 
  Settings,
  Bell
} from "lucide-react";
import { hasPermission } from "@/lib/rbac";

interface BottomNavProps {
  userRole?: string;
}

export default function BottomNav({ userRole = "member" }: BottomNavProps) {
  const pathname = usePathname();

  // Define mobile nav items for quick access
  const allItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Home" },
    { href: userRole === "member" ? "/my-bills" : "/maintenance", icon: Receipt, label: "Bills" },
    { href: "/complaints", icon: AlertTriangle, label: "Tickets" },
    { href: userRole === "member" ? "/my-visitors" : "/visitors", icon: UserCheck, label: "Visitors" },
    { href: "/reminders", icon: Bell, label: "Alerts", roles: ["chairman", "secretary", "treasurer"] },
    { href: "/settings", icon: Settings, label: "Settings", roles: ["chairman"] },
  ];

  const visibleItems = allItems.filter(item => 
    !item.roles || item.roles.includes(userRole)
  ).slice(0, 5); // Max 5 items for bottom nav

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-border pb-safe transition-transform duration-300 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] pt-1 dark:bg-[#1A1F26]">
      <div className="flex justify-around items-center h-[60px] px-2 max-w-md mx-auto relative">
        {visibleItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 h-full gap-1 transition-all ${
                isActive ? "text-primary scale-105" : "text-text-secondary hover:text-text-primary"
              }`}
            >
              <item.icon className={`w-5 h-5 transition-all ${isActive ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
              <span className={`text-[10px] leading-none transition-all ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
