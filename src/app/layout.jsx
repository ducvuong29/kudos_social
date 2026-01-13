"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/layouts/LeftSidebar";
import RightSidebar from "@/components/layouts/RightSidebar";
import MobileBottomNav from "@/components/layouts/MobileBottomNav"; // <--- IMPORT MỚI
import { usePathname } from "next/navigation";
import { UserProvider } from "@/context/UserContext";
import { AppProvider } from "@/context/AppProvider";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();

  const isLoginPage =
    pathname === "/login" ||
    pathname === "/register" ||
    pathname === "/forgot-password" ||
    pathname === "/auth/auth-code-error";

  const isHomePage = pathname === "/";

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UserProvider>
          <AppProvider>
            {isLoginPage ? (
              <main className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
                {children}
              </main>
            ) : (
              <div className="flex h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-white transition-colors duration-300">
                {/* LeftSidebar: Ẩn trên mobile (hidden), hiện trên tablet trở lên (md:block) */}
                <div className="hidden md:block">
                  <LeftSidebar />
                </div>

                {/* Nội dung chính: Thêm padding bottom (pb-20) trên mobile để không bị BottomNav che mất */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50 relative transition-colors duration-300 pb-20 md:pb-0 scrollbar-hide">
                  {children}
                </main>

                {/* RightSidebar: Chỉ hiện ở Home và ẩn trên màn hình nhỏ/vừa (hidden xl:block) */}
                {isHomePage && (
                  <div className="hidden xl:block">
                    <RightSidebar />
                  </div>
                )}

                {/* Mobile Bottom Nav: Chỉ hiện trên mobile (md:hidden) */}
                <MobileBottomNav />
              </div>
            )}
          </AppProvider>
        </UserProvider>
      </body>
    </html>
  );
}
