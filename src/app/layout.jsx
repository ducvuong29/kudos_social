"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/layouts/LeftSidebar";
import RightSidebar from "@/components/layouts/RightSidebar";
import { usePathname } from 'next/navigation';
import { UserProvider } from "@/context/UserContext"; 
import { AppProvider } from '@/context/AppProvider'; 

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Logic hiển thị Sidebar
  // Lưu ý: Nếu có thêm trang confirm mail hay 404, nhớ thêm vào đây
  const isLoginPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password' || pathname === '/auth/auth-code-error';
  
  const isHomePage = pathname === '/'; 
  // RightSidebar chỉ hiện ở trang chủ

  return (
    // 1. QUAN TRỌNG: Thêm suppressHydrationWarning để tránh lỗi warning của next-themes
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <UserProvider>
          <AppProvider>
          
          {isLoginPage ? (
            // Layout cho trang Login
            // THÊM: dark:bg-slate-900 để trang login cũng tối khi đổi theme
            <main className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
              {children}
            </main>
          ) : (
            // Layout chính cho App
            // THÊM: dark:bg-slate-900 dark:text-white cho container chính
            <div className="flex h-screen bg-gray-50 dark:bg-slate-900 font-sans text-gray-900 dark:text-white transition-colors duration-300">
              {/* LeftSidebar */}
              <LeftSidebar />

              {/* Nội dung chính */}
              {/* THÊM: dark:bg-slate-900/50 cho nền nội dung */}
              <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-slate-900/50 relative transition-colors duration-300">
                  {children}
              </main>

              {/* RightSidebar */}
              {isHomePage && <RightSidebar />}
            </div>
          )}
          
          </AppProvider>
        </UserProvider>
      </body>
    </html>
  );
}