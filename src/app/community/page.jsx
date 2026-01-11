"use client"

import React, { useState, useEffect } from 'react';
import { Search, Loader2, Mail, MapPin, Briefcase } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const CommunityPage = () => {
  const supabase = createClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      let query = supabase.from('profiles').select('*');
      
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
    <div className="max-w-7xl mx-auto p-4 md:p-8 min-h-screen">
      
      {/* --- HEADER SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6">
        <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Community</h1>
            <p className="text-gray-500 mt-2 text-sm">Kết nối và vinh danh đồng nghiệp của bạn.</p>
        </div>

        {/* --- SEARCH BAR (STYLE MỚI THEO YÊU CẦU) --- */}
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
          <input 
            type="text" 
            placeholder="Tìm kiếm đồng nghiệp..." 
            className="w-full pl-10 pr-4 h-10 bg-gray-50/50 border border-gray-200 rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* --- LIST USERS (Giữ nguyên logic hiển thị thẻ User) --- */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="animate-spin text-blue-600 w-10 h-10 mb-4"/>
            <p className="text-gray-400 font-medium">Đang tải danh sách...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <Link key={user.id} href={`/profile/${user.id}`} className="block group">
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                
                <div className="flex items-start gap-4 relative z-10">
                    <Avatar className="w-16 h-16 border-4 border-white shadow-md rounded-2xl group-hover:scale-105 transition-transform bg-gray-100">
                        <AvatarImage src={user.avatar_url} className="object-cover" />
                        <AvatarFallback className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-xl">
                            {user.full_name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0 pt-1">
                        <h3 className="font-bold text-gray-900 truncate text-lg group-hover:text-blue-600 transition-colors">
                            {user.full_name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-blue-600 font-medium text-sm mt-0.5 mb-1">
                            <Briefcase size={14} className="shrink-0" />
                            <span className="truncate">{user.job_title || 'Thành viên'}</span>
                        </div>
                    </div>
                </div>

                <div className="h-px bg-gray-100 my-4 w-full"></div>

                <div className="space-y-3 text-sm mt-auto">
                    <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-800 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 text-blue-500">
                            <Mail size={16} />
                        </div>
                        <span className="truncate" title={user.email}>
                            {user.email || 'Chưa cập nhật email'}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 text-gray-500 group-hover:text-gray-800 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0 text-purple-500">
                            <MapPin size={16} />
                        </div>
                        <span className="truncate">
                            {user.department || 'Chưa cập nhật phòng ban'}
                        </span>
                    </div>
                </div>

              </div>
            </Link>
          ))}
          
          {users.length === 0 && (
            <div className="col-span-full py-20 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="text-gray-400 w-8 h-8"/>
                </div>
                <h3 className="text-gray-900 font-bold mb-1">Không tìm thấy kết quả</h3>
                <p className="text-gray-500">Thử tìm kiếm với từ khóa khác xem sao.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;