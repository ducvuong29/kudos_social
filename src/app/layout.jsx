"use client"

import { Inter } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/layouts/LeftSidebar";
import RightSidebar from "@/components/layouts/RightSidebar";
import { usePathname } from 'next/navigation';
import { UserProvider } from "@/context/UserContext"; // Đảm bảo đường dẫn đúng
const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({ children }) {
  const pathname = usePathname();

  // Logic hiển thị Sidebar
  const isLoginPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  // Các trang khác ngoài login thì hiện sidebar (tùy chỉnh thêm nếu có trang khác)
  
  const isHomePage = pathname === '/'; 
  // RightSidebar chỉ hiện ở trang chủ

  return (
    <html lang="en">
      <body className={inter.className}>
        {/* Bọc UserProvider ở ngoài cùng để toàn bộ app (kể cả Login hay Main) 
            đều truy cập được data user mà không cần fetch lại.
        */}
        
        <UserProvider>
         
          {isLoginPage ? (
            // Layout cho trang Login (Full màn hình)
            <main className="min-h-screen bg-gray-50">
              {children}
            </main>
          ) : (
            // Layout chính cho App
            <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
              {/* LeftSidebar tự dùng useUser(), không cần truyền prop nữa */}
              <LeftSidebar />

              {/* Nội dung chính */}
              <main className="flex-1 overflow-y-auto bg-gray-50/50 relative">
                 {children}
              </main>

              {/* RightSidebar tự dùng useUser() */}
              {isHomePage && <RightSidebar />}
            </div>
          )}
         
        </UserProvider>
      </body>
    </html>
  );
}