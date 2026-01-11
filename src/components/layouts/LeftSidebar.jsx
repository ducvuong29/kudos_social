"use client"

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Trophy, LogOut, User, Users } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext'; 

const LeftSidebar = () => { 
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  
  // --- SỬA Ở ĐÂY: Chỉ lấy user (vì nó đã gộp cả profile) ---
  const { user } = useUser(); 

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shadow-sm z-10 sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-xl">K</span></div>
            <h1 className="font-bold text-xl text-gray-900">Kudos<span className="text-blue-600">Social</span></h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <Link href="/">
             <Button variant="ghost" className={`w-full justify-start gap-3 font-semibold cursor-pointer ${pathname === '/' ? 'bg-blue-50 text-blue-700 border-r-4 border-blue-600' : 'text-gray-600'}`}>
                <Home size={20}/> News Feed
             </Button>
          </Link>
          
          <Link href="/leaderboard">
             <Button variant="ghost" className={`w-full justify-start gap-3 font-semibold cursor-pointer ${pathname === '/leaderboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>
                <Trophy size={20}/> Leaderboard
             </Button>
          </Link>
           <Link href="/profile">
             <Button variant="ghost" className={`w-full justify-start gap-3 font-semibold cursor-pointer ${pathname === '/profile' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>
                <User size={20}/> Profile 
             </Button>
          </Link>
          <Link href="/community">
            <Button variant="ghost" className={`w-full justify-start gap-3 font-semibold cursor-pointer ${pathname === '/community' ? 'bg-blue-50 text-blue-700' : 'text-gray-600'}`}>
                <Users size={20}/> Community
            </Button>
          </Link>
            <div className="mt-auto pt-6 border-t border-gray-50 mx-2">
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100/80 hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        {/* --- SỬA Ở ĐÂY: Dùng user thay cho profile --- */}
                        <Avatar className="w-10 h-10 ring-2 ring-blue-500 ring-offset-2">
                            <AvatarImage src={user?.avatar_url}/>
                            <AvatarFallback>{user?.full_name?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate">{user?.full_name || 'Loading...'}</p>
                            <p className="text-xs text-blue-600">Online</p>
                        </div>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="w-full gap-2 text-gray-600 hover:text-red-600 cursor-pointer"><LogOut size={14}/> Log Out</Button>
                </div>
            </div>
        </nav>
      </aside>
  );
};

export default LeftSidebar;