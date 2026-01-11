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
import { useApp } from '@/context/AppProvider';
const PAGE_SIZE = 10;

// --- 1. SỬA FETCHER ĐỂ XỬ LÝ TÌM KIẾM ---
const fetcher = async (key) => {
  // Key format: "feed_page_{pageIndex}_q_{searchQuery}"
  const parts = key.split('_q_');
  const pageIndex = parseInt(parts[0].split('_').pop());
  const searchQuery = parts[1] || ''; // Lấy từ khóa tìm kiếm
  
  const start = pageIndex * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;

  // console.log(`Fetching page ${pageIndex} [${searchQuery}]: ${start}-${end}`);

  const supabase = createClient();
  
  // Tạo query cơ bản
  let query = supabase
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

  // Áp dụng bộ lọc tìm kiếm (Nếu có)
  if (searchQuery) {
      // Tìm kiếm trong nội dung tin nhắn (message)
      // Lưu ý: Tìm theo tên người gửi/nhận phức tạp hơn, MVP ta tìm theo nội dung trước
      query = query.ilike('message', `%${searchQuery}%`);
  }

  const { data, error } = await query;

  if (error) throw error;
  
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
  const { t } = useApp(); // <--- SỬ DỤNG HOOK NGÔN NGỮ
  // --- STATE CHO TÌM KIẾM ---
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce logic: Đợi người dùng ngừng gõ 500ms mới tìm để đỡ gọi API nhiều
  useEffect(() => {
      const timer = setTimeout(() => {
          setDebouncedSearch(searchInput);
      }, 500);
      return () => clearTimeout(timer);
  }, [searchInput]);


  // --- 2. LOGIC GETKEY (Thêm Search Query vào Key) ---
  const getKey = (pageIndex, previousPageData) => {
    // Tạo key chứa từ khóa tìm kiếm
    const keyBase = `feed_page_${pageIndex}_q_${debouncedSearch}`;

    if (pageIndex === 0) return keyBase;
    
    // Nếu trang trước trả về rỗng -> Hết dữ liệu
    if (!previousPageData || previousPageData.length === 0) return null;
    
    // Nếu trang trước trả về ít hơn PAGE_SIZE -> Hết dữ liệu
    if (previousPageData.length < PAGE_SIZE) return null;

    return keyBase;
  }

  const { data, size, setSize, isLoading, mutate } = useSWRInfinite(getKey, fetcher, {
    revalidateFirstPage: false,
    persistSize: true,
    revalidateOnFocus: false,
  });

  const kudosList = data ? [].concat(...data) : [];
  const isLoadingMore = isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  // --- 3. FIX LỖI REFERENCE ERROR TẠI ĐÂY ---
  // Phải khai báo 'isEmpty' TRƯỚC khi dùng nó trong 'isReachingEnd'
  const isEmpty = !isLoading && kudosList.length === 0; 
  
  // Dùng isEmpty ở dòng dưới này là an toàn
  const isReachingEnd = isEmpty || (data && data[data.length - 1]?.length < PAGE_SIZE);


  const refreshFeed = () => { mutate(); };

  const deletePostFromList = async (postId) => {
      await mutate(data => data ? data.map(page => page.filter(p => p.id !== postId)) : [], false);
  };

  const updatePostInList = async (updatedPost) => {
      await mutate(data => data ? data.map(page => page.map(p => p.id === updatedPost.id ? updatedPost : p)) : [], false);
  };

  // Logic Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isReachingEnd && !isLoadingMore) {
          setSize(size + 1);
        }
      }, { threshold: 1.0 }
    );
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => { if (loadMoreRef.current) observer.unobserve(loadMoreRef.current); };
  }, [isReachingEnd, isLoadingMore, size, setSize]);

  // Reset scroll khi tìm kiếm
  useEffect(() => {
      if(debouncedSearch) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [debouncedSearch]);

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
       {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4 cursor-pointer" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} className="max-w-full max-h-full object-contain rounded-lg cursor-default" onClick={e => e.stopPropagation()}/>
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full hover:bg-white/30 cursor-pointer"><X size={24}/></button>
        </div>
       )}

       {/* HEADER: Thêm dark:bg-slate-900/95 */}
       <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-40 py-2 transition-colors">
          <div className="flex-1 max-w-2xl relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={20} />
             
             {/* INPUT: Thêm dark:bg-slate-800 dark:text-white dark:border-gray-700 */}
             <Input 
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t.searchPlaceholder} 
                className="pl-12 py-6 bg-white dark:bg-slate-800 border-gray-200 dark:border-gray-700 focus:ring-blue-500 rounded-full shadow-sm text-base text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
             />
             {searchInput && (
                 <button onClick={() => setSearchInput('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-pointer">
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
                   <div className="text-center py-20">
                       {debouncedSearch ? (
                           <>
                               <div className="text-4xl mb-4">🔍</div>
                               <p className="text-gray-500 dark:text-gray-400 text-lg">{t.noResults} "{debouncedSearch}"</p>
                           </>
                       ) : (
                           <div className="text-center text-gray-500 dark:text-gray-400">{t.noPosts}</div>
                       )}
                   </div>
               )}

               <div ref={loadMoreRef} className="h-10 flex items-center justify-center w-full mt-4">
                   {isLoadingMore && <Loader2 className="animate-spin text-blue-500 w-6 h-6" />}
                   {isReachingEnd && kudosList.length > 0 && <p className="text-gray-400 dark:text-gray-500 text-sm">{t.endOfList}</p>}
               </div>
           </>
         )}
       </div>
    </div>
  );
};

export default NewsFeedPage;