'use client'

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Search, 
  Gift, Medal, Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationList from '@/components/common/NotificationList'; // <--- Import component thông báo
import { useUser } from '@/context/UserContext'; // <--- Import UserContext


const LeaderboardPage = () => {
  const supabase = createClient();
  const { user: currentUser } = useUser(); // Lấy user từ Context

  const [timeFilter, setTimeFilter] = useState('week'); // 'week' | 'month' | 'all'
  const [leaderboardType, setLeaderboardType] = useState('receivers'); // 'receivers' | 'givers'
  
  const [leaderboardData, setLeaderboardData] = useState({ topThree: [], others: [] });
  const [isLoading, setIsLoading] = useState(true);

  // --- 1. Fetch và Xử lý dữ liệu Leaderboard ---
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        // A. Xác định mốc thời gian
        let startTime = new Date();
        if (timeFilter === 'week') startTime.setDate(startTime.getDate() - 7);
        if (timeFilter === 'month') startTime.setMonth(startTime.getMonth() - 1);
        if (timeFilter === 'all') startTime = new Date(0); 

        let scores = {}; 

        // B. Query dữ liệu tùy theo Type
        if (leaderboardType === 'givers') {
            const { data, error } = await supabase
                .from('kudos')
                .select('sender_id')
                .gte('created_at', startTime.toISOString());
            
            if (error) throw error;
            data.forEach(item => {
                scores[item.sender_id] = (scores[item.sender_id] || 0) + 1;
            });

        } else {
            const { data, error } = await supabase
                .from('kudos_receivers')
                .select(`
                    user_id,
                    kudos:kudos_id (created_at)
                `)
                .gte('kudos.created_at', startTime.toISOString()); // Filter nested resource

            if (error) throw error;
            
            data.forEach(item => {
                if(item.kudos) { 
                    scores[item.user_id] = (scores[item.user_id] || 0) + 1;
                }
            });
        }

        // C. Lấy thông tin chi tiết User
        const userIds = Object.keys(scores);
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url, department, job_title')
                .in('id', userIds);
            
            let fullList = profiles.map(profile => ({
                id: profile.id,
                name: profile.full_name || 'Unnamed',
                department: profile.department || 'General',
                points: scores[profile.id],
                avatar: profile.avatar_url,
                trend: Math.floor(Math.random() * 20) - 5, // Mock trend
                isMe: currentUser?.id === profile.id
            }));

            // Sắp xếp giảm dần theo điểm
            fullList.sort((a, b) => b.points - a.points);

            // Đánh thứ hạng (Rank)
            fullList = fullList.map((item, index) => ({ ...item, rank: index + 1 }));

            setLeaderboardData({
                topThree: fullList.slice(0, 3), 
                others: fullList.slice(3)       
            });
        } else {
            setLeaderboardData({ topThree: [], others: [] });
        }

      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter, leaderboardType, currentUser]); 

  // --- HELPER FUNCTIONS ---
  const getTrendIcon = (trend) => {
    if (trend > 0) return <TrendingUp className="w-3 h-3" />;
    if (trend < 0) return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const getTrendColor = (trend) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const primaryColor = leaderboardType === 'receivers' ? 'blue' : 'purple';

  return (
    <div className="min-h-screen bg-gray-50/50">
        {/* Header Content */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              
              {/* Title Context */}
              <div className="flex items-center gap-2">
                 <h2 className="text-xl font-bold text-gray-800">Leaderboard</h2>
                 <span className="text-gray-300">|</span>
                 <span className="text-sm font-medium text-gray-500 hidden sm:block">
                    {leaderboardType === 'receivers' ? 'Most Appreciated' : 'Top Contributors'}
                 </span>
              </div>

              {/* Right Section: Search + Notification */}
              <div className="flex items-center gap-4 ml-auto">
                <div className="relative hidden sm:block group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="text"
                    placeholder="Search..."
                    className="pl-10 pr-4 h-10 w-48 bg-gray-100/50 border border-transparent focus:bg-white focus:border-blue-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                  />
                </div>

                {/* --- NOTIFICATION LIST (MỚI THÊM) --- */}
                <NotificationList  />
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          
          {/* Controls Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            
            {/* 1. Main Switcher */}
            <div className="bg-white p-1 rounded-xl shadow-sm border border-gray-200 inline-flex self-start md:self-auto">
                <button 
                    onClick={() => setLeaderboardType('receivers')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        leaderboardType === 'receivers' 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <Medal className="w-4 h-4" />
                    Top Receivers
                </button>
                <button 
                    onClick={() => setLeaderboardType('givers')}
                    className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                        leaderboardType === 'givers' 
                        ? 'bg-purple-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <Gift className="w-4 h-4" />
                    Top Givers
                </button>
            </div>

            {/* 2. Time Filters */}
            <div className="flex items-center gap-1 bg-gray-200/50 p-1 rounded-lg self-start md:self-auto">
                {['week', 'month', 'all'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTimeFilter(t)}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all ${
                            timeFilter === t
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-700'
                        }`}
                    >
                        {t === 'all' ? 'All Time' : `This ${t}`}
                    </button>
                ))}
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                <p>Calculating scores...</p>
            </div>
          ) : (
            <>
                {/* Top 3 Podium */}
                {leaderboardData.topThree.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 mb-12 items-end">
                    {/* Logic sắp xếp: Hạng 2 - Hạng 1 - Hạng 3 */}
                    {[leaderboardData.topThree[1], leaderboardData.topThree[0], leaderboardData.topThree[2]]
                      .filter(Boolean)
                      .map((person) => (
                    <div
                        key={person.id}
                        className={`relative group ${
                        person.rank === 1 ? 'md:order-2 md:-mt-8' : person.rank === 2 ? 'md:order-1' : 'md:order-3'
                        }`}
                    >
                        <div className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer text-center relative overflow-hidden
                            ${person.isMe ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                        `}>
                            {person.rank === 1 && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300" />}

                            <div className="relative inline-block mb-4 mt-2">
                                <Avatar className={`w-20 h-20 lg:w-24 lg:h-24 border-4 ${
                                    person.rank === 1 ? 'border-yellow-100' : person.rank === 2 ? 'border-gray-100' : 'border-orange-100'
                                }`}>
                                    <AvatarImage src={person.avatar} />
                                    <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                
                                <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm border-4 border-white shadow-md
                                    ${person.rank === 1 ? 'bg-yellow-500' : person.rank === 2 ? 'bg-gray-500' : 'bg-orange-500'}
                                `}>
                                    {person.rank}
                                </div>
                            </div>

                            <h3 className="text-lg font-bold text-gray-900 mt-2 truncate">{person.name}</h3>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{person.department}</p>
                            
                            <div className={`inline-flex flex-col items-center justify-center px-6 py-2 rounded-xl bg-gray-50 group-hover:bg-${primaryColor}-50 transition-colors`}>
                                <span className={`text-2xl font-bold text-${primaryColor}-600`}>
                                    {person.points}
                                </span>
                                <span className="text-xs text-gray-500 font-medium">
                                    {leaderboardType === 'receivers' ? 'Received' : 'Given'}
                                </span>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
                )}

                {/* Rankings List (Others) */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-2 sm:col-span-1">Rank</div>
                    <div className="col-span-6 sm:col-span-5">Colleague</div>
                    <div className="hidden sm:block sm:col-span-3">Department</div>
                    <div className="col-span-3 sm:col-span-2 text-right">Count</div>
                    <div className="col-span-1 text-right hidden sm:block">Trend</div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {leaderboardData.others.length === 0 && leaderboardData.topThree.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">Chưa có dữ liệu cho khoảng thời gian này.</div>
                        ) : (
                            leaderboardData.others.map((person) => (
                            <div
                                key={person.id}
                                className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors items-center
                                    ${person.isMe ? 'bg-blue-50/60' : ''}
                                `}
                            >
                                <div className="col-span-2 sm:col-span-1">
                                    <span className="text-sm font-bold text-gray-500 w-6 h-6 flex items-center justify-center">
                                        #{person.rank}
                                    </span>
                                </div>
                                
                                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                                    <Avatar className="w-9 h-9 border border-gray-100">
                                        <AvatarImage src={person.avatar} />
                                        <AvatarFallback>{person.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 flex items-center gap-2 text-sm">
                                            {person.name}
                                            {person.isMe && (
                                                <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 font-bold">YOU</span>
                                            )}
                                        </div>
                                        <div className="sm:hidden text-xs text-gray-500 mt-0.5">{person.department}</div>
                                    </div>
                                </div>

                                <div className="hidden sm:block sm:col-span-3">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {person.department}
                                    </span>
                                </div>

                                <div className="col-span-3 sm:col-span-2 text-right">
                                    <span className={`text-sm font-bold ${leaderboardType === 'receivers' ? 'text-blue-600' : 'text-purple-600'}`}>
                                        {person.points}
                                    </span>
                                </div>

                                <div className={`hidden sm:flex col-span-1 justify-end items-center gap-1 text-xs font-medium ${getTrendColor(person.trend)}`}>
                                    {getTrendIcon(person.trend)}
                                    {Math.abs(person.trend)}%
                                </div>
                            </div>
                            ))
                        )}
                    </div>
                </div>
            </>
          )}
        </main>
    </div>
  );
};

export default LeaderboardPage;