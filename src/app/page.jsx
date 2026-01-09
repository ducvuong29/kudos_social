"use client"

import React, { useState, useEffect } from 'react';
import { Search, Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

import CreateKudos from '@/components/feed/CreateKudos';
import PostItem from '@/components/feed/PostItem';

const NewsFeedPage = () => {
  const supabase = createClient();
  const [currentUser, setCurrentUser] = useState(null);
  const [kudosList, setKudosList] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [viewingImage, setViewingImage] = useState(null);
  
  // Notification States
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // --- INIT DATA ---
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(data);
        fetchNotifications(user.id);
        
        // Subscribe Notifications
        const channel = supabase.channel('feed_notif')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${user.id}` }, () => {
                fetchNotifications(user.id);
            })
            .subscribe();
        return () => supabase.removeChannel(channel);
      }
    };
    init();
    fetchKudos();
  }, []);

  // --- LOGIC SCROLL TO POST (Deep Linking) ---
  useEffect(() => {
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
  }, [isLoadingFeed]); // Chạy khi feed load xong

  // --- FETCH FUNCTIONS ---
  const fetchNotifications = async (userId) => {
    const { data } = await supabase.from('notifications')
        .select(`*, sender:sender_id(full_name, avatar_url)`)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
    if (data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const fetchKudos = async () => {
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
        const formattedData = data.map(post => ({
            ...post,
            comments: post.comments ? post.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : [],
            receiverList: post.recipients ? post.recipients.map(r => r.user) : [],
            image_urls: post.image_urls || (post.image_url ? [post.image_url] : []) // Chuẩn hóa ảnh
        }));
        setKudosList(formattedData);
    }
    setIsLoadingFeed(false);
  };

  // --- HANDLERS ---
  const handlePostDeleted = (postId) => {
      setKudosList(prev => prev.filter(p => p.id !== postId));
  };

  const handlePostUpdated = (updatedPost) => {
      setKudosList(prev => prev.map(p => p.id === updatedPost.id ? updatedPost : p));
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    setShowNotifications(false);
    
    // Scroll ngay tại trang hiện tại (vì đang ở trang chủ rồi)
    const element = document.getElementById(`post-${notif.resource_id}`);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-blue-200', 'transition-all', 'duration-500');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-200'), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8">
       {/* LIGHTBOX */}
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
             <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 relative h-12 w-12 rounded-full hover:bg-white" onClick={() => setShowNotifications(!showNotifications)}>
                <Bell size={28} />
                {unreadCount > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
             </Button>
             
             {showNotifications && (
                <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
                    <div className="p-4 border-b bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold">Thông báo</h3></div>
                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? <p className="p-4 text-center text-gray-400">Trống</p> : notifications.map(notif => (
                            <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 flex gap-4 hover:bg-blue-50 cursor-pointer border-b ${!notif.is_read ? 'bg-blue-50/40' : ''}`}>
                                <Avatar><AvatarImage src={notif.sender?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                <div>
                                    <p className="text-sm text-gray-800 line-clamp-2">
                                        <span className="font-bold">{notif.sender?.full_name}</span> 
                                        {notif.type === 'kudos' && <span className="text-blue-600"> sent you kudos!</span>}
                                        {notif.type === 'reaction' && <span className="text-gray-600"> reacted.</span>}
                                        {notif.type === 'comment' && <span className="text-gray-600"> commented.</span>}
                                        {notif.type === 'mention' && <span className="text-purple-600"> mentioned you.</span>}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{formatDistanceToNow(new Date(notif.created_at), { locale: vi })} trước</p>
                                </div>
                                {!notif.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>}
                            </div>
                        ))}
                    </div>
                </div>
             )}
          </div>
       </div>

       {/* CREATE KUDOS */}
       <CreateKudos currentUser={currentUser} onSuccess={fetchKudos} />

       {/* FEED LIST */}
       <div className="space-y-8 pb-20">
         {isLoadingFeed ? (
            <div className="text-center py-12"><p className="text-gray-400">Đang tải...</p></div>
         ) : (
            kudosList.map(post => (
               <PostItem 
                  key={post.id} 
                  post={post} // Prop chuẩn 'post'
                  currentUser={currentUser} 
                  onDelete={handlePostDeleted}
                  onUpdate={handlePostUpdated}
                  onImageClick={setViewingImage}
               />
            ))
         )}
       </div>
    </div>
  );
};

export default NewsFeedPage;