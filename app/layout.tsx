import type { Metadata } from "next";
import { Playfair_Display, Outfit, Inter } from "next/font/google";
import "./globals.css";
import NavigationMain from "@/components/navigation-main";
import { auth } from "@/auth";
import { getMinimalUserContext } from "@/lib/actions/user-context";
import { headers } from "next/headers";

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  display: "swap",
});

const outfit = Outfit({
  variable: "--font-adventure",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ntourage Travel | Experiences Crafted for You",
  description: "Personalized travel experiences curated by experts and shaped by your community",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();
  const userContext = session?.user?.id ? await getMinimalUserContext(session.user.id) : null;
  
  // Get the current pathname to conditionally render navigation
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";
  const isAdminRoute = pathname.startsWith("/admin");

  return (
    <html lang="en">
      <body
        className={`${playfair.variable} ${outfit.variable} ${inter.variable} antialiased`}
      >
        {!isAdminRoute && <NavigationMain session={session} userContext={userContext} />}
        {children}
      </body>
    </html>
  );
}
