"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PublicNavbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-[#A7D9BD]/40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12  p-1 flex items-center justify-center ">
            <Image
              src="/logo_megalider.webp"
              alt="Cigarrería Megalider"
              width={48}
              height={48}
              className="w-10 h-10 object-contain drop-shadow-sm"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg sm:text-xl text-[#067335] leading-tight tracking-tight">
              Cigarrería Megalider
            </span>
          </div>
        </Link>

        {/* Actions */}
        <div className="flex items-center gap-3">

          <Link href="/login">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Lock className="w-3.5 h-3.5 text-[#53A677]" />}
              className="hidden sm:inline-flex text-xs text-slate-700 hover:text-[#067335]"
            >

            </Button>
          </Link>

        </div>
      </div>
    </header>
  );
}
