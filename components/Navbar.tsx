"use client";

import { login, logout } from "@/lib/auth-actions";
import { Session } from "next-auth";
import Link from "next/link";

interface NavbarProps {
  session: Session | null;
}

export default function Navbar({ session }: NavbarProps) {
  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm py-4 border-b border-slate-100 sticky top-0 z-50 transition-smooth">
      <div className="container mx-auto flex justify-between items-center px-6 lg:px-8">
        <Link href={"/"} className="flex flex-col hover:opacity-80 transition-smooth">
          <span className="text-2xl font-display tracking-wide text-slate-900">
            Bespoke
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500 -mt-1">
            Experiences
          </span>
        </Link>

        <div className="flex items-center space-x-6">
          {session ? (
            <>
              <Link
                href={"/trips"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                My Trips
              </Link>
              <Link
                href={"/chat"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                AI Chat
              </Link>
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
                href={"/profile"}
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-smooth"
              >
                Profile
              </Link>

              <button
                className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-smooth hover:shadow-md"
                onClick={logout}
              >
                Sign Out
              </button>
            </>
          ) : (
            <button
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium bg-slate-900 hover:bg-slate-800 text-white rounded-lg transition-smooth hover:shadow-md"
              onClick={login}
            >
              <svg
                className="w-5 h-5"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.09 1.83 1.24 1.83 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.05.14 3.01.41 2.29-1.55 3.29-1.23 3.29-1.23.66 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.93.43.37.81 1.10.81 2.23 0 1.61-.02 2.91-.02 3.31 0 .32.22.69.83.57C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
              </svg>
              Sign In
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
