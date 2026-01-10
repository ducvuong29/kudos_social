"use client"

import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Import Context Hooks
import { useUser } from '@/context/UserContext';
import { useKudos } from '@/context/KudosContext';

// Import Components
import NotificationList from '@/components/common/NotificationList';
import CreateKudos from '@/components/feed/CreateKudos';
import PostItem from '@/components/feed/PostItem';

const NewsFeedPage = () => {
  // 1. Lấy dữ liệu User từ Context
  const { user: currentUser } = useUser();

  // 2. Lấy dữ liệu Feed từ KudosContext
  const { 
    kudosList, 
    isLoadingFeed, 
    fetchKudos, 
    updatePostInList, 
    deletePostFromList 
  } = useKudos();

  // State UI cục bộ (Lightbox xem ảnh)
  const [viewingImage, setViewingImage] = useState(null);
  
  // --- LOGIC SCROLL TO POST (Deep Linking) ---
  useEffect(() => {
    // Chỉ chạy khi feed đã load xong (từ Context) và URL có chứa hash
    if (!isLoadingFeed && window.location.hash) {
      const id = window.location.hash.substring(1); // Lấy id từ URL (#post-123 -> post-123)
      const element = document.getElementById(id);

      if (element) {
        // Cuộn mượt
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight hiệu ứng
        element.classList.add('ring-4', 'ring-blue-200', 'transition-all', 'duration-500');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-200'), 2000);
      }
    }
  }, [isLoadingFeed]); // Phụ thuộc vào biến isLoadingFeed của Context

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
       {/* LIGHTBOX (Giữ nguyên logic UI cục bộ) */}
       {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} className="max-w-full max-h-full object-contain rounded-lg" onClick={e => e.stopPropagation()}/>
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full"><X size={24}/></button>
        </div>
       )}

       {/* HEADER */}
       <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-40 py-2">
          <div className="flex-1 max-w-2xl relative group">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={20} />
             <Input placeholder="Search kudos..." className="pl-12 py-6 bg-white border-gray-200 focus:ring-blue-500 rounded-full shadow-sm text-base" />
          </div>
          <div className="relative ml-4">
             {/* NotificationList tự fetch và quản lý logic của nó */}
             <NotificationList  />
          </div>
       </div>

       {/* CREATE KUDOS */}
       {/* onSuccess gọi fetchKudos từ Context để làm mới list */}
       <CreateKudos />
       {/* FEED LIST */}
       <div className="space-y-8 pb-20">
         {isLoadingFeed ? (
            <div className="text-center py-12"><p className="text-gray-400">Đang tải...</p></div>
         ) : (
            kudosList.map(post => (
               <PostItem 
                  key={post.id} 
                  post={post} 
                  currentUser={currentUser} 
                  // Sử dụng hàm từ Context thay vì hàm cục bộ
                  onDelete={deletePostFromList}
                  onUpdate={updatePostInList}
                  onImageClick={setViewingImage}
               />
            ))
         )}
       </div>
    </div>
  );
};

export default NewsFeedPage;