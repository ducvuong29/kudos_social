"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const KudosContext = createContext();

export const KudosProvider = ({ children }) => {
  const supabase = createClient();
  const [kudosList, setKudosList] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);

  // Hàm fetch dữ liệu chính
  const fetchKudos = async () => {
    // Không set loading = true ở đây để tránh hiện spinner khi refresh ngầm (background update)
    try {
      const { data, error } = await supabase.from('kudos')
        .select(`
          *, 
          sender:sender_id (full_name, avatar_url, id, email), 
          recipients:kudos_receivers ( user:user_id (id, full_name, avatar_url) ),
          comments (id, content, created_at, user:user_id (full_name, avatar_url, id)), 
          reactions (type, user_id)
        `)
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Format dữ liệu chuẩn ngay tại nguồn
        const formattedData = data.map(post => ({
            ...post,
            comments: post.comments ? post.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : [],
            receiverList: post.recipients ? post.recipients.map(r => r.user) : [],
            image_urls: post.image_urls || (post.image_url ? [post.image_url] : [])
        }));
        setKudosList(formattedData);
      }
    } catch (error) {
      console.error("Lỗi tải feed:", error);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  // Helper: Cập nhật 1 bài viết trong list (dùng cho Like/Comment) để không phải fetch lại API
  const updatePostInList = (updatedPost) => {
    setKudosList(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  // Helper: Xóa 1 bài viết khỏi list
  const deletePostFromList = (postId) => {
    setKudosList(prev => prev.filter(p => p.id !== postId));
  };

  // Helper: Thêm bài mới lên đầu (dùng khi đăng bài)
  const addNewPost = (newPost) => {
     // Vì newPost trả về từ insert thường chưa có full relation (sender, recipient...), 
     // nên tốt nhất là gọi fetchKudos() hoặc xử lý kỹ phần này. 
     // Ở đây mình gọi fetchKudos cho an toàn.
     fetchKudos();
  };

  // Initial Fetch (Chỉ chạy 1 lần khi app khởi động hoặc refresh F5)
  useEffect(() => {
    fetchKudos();
  }, []);

  return (
    <KudosContext.Provider value={{ 
        kudosList, 
        isLoadingFeed, 
        fetchKudos, 
        updatePostInList, 
        deletePostFromList,
        addNewPost
    }}>
      {children}
    </KudosContext.Provider>
  );
};

export const useKudos = () => useContext(KudosContext);