"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";

interface UserSession {
  name: string;
  role: string;
  societyName?: string;
  societyAddress?: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<UserSession>({
    name: "",
    role: "",
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) {
          setUser({
            name: data.user.name,
            role: data.user.role,
            societyName: data.user.society?.name,
            societyAddress: data.user.society?.city,
          });
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar
        societyName={user.societyName}
        societyAddress={user.societyAddress}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        userRole={user.role}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userName={user.name}
          userRole={user.role}
          onMenuToggle={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 pb-20 lg:pb-6">{children}</main>
      </div>
      <BottomNav userRole={user.role} />
    </div>
  );
}
