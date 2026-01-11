'use client'

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, TrendingDown, Minus, Search, 
  Gift, Medal, Loader2 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import NotificationList from '@/components/common/NotificationList';
import { useUser } from '@/context/UserContext'; 
import { useApp } from '@/context/AppProvider';
const LeaderboardPage = () => {
  const supabase = createClient();
  const { user: currentUser } = useUser();
const { t } = useApp();
  const [timeFilter, setTimeFilter] = useState('week'); 
  const [leaderboardType, setLeaderboardType] = useState('receivers'); 
  
  // --- 1. THÊM STATE SEARCH ---
  const [searchQuery, setSearchQuery] = useState('');

  // Lưu dữ liệu gốc (nguyên bản từ API)
  const [rawData, setRawData] = useState([]); // Chứa toàn bộ danh sách đã sort
  const [isLoading, setIsLoading] = useState(true);

  // --- Fetch Leaderboard ---
  useEffect(() => {
    const fetchLeaderboard = async () => {
      setIsLoading(true);
      try {
        let startTime = new Date();
        if (timeFilter === 'week') startTime.setDate(startTime.getDate() - 7);
        if (timeFilter === 'month') startTime.setMonth(startTime.getMonth() - 1);
        if (timeFilter === 'all') startTime = new Date(0); 

        let scores = {}; 

        if (leaderboardType === 'givers') {
            const { data, error } = await supabase
                .from('kudos')
                .select('sender_id')
                .gte('created_at', startTime.toISOString());
            if (error) throw error;
            data.forEach(item => { scores[item.sender_id] = (scores[item.sender_id] || 0) + 1; });
        } else {
            const { data, error } = await supabase
                .from('kudos_receivers')
                .select(`user_id, kudos:kudos_id (created_at)`)
                .gte('kudos.created_at', startTime.toISOString());
            if (error) throw error;
            data.forEach(item => { if(item.kudos) scores[item.user_id] = (scores[item.user_id] || 0) + 1; });
        }

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
                trend: Math.floor(Math.random() * 20) - 5, 
                isMe: currentUser?.id === profile.id
            }));

            fullList.sort((a, b) => b.points - a.points);
            fullList = fullList.map((item, index) => ({ ...item, rank: index + 1 }));

            // Lưu dữ liệu gốc vào state
            setRawData(fullList);
        } else {
            setRawData([]);
        }

      } catch (error) {
        console.error("Error fetching leaderboard:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboard();
  }, [timeFilter, leaderboardType, currentUser]); 

  // --- 2. LOGIC FILTER & PHÂN CHIA HIỂN THỊ ---
  // Lọc danh sách dựa trên Search Query
  const filteredList = rawData.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.department?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Logic chia Top 3 và Others:
  // - Nếu đang tìm kiếm: Không chia Top 3, hiện tất cả dạng list để dễ nhìn.
  // - Nếu không tìm kiếm: Chia Top 3 lên bục, còn lại xuống list.
  const displayTopThree = !searchQuery ? filteredList.slice(0, 3) : [];
  const displayOthers = !searchQuery ? filteredList.slice(3) : filteredList;

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
    // CONTAINER: dark:bg-slate-900/50
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900/50 transition-colors">
        {/* HEADER: dark:bg-slate-900/80 */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-800 sticky top-0 z-30 transition-colors">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t.leaderboard}</h2>
                  <span className="text-gray-300 dark:text-slate-600">|</span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400 hidden sm:block">
                    {leaderboardType === 'receivers' ? t.mostAppreciated : t.topContributors}
                  </span>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                <div className="relative hidden sm:block group">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                  {/* INPUT: dark:bg-slate-800 dark:text-white dark:border-slate-700 */}
                  <input
                    type="text"
                    placeholder={t.findColleague}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 h-10 w-48 bg-gray-100/50 dark:bg-slate-800 border border-transparent dark:border-slate-700 focus:bg-white dark:focus:bg-slate-700 focus:border-blue-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 transition-all dark:text-white dark:placeholder:text-gray-500"
                  />
                </div>
                <NotificationList />
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
          {/* Controls Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            {/* SWITCHER: dark:bg-slate-800 dark:border-slate-700 */}
            <div className="bg-white dark:bg-slate-800 p-1 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 inline-flex self-start md:self-auto transition-colors">
                <button onClick={() => setLeaderboardType('receivers')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${leaderboardType === 'receivers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Medal className="w-4 h-4" />{t.topReceivers}</button>
                <button onClick={() => setLeaderboardType('givers')} className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${leaderboardType === 'givers' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}><Gift className="w-4 h-4" />{t.topGivers}</button>
            </div>
            {/* TIME FILTER: dark:bg-slate-800 */}
            <div className="flex items-center gap-1 bg-gray-200/50 dark:bg-slate-800 p-1 rounded-lg self-start md:self-auto transition-colors">
                {['week', 'month', 'all'].map((tab) => (
                    <button key={tab} onClick={() => setTimeFilter(tab)} className={`px-3 py-1.5 rounded-md text-xs font-bold capitalize transition-all cursor-pointer ${timeFilter === tab ? 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}>{tab === 'all' ? t.allTime : tab === 'week' ? t.thisWeek : t.thisMonth}</button>
                ))}
            </div>
          </div>

          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" /><p>{t.calculatingScores}</p>
            </div>
          ) : (
            <>
                {displayTopThree.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 mb-12 items-end animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {[displayTopThree[1], displayTopThree[0], displayTopThree[2]].filter(Boolean).map((person) => (
                    <div key={person.id} className={`relative group ${person.rank === 1 ? 'md:order-2 md:-mt-8' : person.rank === 2 ? 'md:order-1' : 'md:order-3'}`}>
                        {/* PODIUM CARD: dark:bg-slate-800 dark:border-slate-700 */}
                        <div className={`bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300 cursor-pointer text-center relative overflow-hidden ${person.isMe ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-slate-900' : ''}`}>
                            {person.rank === 1 && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-300 via-yellow-500 to-yellow-300" />}
                            <div className="relative inline-block mb-4 mt-2">
                                <Avatar className={`w-20 h-20 lg:w-24 lg:h-24 border-4 ${person.rank === 1 ? 'border-yellow-100 dark:border-yellow-900' : person.rank === 2 ? 'border-gray-100 dark:border-gray-700' : 'border-orange-100 dark:border-orange-900'}`}><AvatarImage src={person.avatar} /><AvatarFallback>{person.name.charAt(0)}</AvatarFallback></Avatar>
                                <div className={`absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm border-4 border-white dark:border-slate-800 shadow-md ${person.rank === 1 ? 'bg-yellow-500' : person.rank === 2 ? 'bg-gray-500' : 'bg-orange-500'}`}>{person.rank}</div>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-2 truncate">{person.name}</h3>
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">{person.department}</p>
                            <div className={`inline-flex flex-col items-center justify-center px-6 py-2 rounded-xl bg-gray-50 dark:bg-slate-700/50 group-hover:bg-${primaryColor}-50 dark:group-hover:bg-${primaryColor}-900/20 transition-colors`}>
                                <span className={`text-2xl font-bold text-${primaryColor}-600 dark:text-${primaryColor}-400`}>{person.points}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{leaderboardType === 'receivers' ? t.received : t.given}</span>
                            </div>
                        </div>
                    </div>
                    ))}
                </div>
                )}

                {/* --- LIST --- */}
                {/* LIST CONTAINER: dark:bg-slate-800 dark:border-slate-700 */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden transition-colors">
                    <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/80 dark:bg-slate-900/50 border-b border-gray-200 dark:border-slate-700 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        <div className="col-span-2 sm:col-span-1">{t.rank}</div>
                        <div className="col-span-6 sm:col-span-5">{t.colleague}</div>
                        <div className="hidden sm:block sm:col-span-3">{t.department}</div>
                        <div className="col-span-3 sm:col-span-2 text-right">{t.count}</div>
                        <div className="col-span-1 text-right hidden sm:block">{t.trend}</div>
                    </div>
                    
                    <div className="divide-y divide-gray-100 dark:divide-slate-700">
                        {displayOthers.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                                {searchQuery ? `${t.noColleaguesFound} "${searchQuery}"` : t.noDataYet}
                            </div>
                        ) : (
                            displayOthers.map((person) => (
                            <div key={person.id} className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors items-center ${person.isMe ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''}`}>
                                <div className="col-span-2 sm:col-span-1"><span className={`text-sm font-bold w-6 h-6 flex items-center justify-center ${person.rank <= 3 ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full' : 'text-gray-500 dark:text-gray-400'}`}>#{person.rank}</span></div>
                                <div className="col-span-6 sm:col-span-5 flex items-center gap-3">
                                    <Avatar className="w-9 h-9 border border-gray-100 dark:border-slate-600"><AvatarImage src={person.avatar} /><AvatarFallback>{person.name.charAt(0)}</AvatarFallback></Avatar>
                                    <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 dark:text-gray-200 flex items-center gap-2 text-sm">{person.name} {person.isMe && <span className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-[10px] px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-700 font-bold">YOU</span>}</div>
                                        <div className="sm:hidden text-xs text-gray-500 dark:text-gray-400 mt-0.5">{person.department}</div>
                                    </div>
                                </div>
                                <div className="hidden sm:block sm:col-span-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-800 dark:text-gray-300">{person.department}</span></div>
                                <div className="col-span-3 sm:col-span-2 text-right"><span className={`text-sm font-bold ${leaderboardType === 'receivers' ? 'text-blue-600 dark:text-blue-400' : 'text-purple-600 dark:text-purple-400'}`}>{person.points}</span></div>
                                <div className={`hidden sm:flex col-span-1 justify-end items-center gap-1 text-xs font-medium ${getTrendColor(person.trend)}`}>{getTrendIcon(person.trend)}{Math.abs(person.trend)}%</div>
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