"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import useSWRInfinite from 'swr/infinite';
import { useUser } from '@/context/UserContext';
import NotificationList from '@/components/common/NotificationList';
import CreateKudos from '@/components/feed/CreateKudos';
import PostItem from '@/components/feed/PostItem';

const PAGE_SIZE = 10;

// 1. Hàm fetcher chuẩn
const fetcher = async (key) => {
  // Parse key để lấy pageIndex
  // Key dạng: "feed_page_0", "feed_page_1"
  const pageIndex = parseInt(key.split('_').pop()); 
  
  const start = pageIndex * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  console.log(`Fetching page ${pageIndex}: ${start} - ${end}`); // Debug log

  const supabase = createClient();
  const { data, error } = await supabase
    .from('kudos')
    .select(`
      *, 
      sender:sender_id(full_name, avatar_url, id), 
      recipients:kudos_receivers(user:user_id(full_name, avatar_url, id)), 
      comments(id, content, created_at, user:user_id(full_name, avatar_url, id)), 
      reactions(type, user_id)
    `)
    .order('created_at', { ascending: false })
    .range(start, end);

  if (error) {
      console.error("Fetch error:", error);
      throw error;
  }
  
  // Format dữ liệu
  return data.map(p => ({
      ...p,
      receiverList: p.recipients ? p.recipients.map(r => r.user) : [],
      image_urls: p.image_urls || (p.image_url ? [p.image_url] : []),
      comments: p.comments ? p.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : [],
      reactions: p.reactions || []
  }));
};

const NewsFeedPage = () => {
  const { user: currentUser } = useUser();
  const [viewingImage, setViewingImage] = useState(null);
  const loadMoreRef = useRef(null);

  // 2. Logic getKey chuẩn cho SWR Infinite
  const getKey = (pageIndex, previousPageData) => {
    // Nếu là trang đầu tiên -> key là feed_page_0
    if (pageIndex === 0) return `feed_page_0`;

    // Nếu trang trước đó trả về null hoặc rỗng -> Hết dữ liệu -> Stop
    if (!previousPageData || previousPageData.length === 0) return null;

    // Nếu trang trước đó trả về ít hơn PAGE_SIZE -> Hết dữ liệu -> Stop
    if (previousPageData.length < PAGE_SIZE) return null;

    return `feed_page_${pageIndex}`;
  }

  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
    revalidateOnFocus: false,
  });

  // 3. Gộp mảng (Flatten) - QUAN TRỌNG
  // data = [[post1, post2], [post3, post4]] -> [post1, post2, post3, post4]
  const kudosList = data ? [].concat(...data) : [];
  
  // Check trạng thái
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");
  const isEmpty = data?.[0]?.length === 0;
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);

  // Debug log để kiểm tra data về chưa
  // console.log("Kudos List:", kudosList); 

  const refreshFeed = () => {
      mutate();
  };

  const deletePostFromList = async (postId) => {
      await mutate(
          (currentData) => {
              if (!currentData) return [];
              return currentData.map(page => page.filter(post => post.id !== postId));
          },
          false
      );
  };

  const updatePostInList = async (updatedPost) => {
      await mutate(
          (currentData) => {
              if (!currentData) return [];
              return currentData.map(page => 
                  page.map(post => post.id === updatedPost.id ? updatedPost : post)
              );
          },
          false
      );
  };

  // Logic Infinite Scroll (Giữ nguyên)
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize(size + 1);
        }
      },
      { threshold: 1.0 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
  }, [isReachingEnd, isLoadingMore, size, setSize]);

  // Deep linking scroll (Giữ nguyên)
  useEffect(() => {
    if (!isLoading && window.location.hash) {
      const id = window.location.hash.substring(1); 
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-blue-200', 'transition-all', 'duration-500');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-200'), 2000);
      }
    }
  }, [isLoading]); 

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
       {/* Lightbox */}
       {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()}/>
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full"><X size={24}/></button>
        </div>
       )}

       {/* Header */}
       <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-40 py-2">
          <div className="flex-1 max-w-2xl relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={20} />
             <Input placeholder="Search kudos..." className="pl-12 py-6 bg-white border-gray-200 focus:ring-blue-500 rounded-full shadow-sm text-base" />
          </div>
          <div className="relative ml-4">
             <NotificationList />
          </div>
       </div>

       <CreateKudos onSuccess={refreshFeed} />

       <div className="space-y-8 pb-20">
         {/* Chỉ hiện loading xoay xoay khi LẦN ĐẦU TIÊN vào trang và chưa có data */}
         {isLoading && kudosList.length === 0 ? (
            <div className="text-center py-12"><Loader2 className="animate-spin text-blue-500 w-8 h-8 mx-auto"/></div>
         ) : (
           <>
               {kudosList.length > 0 ? (
                   kudosList.map(post => (
                   <PostItem 
                       key={post.id} 
                       post={post} 
                       onDelete={deletePostFromList} 
                       onUpdate={updatePostInList}   
                       onImageClick={setViewingImage}
                   />
                   ))
               ) : (
                   <div className="text-center text-gray-500 py-10">Chưa có bài viết nào. Hãy là người đầu tiên!</div>
               )}

               {/* Load more indicator */}
               <div ref={loadMoreRef} className="h-10 flex items-center justify-center w-full mt-4">
                   {isLoadingMore && <Loader2 className="animate-spin text-blue-500 w-6 h-6" />}
                   {isReachingEnd && kudosList.length > 0 && <p className="text-gray-400 text-sm">Bạn đã xem hết tin!</p>}
               </div>
           </>
         )}
       </div>
    </div>
  );
};

export default NewsFeedPage;