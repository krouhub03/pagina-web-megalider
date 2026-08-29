import React from "react";
import PublicNavbar from "@/components/public/Navbar";
import PublicFooter from "@/components/public/Footer";
import { getSession } from "@/lib/auth/jwt";

export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    <div className="min-h-screen flex flex-col bg-[#F2F2F2] text-[#1a2e26] overflow-x-hidden font-sans pb-16 lg:pb-0">
      <PublicNavbar session={session} />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}

