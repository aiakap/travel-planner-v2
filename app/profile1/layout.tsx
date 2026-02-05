import { Inter } from "next/font/google";
import "./styles/profile1-theme.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export default function Profile1Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className={`${inter.variable} profile1-theme`}>{children}</div>;
}
