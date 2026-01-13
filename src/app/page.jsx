"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import useSWRInfinite from "swr/infinite";
import { useUser } from "@/context/UserContext";
import NotificationList from "@/components/common/NotificationList";
import CreateKudos from "@/components/feed/CreateKudos";
import PostItem from "@/components/feed/PostItem";
import { useApp } from "@/context/AppProvider";

const PAGE_SIZE = 10;

// --- 1. FETCHER GIỮ NGUYÊN ---
const fetcher = async (key) => {
  const parts = key.split("_q_");
  const pageIndex = parseInt(parts[0].split("_").pop());
  const searchQuery = parts[1] || "";

  const start = pageIndex * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  const supabase = createClient();

  let query = supabase
    .from("kudos")
    .select(
      `
      *, 
      sender:sender_id(full_name, avatar_url, id), 
      recipients:kudos_receivers(user:user_id(full_name, avatar_url, id)), 
      comments(id, content, created_at, user:user_id(full_name, avatar_url, id)), 
      reactions(type, user_id)
    `
    )
    .order("created_at", { ascending: false })
    .range(start, end);

  if (searchQuery) {
    query = query.ilike("message", `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data.map((p) => ({
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
};

const NewsFeedPage = () => {
  const { user: currentUser } = useUser();
  const [viewingImage, setViewingImage] = useState(null);
  const loadMoreRef = useRef(null);
  const supabase = createClient();
  const { t } = useApp();

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const getKey = (pageIndex, previousPageData) => {
    const keyBase = `feed_page_${pageIndex}_q_${debouncedSearch}`;
    if (pageIndex === 0) return keyBase;
    if (!previousPageData || previousPageData.length === 0) return null;
    if (previousPageData.length < PAGE_SIZE) return null;
    return keyBase;
  };

  const { data, size, setSize, isLoading, mutate, isValidating } =
    useSWRInfinite(getKey, fetcher, {
      revalidateFirstPage: false,
      persistSize: true,
      revalidateOnFocus: false, // Tắt cái này để tránh flash lại list khi click thông báo
    });

  const kudosList = data ? data.flat() : [];

  // Logic check loading ổn định
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = !isLoading && kudosList.length === 0;
  const isReachingEnd =
    isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);

  const refreshFeed = () => {
    mutate();
  };

  // --- HÀM 1: XỬ LÝ KHI CÓ BÀI VIẾT MỚI (REALTIME) ---
  const handleNewPostRealtime = async (newPostId) => {
    // 1. Fetch đầy đủ thông tin của bài viết mới (kèm sender, receivers...)
    const { data: newPostData, error } = await supabase
      .from("kudos")
      .select(
        `
        *, 
        sender:sender_id(full_name, avatar_url, id), 
        recipients:kudos_receivers(user:user_id(full_name, avatar_url, id)), 
        comments(id, content, created_at, user:user_id(full_name, avatar_url, id)), 
        reactions(type, user_id)
      `
      )
      .eq("id", newPostId)
      .single();

    if (error || !newPostData) return;

    // 2. Format dữ liệu cho khớp với cấu trúc hiển thị
    const formattedPost = {
      ...newPostData,
      receiverList: newPostData.recipients
        ? newPostData.recipients.map((r) => r.user)
        : [],
      image_urls:
        newPostData.image_urls ||
        (newPostData.image_url ? [newPostData.image_url] : []),
      comments: [],
      reactions: [],
    };

    // 3. Cập nhật Cache SWR: Chèn bài mới vào đầu trang 1
    await mutate((currentData) => {
      if (!currentData) return [[formattedPost]];
      const newFirstPage = [formattedPost, ...currentData[0]];
      return [newFirstPage, ...currentData.slice(1)];
    }, false);
  };

  // --- HÀM 2: XỬ LÝ KHI CÓ COMMENT MỚI (REALTIME) ---
  const handleNewCommentRealtime = async (newCommentId) => {
    // 1. Fetch thông tin comment kèm user
    const { data: commentData, error } = await supabase
      .from("comments")
      .select(
        `id, content, created_at, kudos_id, user:user_id(full_name, avatar_url, id)`
      )
      .eq("id", newCommentId)
      .single();

    if (error || !commentData) return;

    // 2. Update vào post tương ứng trong Cache SWR
    await mutate((currentData) => {
      if (!currentData) return currentData;
      return currentData.map((page) =>
        page.map((post) => {
          if (post.id === commentData.kudos_id) {
            // Kiểm tra xem comment đã tồn tại chưa (tránh trùng lặp)
            const exists = post.comments.some((c) => c.id === commentData.id);
            if (exists) return post;

            return {
              ...post,
              comments: [...post.comments, commentData],
            };
          }
          return post;
        })
      );
    }, false);
  };

  // --- SETUP REALTIME SUBSCRIPTION ---
  useEffect(() => {
    const channel = supabase
      .channel("feed_realtime_updates")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "kudos" },
        (payload) => {
          // Nếu có bài mới insert -> Gọi hàm xử lý
          handleNewPostRealtime(payload.new.id);
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "comments" },
        (payload) => {
          // Nếu có comment mới insert -> Gọi hàm xử lý
          handleNewCommentRealtime(payload.new.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const deletePostFromList = async (postId) => {
    await mutate((currentData) => {
      if (!currentData) return [];
      return currentData.map((page) => page.filter((p) => p.id !== postId));
    }, false);
  };

  const updatePostInList = async (updatedPost) => {
    await mutate((currentData) => {
      if (!currentData) return [];
      return currentData.map((page) =>
        page.map((p) =>
          p.id === updatedPost.id ? { ...p, ...updatedPost } : p
        )
      );
    }, false);
  };

  // Logic Infinite Scroll (Dùng ref để ổn định)
  const isLoadingMoreRef = useRef(isLoadingMore);
  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    if (isLoadingMore || isReachingEnd) return; // Chặn observer nếu đang load hoặc hết

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMoreRef.current) {
          setSize((prev) => prev + 1);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => {
      if (loadMoreRef.current) observer.unobserve(loadMoreRef.current);
    };
  }, [isReachingEnd, setSize]); // Dependency tối giản

  // Reset scroll khi tìm kiếm
  useEffect(() => {
    if (debouncedSearch) window.scrollTo({ top: 0, behavior: "smooth" });
  }, [debouncedSearch]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
      {viewingImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 cursor-pointer"
          onClick={() => setViewingImage(null)}
        >
          <img
            src={viewingImage}
            className="max-w-full max-h-full object-contain rounded-lg cursor-default"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setViewingImage(null)}
            className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer"
          >
            <X size={24} />
          </button>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-40 py-2 transition-colors">
        <div className="flex-1 max-w-2xl relative group">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500"
            size={20}
          />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="pl-12 py-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500 rounded-full shadow-sm text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div className="relative ml-4">
          <NotificationList />
        </div>
      </div>

      {!debouncedSearch && <CreateKudos onSuccess={refreshFeed} />}

      <div className="space-y-8 pb-20">
        {isLoading && size === 1 ? (
          <div className="text-center py-12">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8 mx-auto" />
          </div>
        ) : (
          <>
            {kudosList.length > 0 ? (
              kudosList.map((post) => (
                <PostItem
                  key={post.id}
                  post={post}
                  onDelete={deletePostFromList}
                  onUpdate={updatePostInList}
                  onImageClick={setViewingImage}
                />
              ))
            ) : (
              <div className="text-center py-20">
                {debouncedSearch ? (
                  <>
                    <div className="text-4xl mb-4">🔍</div>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                      {t.noResults} "{debouncedSearch}"
                    </p>
                  </>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    {t.noPosts}
                  </div>
                )}
              </div>
            )}

            {/* LOAD MORE */}
            {!isReachingEnd && (
              <div
                ref={loadMoreRef}
                className="h-20 flex items-center justify-center w-full mt-4"
              >
                {isLoadingMore ? (
                  <Loader2 className="animate-spin text-blue-500 w-6 h-6" />
                ) : (
                  <div className="h-4 w-full" />
                )}
              </div>
            )}

            {isReachingEnd && kudosList.length > 0 && (
              <p className="text-center py-8 text-gray-400 dark:text-gray-500 text-sm">
                {t.endOfList}
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NewsFeedPage;
