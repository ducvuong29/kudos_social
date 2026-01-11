// src/components/common/NotificationList.jsx
"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
// import { vi } from 'date-fns/locale'; // Tạm thời bỏ locale cứng
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/context/UserContext';
import { useApp } from '@/context/AppProvider';

const NotificationList = () => {
  const { user } = useUser();
  const userId = user?.id;
  const { t } = useApp();

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
    if (!userId) return;
    fetchNotifications();
    const channel = supabase
      .channel('realtime_notif')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${userId}` },
        (payload) => { fetchNotifications(); }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [userId]);

  // 3. Click Outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 4. Toggle
  const handleToggle = async () => {
    const newState = !showNotifications;
    setShowNotifications(newState);
    if (newState && unreadCount > 0) {
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      await supabase.from('notifications').update({ is_read: true }).eq('recipient_id', userId).eq('is_read', false);
    }
  };

  // 5. Handle Click
  const handleNotificationClick = (notif) => {
    setShowNotifications(false);
    const targetHash = `#post-${notif.resource_id}`;
    if (pathname === '/') {
      const element = document.getElementById(`post-${notif.resource_id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-blue-200', 'transition-all', 'duration-500');
        setTimeout(() => element.classList.remove('ring-4', 'ring-blue-200'), 2000);
      } else {
         window.location.hash = targetHash;
      }
    } else {
      router.push(`/${targetHash}`);
    }
  };

  if (!userId) return null;

  return (
    <div className="relative" ref={notificationRef}>
      <button
        onClick={handleToggle}
        className={`relative h-10 w-10 flex items-center justify-center rounded-full transition-all focus:outline-none cursor-pointer
            ${showNotifications 
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-900 dark:hover:text-white'}
        `}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white dark:border-slate-900 animate-bounce">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 origin-top-right">
          <div className="p-4 border-b border-gray-50 dark:border-slate-700 flex justify-between items-center bg-gray-50/30 dark:bg-slate-900/50">
            <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{t.notifications}</h3>
            <span className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium cursor-pointer">
              {t.markAllRead}
            </span>
          </div>
          
          <div className="max-h-[350px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-400 dark:text-gray-500">
                <Bell className="w-8 h-8 mb-2 opacity-20" />
                <p className="text-sm">{t.noNewNotifications}</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-4 flex gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer border-b border-gray-50 dark:border-slate-700 last:border-0 transition-colors ${
                    !notif.is_read ? 'bg-blue-50/60 dark:bg-blue-900/40 border-l-4 border-l-blue-500' : ''
                  }`}
                >
                  <Avatar className="w-10 h-10 border border-gray-100 dark:border-slate-600 shrink-0">
                    <AvatarImage src={notif.sender?.avatar_url} />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm line-clamp-2 leading-snug ${!notif.is_read ? 'font-medium text-gray-900 dark:text-white' : 'text-gray-800 dark:text-gray-200'}`}>
                      <span className="font-bold text-gray-900 dark:text-white">
                        {notif.sender?.full_name}
                      </span>{' '}
                      {notif.type === 'kudos' && (
                        <span className="text-gray-600 dark:text-gray-400">
                          {t.sentYouAKudos}
                        </span>
                      )}
                      {notif.type === 'reaction' && (
                        <span className="text-gray-600 dark:text-gray-400"> {t.reactedToYourPost}</span>
                      )}
                      {notif.type === 'comment' && (
                        <span className="text-gray-600 dark:text-gray-400"> {t.commentedOnYourPost}</span>
                      )}
                      {notif.type === 'mention' && (
                        <span className="text-gray-600 dark:text-gray-400"> {t.mentionedYou}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!notif.is_read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0 animate-pulse"></div>
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