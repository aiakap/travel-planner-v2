"use client";

import { Session } from "next-auth";
import Link from "next/link";
import Image from "next/image";
import { AuthStatusIndicator } from "@/components/auth-status-indicator";
import { UserMenu } from "@/components/user-menu";
import { TestMenu } from "@/components/test-menu";

interface NavbarProps {
  session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  return (
    <>
      <AuthStatusIndicator />
      <nav className="bg-white backdrop-blur-sm shadow-sm py-4 border-b border-slate-200 sticky top-0 z-50 transition-smooth">
        <div className="container mx-auto flex justify-between items-center px-6 lg:px-8">
        <Link href={"/"} className="hover:opacity-80 transition-smooth">
          <Image 
            src="/logo.png" 
            alt="Ntourage Travel" 
            width={120} 
            height={120}
            className="object-contain"
          />
        </Link>

        <div className="flex items-center space-x-6">
          {session ? (
            <>
              <Link
                href={"/experience-builder"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                Experience Builder
              </Link>
              <Link
                href={"/manage"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                Manage
              </Link>
              <Link
                href={"/globe"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                Globe
              </Link>
              <Link
                href={"/suggestions"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                Suggestions
              </Link>

              <TestMenu />
              <UserMenu />
            </>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-smooth hover:shadow-md"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
    </>
  );
}
