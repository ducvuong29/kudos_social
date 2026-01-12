"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Trophy,
  LogOut,
  User,
  Users,
  Settings,
  Moon,
  Sun,
  Globe,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useApp } from "@/context/AppProvider"; // <--- Import Context Ngôn ngữ
import { useTheme } from "next-themes"; // <--- Import Hook Theme

const LeftSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const { user } = useUser();
  const { language, changeLanguage, t } = useApp(); // Lấy hàm dịch
  const { theme, setTheme } = useTheme(); // Lấy hàm theme

  const [isSettingsOpen, setIsSettingsOpen] = useState(false); // State đóng mở menu setting

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  // Helper render Nav Item
  const NavItem = ({ href, icon: Icon, label }) => (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start gap-3 font-semibold cursor-pointer transition-all duration-200
        ${
          pathname === href
            ? "bg-blue-50 text-blue-700 border-r-4 border-blue-600 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-500"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
        }`}
      >
        <Icon size={20} /> {label}
      </Button>
    </Link>
  );

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex flex-col hidden md:flex shadow-sm z-10 sticky top-0 h-screen transition-colors duration-300">
      {/* LOGO */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-white font-bold text-xl">K</span>
          </div>
          <h1 className="font-bold text-xl text-gray-900 dark:text-white transition-colors">
            Kudos
            <span className="text-blue-600 dark:text-blue-400">Social</span>
          </h1>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto scrollbar-hide">
        <NavItem href="/" icon={Home} label={t.newsFeed} />
        <NavItem href="/leaderboard" icon={Trophy} label={t.leaderboard} />
        <NavItem href="/profile" icon={User} label={t.profile} />
        <NavItem href="/community" icon={Users} label={t.community} />

        {/* --- SETTINGS SECTION (NEW) --- */}
        <div className="pt-4 mt-2 border-t border-gray-50 dark:border-gray-800">
          <div
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className="flex items-center justify-between px-4 py-2 text-gray-600 dark:text-gray-400 font-semibold cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <Settings
                size={20}
                className="group-hover:rotate-90 transition-transform duration-300"
              />
              {t.settings}
            </div>
            {isSettingsOpen ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </div>

          {/* Setting Controls */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isSettingsOpen ? "max-h-60 opacity-100 mt-2" : "max-h-0 opacity-0"
            }`}
          >
            <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-3 space-y-4 mx-2 border border-gray-100 dark:border-gray-700">
              {/* 1. Theme Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Moon size={12} /> {t.theme}
                </label>
                <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                      theme === "light"
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-600 dark:text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <Sun size={14} /> {t.light}
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                      theme === "dark"
                        ? "bg-slate-700 text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    <Moon size={14} /> {t.dark}
                  </button>
                </div>
              </div>

              {/* 2. Language Toggle */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                  <Globe size={12} /> {t.language}
                </label>
                <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => changeLanguage("vi")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                      language === "vi"
                        ? "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    Tiếng Việt
                  </button>
                  <button
                    onClick={() => changeLanguage("en")}
                    className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all ${
                      language === "en"
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
                    }`}
                  >
                    English
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* USER INFO FOOTER */}
        <div className="mt-auto pt-6 border-t border-gray-50 dark:border-gray-800 mx-2">
          <div className="p-4 bg-gray-50/80 dark:bg-slate-800/80 rounded-2xl border border-gray-100/80 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900 transition-colors group">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-10 h-10 ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-slate-900">
                <AvatarImage src={user?.avatar_url} />
                <AvatarFallback>
                  {user?.full_name?.charAt(0) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-gray-900 dark:text-white">
                  {user?.full_name || t.loading}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {t.online}
                </p>
              </div>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="w-full gap-2 text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border-gray-200 dark:border-gray-600 cursor-pointer"
            >
              <LogOut size={14} /> {t.logOut}
            </Button>
          </div>
        </div>
      </nav>
    </aside>
  );
};

export default LeftSidebar;
