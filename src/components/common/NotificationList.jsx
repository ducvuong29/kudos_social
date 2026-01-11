// src/components/common/NotificationList.jsx
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/context/UserContext'; // <--- IMPORT MỚI

const NotificationList = () => { // Không cần nhận prop userId nữa
  const { user } = useUser(); // Lấy user từ Context
  const userId = user?.id;

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef(null);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  // 1. Fetch Notifications
  const fetchNotifications = async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('notifications')
      .select(`*, sender:sender_id(full_name, avatar_url)`)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    }
  };

  // 2. Realtime Subscription
  useEffect(() => {
    if (!userId) return; // Chỉ chạy khi có userId

    fetchNotifications();

    const channel = supabase
      .channel('realtime_notif')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [userId]);

  // 3. Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Toggle & Mark as Read
  const handleToggle = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);

    if (newState && unreadCount > 0) {
      // Optimistic update UI
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      
      // Update Server
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId)
        .eq('is_read', false);
    }
  };

  // 5. Handle Click Notification
  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    
    const targetHash = `#post-${notif.resource_id}`;
    
    // Logic điều hướng thông minh
    if (pathname === '/') {
      // Nếu đang ở trang chủ: Cuộn ngay lập tức
      const element = document.getElementById(`post-${notif.resource_id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-blue-200', 'transition-all', 'duration-500');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-200'), 2000);
      } else {
         // Fallback nếu chưa tìm thấy element (có thể do đang load thêm)
         window.location.hash = targetHash;
      }
    } else {
      // Nếu ở trang khác: Chuyển về trang chủ kèm hash
      router.push(`/${targetHash}`);
    }
  };

  if (!userId) return null; // Không hiển thị chuông nếu chưa login

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={handleToggle}
        className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-all focus:outline-none 
            ${showNotifications ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}
        `}
      >
        <Bell className="w-5 h-5 cursor-pointer" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
          <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
            <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
            <span className="text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer">
              Mark all read
            </span>
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">No new notifications</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex gap-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${
                    !notif.is_read ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 border border-gray-100 shrink-0">
                    <AvatarImage src={notif.sender?.avatar_url} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 line-clamp-2 leading-snug">
                      <span className="font-bold text-gray-900">
                        {notif.sender?.full_name}
                      </span>
                      {notif.type === 'kudos' && (
                        <span className="text-gray-600">
                          {' '}
                          sent you a <span className="text-blue-600 font-medium">kudos</span>! 🎉
                        </span>
                      )}
                      {notif.type === 'reaction' && (
                        <span className="text-gray-600"> reacted to your post.</span>
                      )}
                      {notif.type === 'comment' && (
                        <span className="text-gray-600"> commented on your post.</span>
                      )}
                      {notif.type === 'mention' && (
                        <span className="text-gray-600"> mentioned you.</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), {
                        locale: vi,
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationList;