"use client";

import React, { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, Gift } from "lucide-react";
import { useUser } from "@/context/UserContext";
import useSWR, { mutate } from "swr";
import { useApp } from "@/context/AppProvider";
import Link from "next/link"; 

const trendingTags = [
  "#TeamWork",
  "#ProblemSolver",
  "#Q3Goals",
  "#OfficeLife",
  "#FridayFeeling",
];

const RightSidebar = () => {
  const supabase = createClient();
  const { user: currentUser } = useUser();
  const { t } = useApp();

  // --- 1. SWR: FETCH USER STATS ---
  const { data: receivedKudosCount } = useSWR(
    currentUser ? ["my-stats", currentUser.id] : null,
    async () => {
      const { count, error } = await supabase
        .from("kudos_receivers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUser.id);
      if (error) throw error;
      return count || 0;
    },
    {
      fallbackData: 0,  // GIÁ TRỊ MẶC ĐỊNH KHI ĐANG LẤY DATA TỪ DB 
      revalidateOnFocus: false,
    }
  );

  // --- Helper Function for Leaderboard Processing ---
  const processLeaderboardData = async (topIds, counts, typeLabel) => {
    if (topIds.length === 0) return [];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", topIds);

    if (!profiles) return [];

    return topIds.map((id, index) => {
      const profile = profiles.find((p) => p.id === id);
      return {
        id: id,
        rank: index + 1,
        name: profile?.full_name || "Unknown",
        count: counts[id],
        avatar: profile?.avatar_url,
        isTop: index === 0,
        label: typeLabel === "given" ? "Given" : "Received",
      };
    });
  };

  // --- 2. SWR: FETCH TOP GIVERS ---
  const { data: realTopGivers } = useSWR(
    "top-givers",
    async () => {
      const { data: allKudos, error } = await supabase
        .from("kudos")
        .select("sender_id");
      if (error || !allKudos) return [];

      const counts = allKudos.reduce((acc, curr) => {
        acc[curr.sender_id] = (acc[curr.sender_id] || 0) + 1;
        return acc;
      }, {});
      
      const topIds = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 3);
      return processLeaderboardData(topIds, counts, "given");
    },
    {
      fallbackData: [],
      dedupingInterval: 60000,
    }
  );

  // --- 3. SWR: FETCH TOP RECEIVERS ---
  const { data: realTopReceivers } = useSWR(
    "top-receivers",
    async () => {
      const { data: allReceivers, error } = await supabase
        .from("kudos_receivers")
        .select("user_id");
      if (error || !allReceivers) return [];

      const counts = allReceivers.reduce((acc, curr) => {
        acc[curr.user_id] = (acc[curr.user_id] || 0) + 1;
        return acc;
      }, {});

      const topIds = Object.keys(counts)
        .sort((a, b) => counts[b] - counts[a])
        .slice(0, 3);
      return processLeaderboardData(topIds, counts, "received");
    },
    {
      fallbackData: [],
      dedupingInterval: 60000,
    }
  );

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel("right_sidebar_realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kudos" },
        () => {
          mutate("top-givers");
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kudos_receivers" },
        () => {
          mutate("top-receivers");
          mutate(["my-stats", currentUser.id]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentUser]);

  // --- LEADERBOARD LIST COMPONENT (UPDATED WITH LINK) ---
  const LeaderboardList = ({ title, data = [], icon: Icon }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          {Icon && <Icon size={18} className="text-blue-500" />} {title}
        </h3>
      </div>
      <div className="space-y-4">
        {data.length === 0 ? (
          <p className="text-gray-400 dark:text-gray-500 text-sm italic">
            {t.noDataYet}
          </p>
        ) : (
          data.map((user, idx) => (
            // <--- 2. THÊM LINK BAO BỌC ITEM --->
            <Link
              href={`/profile/${user.id}`}
              key={user.id || idx}
              className="block"
            >
              <div className="flex items-center gap-3 group cursor-pointer p-2 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <span
                  className={`text-sm font-bold w-6 text-center ${
                    idx === 0
                      ? "text-yellow-500 text-lg"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                >
                  {user.rank}
                </span>
                <Avatar className="w-10 h-10 border border-gray-100 dark:border-slate-700 group-hover:border-blue-200 dark:group-hover:border-blue-800 transition-colors">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback>
                    {user.name ? user.name[0] : "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 dark:text-gray-200 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {user.count} Kudos {user.label}
                  </p>
                </div>
                {user.isTop && (
                  <Star
                    className="text-yellow-400 fill-yellow-400 shrink-0"
                    size={16}
                  />
                )}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );

  return (
    <aside className="w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-slate-800 p-6 overflow-y-auto hidden xl:block sticky top-0 h-screen scrollbar-hide transition-colors">
      <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-8 shadow-xl border-none rounded-3xl overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
        <CardContent className="p-6 relative z-10">
          <h3 className="text-xs font-bold uppercase opacity-80 tracking-wider mb-1">
            {t.totalKudosReceived}
          </h3>
          <div className="text-5xl font-extrabold my-3 tracking-tight">
            {receivedKudosCount}
          </div>
          <div className="w-full bg-black/20 rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className="bg-white/90 rounded-full h-full shadow-sm animate-pulse"
              style={{ width: "65%" }}
            ></div>
          </div>
          <p className="text-xs opacity-80 font-medium">{t.youAreDoingGreat}</p>
        </CardContent>
      </Card>

      <LeaderboardList title={t.topGivers} data={realTopGivers} icon={Gift} />
      <LeaderboardList
        title={t.topReceivers}
        data={realTopReceivers}
        icon={TrendingUp}
      />

      <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
        <h3 className="font-bold text-gray-900 dark:text-white mb-4 text-sm uppercase tracking-wide text-gray-400 dark:text-gray-500">
          {t.trendingNow}
        </h3>
        <div className="flex flex-wrap gap-2">
          {trendingTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer px-3 py-1.5 transition-all font-medium border border-gray-100 dark:border-slate-700"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default RightSidebar;
