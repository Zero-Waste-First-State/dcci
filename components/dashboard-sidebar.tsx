"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface SidebarProps {
  user?: {
    name?: string;
    email?: string;
  };
}

export function DashboardSidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleBackToWebsite = async () => {
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Logout error:", error);
      // Still navigate even if logout fails
      router.push("/");
    }
  };
  
  const navigation = [
    { name: "Home", href: "/dashboard", icon: "🌱" },
    { name: "Logs", href: "/dashboard/log", icon: "🗂️" },
    { name: "Reports", href: "/dashboard/reports", icon: "📄" },
    { name: "Settings", href: "/dashboard/settings", icon: "⚙️" },
  ];

  const externalLinks = [
    { name: "Back to Website", href: "/", icon: "🌐" },
  ];

  return (
    <div className="w-64 bg-earthyGreen border-r border-blue-500 min-h-screen">
      {/* Logo/Header */}
      <div className="p-4 border-b border-earthyGreen">
        <div className="w-8 h-8 mb-2 rounded overflow-hidden">
          <Image 
            src="/pfd-logo.jpg" 
            alt="DCCI Logo" 
            width={32} 
            height={32}
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-white font-semibold">DCCI Dashboard</h2>
      </div>

      {/* Navigation */}
      <nav className="mt-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-earthyBlue text-white border-r-2 border-blue-500"
                  : "text-white hover:bg-gray-700 hover:text-white"
              }`}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* External Links */}
      <div className="mt-8 border-t border-earthyGreen pt-4">
        <div className="px-4 mb-2">
          <h3 className="text-xs font-semibold text-white uppercase tracking-wider">External</h3>
        </div>
        {externalLinks.map((item) => (
          item.name === "Back to Website" ? (
            <button
              key={item.name}
              onClick={handleBackToWebsite}
              className="flex items-center px-4 py-3 text-sm font-medium text-white hover:bg-gray-700 hover:text-white transition-colors w-full text-left"
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </button>
          ) : (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              {item.name}
            </Link>
          )
        ))}
      </div>

    </div>
  );
}
