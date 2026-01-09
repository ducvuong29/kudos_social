"use client" // <--- Thêm dòng này đầu tiên
import { Inter } from "next/font/google";
import "./globals.css";
import LeftSidebar from "@/components/layouts/LeftSidebar"; // Sửa lại đường dẫn import nếu cần
import RightSidebar from "@/components/layouts/RightSidebar"; // Sửa lại đường dẫn import nếu cần
import { useState, useEffect } from "react";
import { createClient } from '@/lib/supabase/client';
import { usePathname } from 'next/navigation'; // <--- Import hook này

const inter = Inter({ subsets: ["latin"] });

// Vì layout là Client Component, ta không export metadata ở đây được nữa.
// Nếu cần SEO, bạn nên tách Logic Sidebar ra một component riêng gọi là <AppShell>
// Nhưng để đơn giản, mình làm trực tiếp ở đây.

export default function RootLayout({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const supabase = createClient();
  const pathname = usePathname(); // Lấy đường dẫn hiện tại

  useEffect(() => {
     // Fetch user global (Chỉ chạy khi user đã login và không ở trang login)
     const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if(user) {
             const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
             setCurrentUser(data);
        }
     }
     
     if (pathname !== '/login') {
        getUser();
     }
  }, [pathname]);

  // --- LOGIC ẨN HIỆN SIDEBAR ---
  const isLoginPage = pathname === '/login';
  const isHomePage = pathname === '/';
  
  // Logic: 
  // 1. Nếu là trang login: Ẩn hết Sidebar.
  // 2. Nếu không phải login: Luôn hiện LeftSidebar.
  // 3. RightSidebar: Chỉ hiện ở trang chủ (isHomePage).

  return (
    <html lang="en">
      <body className={inter.className}>
        {isLoginPage ? (
            // Layout cho trang Login (Full màn hình, không sidebar)
            <main className="min-h-screen bg-gray-50">
               {children}
            </main>
        ) : (
            // Layout cho App (Có Sidebar)
            <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
                {/* Sidebar Trái - Luôn hiển thị trừ khi ở Login */}
                <LeftSidebar currentUser={currentUser} />

                {/* Nội dung chính */}
                <main className="flex-1 overflow-y-auto bg-gray-50/50">
                   {children}
                </main>

                {/* Sidebar Phải - Chỉ hiển thị ở Trang Chủ */}
                {isHomePage && <RightSidebar currentUser={currentUser} />}
            </div>
        )}
      </body>
    </html>
  );
}