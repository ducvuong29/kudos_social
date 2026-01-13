"use client";

import React, { useState, useEffect } from "react";
import { Search, Loader2, Mail, MapPin, Briefcase } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useApp } from "@/context/AppProvider";
const CommunityPage = () => {
  const supabase = createClient();
  const { t } = useApp();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      let query = supabase.from("profiles").select("*");

      if (search) {
        query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query;
      if (!error) setUsers(data || []);
      setLoading(false);
    };

    const timeoutId = setTimeout(() => {
      fetchUsers();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen bg-gray-50/50 dark:bg-slate-900/50 transition-colors pb-24 md:pb-8">
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-10 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t.communityTitle}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 md:mt-2 text-sm">
            {t.communitySubtitle}
          </p>
        </div>

        {/* --- SEARCH BAR --- */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <input
            type="text"
            placeholder={t.searchColleaguePlaceholder}
            className="w-full pl-10 pr-4 h-10 md:h-12 bg-white/80 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-full text-sm focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all dark:text-white dark:placeholder:text-gray-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* --- LIST USERS --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-blue-600 dark:text-blue-400 w-10 h-10 mb-4" />
          <p className="text-gray-400 font-medium">{t.loadingList}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {users.map((user) => (
            <Link
              key={user.id}
              href={`/profile/${user.id}`}
              className="block group cursor-pointer"
            >
              {/* CARD */}
              <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:border-blue-100 dark:hover:border-blue-900 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                  <Avatar className="w-14 h-14 md:w-16 md:h-16 border-4 border-white dark:border-slate-700 shadow-md rounded-2xl group-hover:scale-105 transition-transform bg-gray-100 dark:bg-slate-900">
                    <AvatarImage
                      src={user.avatar_url}
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg md:text-xl">
                      {user.full_name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0 pt-1">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate text-base md:text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {user.full_name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium text-xs md:text-sm mt-0.5 mb-1">
                      <Briefcase size={14} className="shrink-0" />
                      <span className="truncate">
                        {user.job_title || t.member}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100 dark:bg-slate-700 my-3 md:my-4 w-full"></div>

                <div className="space-y-2 md:space-y-3 text-xs md:text-sm mt-auto">
                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-500 dark:text-blue-400">
                      <Mail size={14} className="md:w-4 md:h-4" />
                    </div>
                    <span className="truncate" title={user.email}>
                      {user.email || t.noEmail}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400 group-hover:text-gray-800 dark:group-hover:text-gray-200 transition-colors">
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-purple-50 dark:bg-purple-900/30 flex items-center justify-center shrink-0 text-purple-500 dark:text-purple-400">
                      <MapPin size={14} className="md:w-4 md:h-4" />
                    </div>
                    <span className="truncate">
                      {user.department || t.noDepartment}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {users.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="text-gray-400 w-8 h-8" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-bold mb-1">
                {t.noResultsFound}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t.tryDifferentKeyword}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
