"use client";

import { AutoLogout } from "@/components/auto-logout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AutoLogout timeoutMinutes={30} />
      {children}
    </>
  );
}
