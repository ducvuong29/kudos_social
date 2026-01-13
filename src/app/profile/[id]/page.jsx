"use client";

import React, { useState, useEffect } from "react";
import { Briefcase, MapPin, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import PostItem from "@/components/feed/PostItem";
import { useParams } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { useApp } from "@/context/AppProvider";

const UserProfilePage = () => {
  const { id } = useParams();
  const supabase = createClient();
  const { user: currentUser } = useUser();
  const { t } = useApp();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ received: 0, given: 0 });
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [activeTab, setActiveTab] = useState("received"); // 'received' | 'given' | 'all'
  const [viewingImage, setViewingImage] = useState(null);

  // 1. Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", id)
        .single();
      if (data) setProfile(data);
      setLoading(false);
    };
    if (id) fetchProfile();
  }, [id]);

  // 2. Fetch Stats
  useEffect(() => {
    if (!id) return;
    const calculateStats = async () => {
      const { count: receivedCount } = await supabase
        .from("kudos_receivers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", id);
      const { count: givenCount } = await supabase
        .from("kudos")
        .select("*", { count: "exact", head: true })
        .eq("sender_id", id);
      setStats({ received: receivedCount || 0, given: givenCount || 0 });
    };
    calculateStats();
  }, [id]);

  // 3. Fetch Posts (LOGIC MỚI HỖ TRỢ TAB ALL)
  useEffect(() => {
    if (!id) return;

    const fetchPosts = async () => {
      setLoadingPosts(true);
      setPosts([]);

      // Query chuẩn lấy đầy đủ thông tin
      const selectQuery = `
        *, 
        sender:sender_id(full_name, avatar_url, id), 
        recipients:kudos_receivers(user:user_id(full_name, avatar_url, id)), 
        comments(id, content, created_at, user:user_id(full_name, avatar_url, id)), 
        reactions(type, user_id)
      `;

      try {
        let rawData = [];

        // --- TRƯỜNG HỢP 1: LẤY RECEIVED (NGƯỜI NÀY NHẬN) ---
        const getReceivedPosts = async () => {
          // Bước 1: Lấy danh sách kudos_id mà user này nhận
          const { data: refs, error: refError } = await supabase
            .from("kudos_receivers")
            .select("kudos_id")
            .eq("user_id", id);

          if (refError || !refs || refs.length === 0) return [];

          const kudosIds = refs.map((r) => r.kudos_id);

          // Bước 2: Lấy chi tiết bài viết từ danh sách ID
          const { data, error } = await supabase
            .from("kudos")
            .select(selectQuery)
            .in("id", kudosIds)
            .order("created_at", { ascending: false });

          return error ? [] : data;
        };

        // --- TRƯỜNG HỢP 2: LẤY GIVEN (NGƯỜI NÀY GỬI) ---
        const getGivenPosts = async () => {
          const { data, error } = await supabase
            .from("kudos")
            .select(selectQuery)
            .eq("sender_id", id)
            .order("created_at", { ascending: false });

          return error ? [] : data;
        };

        // --- XỬ LÝ THEO TAB ---
        if (activeTab === "received") {
          rawData = await getReceivedPosts();
        } else if (activeTab === "given") {
          rawData = await getGivenPosts();
        } else if (activeTab === "all") {
          // Chạy song song cả 2 hàm để tối ưu tốc độ
          const [receivedData, givenData] = await Promise.all([
            getReceivedPosts(),
            getGivenPosts(),
          ]);

          // Gộp 2 mảng lại
          const combined = [...receivedData, ...givenData];

          // Loại bỏ bài trùng (trường hợp tự gửi cho mình hoặc data duplicate)
          // Sử dụng Map với key là post.id để lọc duy nhất
          const uniqueMap = new Map();
          combined.forEach((post) => {
            uniqueMap.set(post.id, post);
          });

          // Chuyển lại thành mảng và sắp xếp theo thời gian mới nhất -> cũ nhất
          rawData = Array.from(uniqueMap.values()).sort(
            (a, b) => new Date(b.created_at) - new Date(a.created_at)
          );
        }

        // --- FORMAT DỮ LIỆU ĐỂ HIỂN THỊ ---
        if (rawData && rawData.length > 0) {
          const formattedData = rawData.map((p) => ({
            ...p,
            receiverList: p.recipients ? p.recipients.map((r) => r.user) : [],
            image_urls: p.image_urls || (p.image_url ? [p.image_url] : []),
            comments: p.comments
              ? p.comments.sort(
                  (a, b) => new Date(a.created_at) - new Date(b.created_at)
                )
              : [],
            reactions: p.reactions || [],
          }));
          setPosts(formattedData);
        } else {
          setPosts([]);
        }
      } catch (error) {
        console.error("Error loading posts:", error);
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchPosts();
  }, [id, activeTab]);

  // --- HÀM UPDATE STATE (Dùng cho Sửa post & Comment & Reaction) ---
  const handleUpdatePostList = (updatedPost) => {
    setPosts((currentPosts) =>
      currentPosts.map((p) => (p.id === updatedPost.id ? updatedPost : p))
    );
  };

  // --- HÀM DELETE STATE ---
  const handleDeletePostList = (postId) => {
    setPosts((currentPosts) => currentPosts.filter((p) => p.id !== postId));
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-500" />
      </div>
    );
  if (!profile) return <div className="text-center p-10">User not found</div>;

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900/50 pb-24 md:pb-10 p-4 md:p-8 max-w-7xl mx-auto transition-colors">
      {/* --- MODAL XEM ẢNH FULL SCREEN (MỚI THÊM) --- */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-screen-xl max-h-screen w-full h-full flex items-center justify-center">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 text-white/70 hover:text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all z-50 cursor-pointer"
            >
              <X size={32} />
            </button>
            <img
              src={viewingImage}
              alt="Full screen"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6 transition-colors">
        <div className="h-24 md:h-32 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
        <div className="px-6 pb-6 text-center -mt-12 md:-mt-16">
          <div className="relative inline-block">
            <img
              src={profile.avatar_url || "https://github.com/shadcn.png"}
              className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-md object-cover bg-white dark:bg-slate-700"
            />
          </div>
          <div className="mt-3 md:mt-4">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
              {profile.full_name}
            </h2>
            <p className="text-sm md:text-base text-blue-600 dark:text-blue-400 font-medium">
              {profile.job_title}
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
              <Briefcase className="w-3 h-3" />
              <span>{profile.department || "No Dept"}</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
              <MapPin className="w-3 h-3" />
              <span>{profile.location || "No Location"}</span>
            </div>
          </div>
          {profile.bio && (
            <p className="mt-4 text-gray-600 dark:text-gray-300 italic text-sm md:text-base">
              "{profile.bio}"
            </p>
          )}

          {currentUser?.id !== id && (
            <div className="mt-6 flex justify-center gap-3">
              {/* Nút này có thể dẫn về trang chủ và set receiver, hoặc hiện popup gửi kudos */}
              <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium cursor-pointer transition-colors shadow-lg shadow-blue-200 dark:shadow-none">
                {t.sendKudos}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
        {/* Left Sidebar: Stats - Mobile hiện thành 2 cột ngang */}
        <div className="lg:col-span-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors">
              <div className="text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400">
                {stats.received}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
                {t.received}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors">
              <div className="text-xl md:text-2xl font-bold text-purple-600 dark:text-purple-400">
                {stats.given}
              </div>
              <div className="text-[10px] md:text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">
                {t.given}
              </div>
            </div>
          </div>
        </div>

        {/* Right Content: Feed */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px] transition-colors">
            {/* Tabs */}
            <div className="flex border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
              {["received", "given", "all"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer 
                                    ${
                                      activeTab === tab
                                        ? "border-blue-500 text-blue-600 dark:text-blue-400"
                                        : "border-transparent text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700"
                                    }`}
                >
                  {tab === "received"
                    ? t.received
                    : tab === "given"
                    ? t.given
                    : t.allActivity}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-6 bg-gray-50/30 dark:bg-slate-900/50">
              {loadingPosts ? (
                <div className="text-center py-10">
                  <Loader2 className="animate-spin w-6 h-6 mx-auto text-blue-500" />
                </div>
              ) : posts.length > 0 ? (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <PostItem
                      key={post.id}
                      post={post}
                      // --- ĐÃ THÊM HÀM CẬP NHẬT STATE ---
                      onDelete={handleDeletePostList}
                      onUpdate={handleUpdatePostList}
                      onImageClick={(img) => setViewingImage(img)}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400 dark:text-gray-500">
                  {t.noPosts}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;
