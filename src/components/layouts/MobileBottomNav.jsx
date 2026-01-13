"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Trophy,
  Users,
  User,
  Menu,
  Moon,
  Sun,
  Globe,
  LogOut,
  X,
} from "lucide-react";
import { useTheme } from "next-themes"; // Import Theme
import { useApp } from "@/context/AppProvider"; // Import Language
import { createClient } from "@/lib/supabase/client"; // Import Supabase for Logout
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/context/UserContext";

const MobileBottomNav = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false); // State bật tắt menu

  // --- LOGIC TỪ LEFTSIDEBAR ---
  const { theme, setTheme } = useTheme();
  const { language, changeLanguage, t } = useApp();
  const { user } = useUser();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Danh sách Nav Items (Thêm nút Menu vào cuối)
  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/leaderboard", icon: Trophy, label: "Rank" },
    { href: "/community", icon: Users, label: "Community" },
    { href: "/profile", icon: User, label: "Me" },
    { id: "menu", icon: Menu, label: "Menu" }, // Nút Menu đặc biệt
  ];

  return (
    <>
      {/* --- SETTINGS POPUP (MENU DRAWER) --- */}
      {/* Hiển thị khi isMenuOpen = true */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pb-[70px]">
          {/* Lớp nền tối để đóng menu */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          ></div>

          {/* Nội dung Menu */}
          <div className="relative bg-white dark:bg-slate-900 rounded-t-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-5 border-t border-gray-100 dark:border-gray-800 mx-2 mb-2">
            {/* Header Menu */}
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 dark:border-gray-800 pb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700">
                  <AvatarImage src={user?.avatar_url} />
                  <AvatarFallback>{user?.full_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-sm text-gray-900 dark:text-white">
                    {user?.full_name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {t.settings}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 bg-gray-100 dark:bg-slate-800 rounded-full text-gray-500"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 1. Theme Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Moon size={12} /> {t.theme}
                </label>
                <div className="flex bg-gray-100 dark:bg-slate-950 rounded-lg p-1">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                      theme === "light"
                        ? "bg-white text-blue-600 shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Sun size={16} /> Light
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-bold transition-all ${
                      theme === "dark"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    <Moon size={16} /> Dark
                  </button>
                </div>
              </div>

              {/* 2. Language Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={12} /> {t.language}
                </label>
                <div className="flex bg-gray-100 dark:bg-slate-950 rounded-lg p-1">
                  <button
                    onClick={() => changeLanguage("vi")}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                      language === "vi"
                        ? "bg-white text-red-600 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${
                      language === "en"
                        ? "bg-white text-indigo-600 shadow-sm dark:bg-slate-700 dark:text-white"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>

              {/* 3. Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-xl border border-red-100 dark:border-red-900 active:scale-95 transition-transform"
              >
                <LogOut size={18} /> {t.logOut}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- THANH NAV DƯỚI CÙNG --- */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 py-2 px-4 flex justify-between items-center z-50 md:hidden pb-safe safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;

          // XỬ LÝ RIÊNG CHO NÚT MENU
          if (item.id === "menu") {
            return (
              <button
                key="menu"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                  isMenuOpen
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-400 dark:text-gray-500"
                }`}
              >
                <Icon size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
                {/* <span className="text-[10px] font-medium">{item.label}</span> */}
              </button>
            );
          }

          // CÁC NÚT LINK BÌNH THƯỜNG
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 transition-colors p-2 rounded-lg ${
                isActive
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  : "text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800"
              }`}
            >
              <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            </Link>
          );
        })}
      </div>
    </>
  );
};

export default MobileBottomNav;
