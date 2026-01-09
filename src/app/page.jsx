"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Home, Trophy, User, Settings, LogOut, Bell, Search, Hash, Image as ImageIcon, AtSign, ThumbsUp, MessageSquare, Share2, Star, X, Sparkles, Maximize2, Send, MoreHorizontal, Trash2, Edit2, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client'; 
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion'; 
import confetti from 'canvas-confetti';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale'; 

// --- DỮ LIỆU MOCK ---
const topGivers = [
  { rank: 1, name: 'Marcus Chen', kudos: 45, avatar: '/api/placeholder/32/32' },
  { rank: 2, name: 'Anita Roy', kudos: 38, avatar: '/api/placeholder/32/32' },
  { rank: 3, name: 'Tyrone Biggums', kudos: 32, avatar: '/api/placeholder/32/32' }
];
const trendingTags = ['#TeamWork', '#ProblemSolver', '#Q3Goals', '#OfficeLife', '#FridayFeeling'];
const predefinedTags = ['Excellent', 'Brilliant', 'TeamWork', 'LifeSaver', 'DataWizard', 'ProblemSolver', 'Creative', 'Leadership', 'Innovative'];

const REACTION_TYPES = [
  { id: 'like', emoji: '👍', label: 'Thích', color: 'text-blue-600' },
  { id: 'love', emoji: '❤️', label: 'Yêu', color: 'text-red-500' },
  { id: 'haha', emoji: '😆', label: 'Haha', color: 'text-yellow-500' },
  { id: 'wow',  emoji: '😮', label: 'Wow',  color: 'text-orange-500' },
  { id: 'sad',  emoji: '😢', label: 'Buồn',  color: 'text-yellow-600' },
  { id: 'angry', emoji: '😡', label: 'Phẫn nộ', color: 'text-red-700' },
];

const getTagColor = (tag) => {
  const colorMap = {
    'Excellent': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Brilliant': 'bg-orange-100 text-orange-700 border-orange-200',
    'TeamWork': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    'LifeSaver': 'bg-rose-100 text-rose-700 border-rose-200',
    'DataWizard': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    'ProblemSolver': 'bg-violet-100 text-violet-700 border-violet-200',
    'Creative': 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200',
    'Leadership': 'bg-red-100 text-red-700 border-red-200',
    'Innovative': 'bg-indigo-100 text-indigo-700 border-indigo-200'
  };
  return colorMap[tag] || 'bg-gray-100 text-gray-700 border-gray-200';
};

const triggerConfetti = () => {
  const count = 200;
  const defaults = { origin: { y: 0.7 } };
  function fire(particleRatio, opts) {
    confetti({ ...defaults, ...opts, particleCount: Math.floor(count * particleRatio) });
  }
  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
  fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
  fire(0.1, { spread: 120, startVelocity: 45 });
};

const KudosSocialDashboard = () => {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef(null);
  
  // Refs
  const searchContainerRef = useRef(null); 
  const atButtonRef = useRef(null); 

  // --- STATE ---
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('feed');
  const [viewingImage, setViewingImage] = useState(null);
  const [kudosList, setKudosList] = useState([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Form State
  const [kudosMessage, setKudosMessage] = useState('');
  const [selectedReceivers, setSelectedReceivers] = useState([]); 
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI Toggles
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState('All');

  // Comment & Reaction State
  const [activeCommentBox, setActiveCommentBox] = useState(null); 
  const [commentInputs, setCommentInputs] = useState({}); 
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const [pendingMentions, setPendingMentions] = useState({}); 
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // --- POST MANAGEMENT STATE ---
  const [activePostMenuId, setActivePostMenuId] = useState(null); 
  const [editingPostId, setEditingPostId] = useState(null); 
  const [editPostMessage, setEditPostMessage] = useState(''); 

  // 1. INIT
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        setCurrentUser(data);
        fetchNotifications(user.id);
        
        const channel = supabase
          .channel('realtime_notifications')
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

  // --- CLICK OUTSIDE (ĐÃ FIX LỖI MENU) ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (showUserSearch) {
        if (
            searchContainerRef.current && 
            !searchContainerRef.current.contains(event.target) &&
            atButtonRef.current &&
            !atButtonRef.current.contains(event.target)
        ) {
          setShowUserSearch(false);
        }
      }
      
      // FIX LỖI: Chỉ đóng menu nếu click RA NGOÀI cả icon trigger VÀ cái menu dropdown
      if (activePostMenuId) {
          const isClickInsideTrigger = event.target.closest('.post-menu-trigger');
          const isClickInsideMenu = event.target.closest('.post-menu-dropdown');
          
          if (!isClickInsideTrigger && !isClickInsideMenu) {
              setActivePostMenuId(null);
          }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showUserSearch, activePostMenuId]);

  const fetchNotifications = async (userId) => {
    const { data, error } = await supabase.from('notifications').select(`*, sender:sender_id(full_name, avatar_url)`).eq('recipient_id', userId).order('created_at', { ascending: false }).limit(20);
    if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
    }
  };

  const fetchKudos = async () => {
    setIsLoadingFeed(true);
    const { data, error } = await supabase.from('kudos')
      .select(`
        *, 
        sender:sender_id (full_name, avatar_url, id, email), 
        recipients:kudos_receivers (
            user:user_id (id, full_name, avatar_url, email)
        ),
        comments (id, content, created_at, user:user_id (full_name, avatar_url, id)), 
        reactions (type, user_id)
      `)
      .order('created_at', { ascending: false });

    if (!error && data) {
        const formattedData = data.map(post => ({
            ...post,
            comments: post.comments ? post.comments.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)) : [],
            receiverList: post.recipients ? post.recipients.map(r => r.user) : []
        }));
        setKudosList(formattedData);
    }
    setIsLoadingFeed(false);
  };

  // --- POST ACTIONS (DELETE / EDIT) ---
  const handleDeletePost = async (postId) => {
      // 1. Đóng menu ngay để tránh lỗi UI
      setActivePostMenuId(null);

      // 2. Hỏi xác nhận
      if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không? Hành động này không thể hoàn tác.")) return;
      
      // 3. Gọi Supabase
      const { error } = await supabase.from('kudos').delete().eq('id', postId);
      if (error) {
          console.error(error);
          alert("Lỗi khi xóa bài viết: " + error.message + "\n(Hãy kiểm tra xem bạn đã bật Policy Delete trong Database chưa)");
      } else {
          // Xóa thành công -> Update UI
          setKudosList(prev => prev.filter(p => p.id !== postId));
      }
  };

  const startEditingPost = (post) => {
      setEditingPostId(post.id);
      setEditPostMessage(post.message);
      setActivePostMenuId(null); // Đóng menu
  };

  const cancelEditingPost = () => {
      setEditingPostId(null);
      setEditPostMessage('');
  };

  const handleUpdatePost = async (postId) => {
      if (!editPostMessage.trim()) {
          alert("Nội dung không được để trống!");
          return;
      }

      const { error } = await supabase.from('kudos').update({ message: editPostMessage }).eq('id', postId);
      
      if (error) {
          console.error(error);
          alert("Lỗi cập nhật: " + error.message + "\n(Hãy kiểm tra xem bạn đã bật Policy Update trong Database chưa)");
      } else {
          setKudosList(prev => prev.map(p => p.id === postId ? { ...p, message: editPostMessage } : p));
          setEditingPostId(null);
          setEditPostMessage('');
      }
  };

  // --- OTHER ACTIONS ---
  const createNotification = async (recipientId, type, resourceId) => {
    if (!currentUser) return;
    await supabase.from('notifications').insert({ recipient_id: recipientId, sender_id: currentUser.id, type: type, resource_id: resourceId });
  };

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    setCurrentView('feed');
    setShowNotifications(false);
    setTimeout(() => {
        const element = document.getElementById(`post-${notif.resource_id}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-blue-200', 'transition-all', 'duration-1000');
            setTimeout(() => element.classList.remove('ring-4', 'ring-blue-200'), 3000);
        } else alert("Không tìm thấy bài viết.");
    }, 500);
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const file of selectedFiles) {
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${file.name.split('.').pop()}`;
      const { error } = await supabase.storage.from('kudos_images').upload(`${currentUser.id}/${fileName}`, file);
      if (!error) {
        const { data } = supabase.storage.from('kudos_images').getPublicUrl(`${currentUser.id}/${fileName}`);
        if (data) uploadedUrls.push(data.publicUrl);
      }
    }
    return uploadedUrls;
  };

  const addReceiver = (user) => {
    if (selectedReceivers.find(u => u.id === user.id)) {
        setUserSearchQuery('');
        return; 
    }
    setSelectedReceivers(prev => [...prev, user]);
    setUserSearchQuery(''); 
  };

  const removeReceiver = (userId) => {
    setSelectedReceivers(prev => prev.filter(u => u.id !== userId));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Backspace' && userSearchQuery === '' && selectedReceivers.length > 0) {
        e.preventDefault();
        const newReceivers = [...selectedReceivers];
        newReceivers.pop(); 
        setSelectedReceivers(newReceivers);
    }
  };

  const createKudos = async () => {
    if ((!kudosMessage.trim() && selectedFiles.length === 0) || selectedReceivers.length === 0) {
      alert('Vui lòng chọn ít nhất 1 người nhận và nhập nội dung!'); return;
    }
    setIsSubmitting(true);
    try {
      const imageUrls = selectedFiles.length > 0 ? await uploadImages() : [];
      const { data: newKudos, error } = await supabase.from('kudos').insert([{
        sender_id: currentUser?.id,
        receiver_id: selectedReceivers[0].id, 
        message: kudosMessage,
        tags: selectedTags,
        image_urls: imageUrls
      }]).select().single();

      if (error) throw error;

      const receiversData = selectedReceivers.map(r => ({
          kudos_id: newKudos.id,
          user_id: r.id
      }));
      await supabase.from('kudos_receivers').insert(receiversData);

      for (const r of selectedReceivers) {
          await createNotification(r.id, 'kudos', newKudos.id);
      }

      setKudosMessage(''); setSelectedReceivers([]); setSelectedTags([]); setSelectedFiles([]); setPreviewUrls([]);
      await fetchKudos();
    } catch (e) { 
        console.error(e);
        alert('Lỗi: ' + e.message); 
    } 
    finally { setIsSubmitting(false); }
  };

  const handleReaction = async (post, type) => {
    const existingReaction = post.reactions.find(r => r.user_id === currentUser.id);
    const isRemoving = existingReaction && existingReaction.type === type; 
    const updatedList = kudosList.map(p => {
        if (p.id === post.id) {
            let newReactions = p.reactions.filter(r => r.user_id !== currentUser.id);
            if (!isRemoving) {
                newReactions.push({ user_id: currentUser.id, type });
                triggerConfetti();
            }
            return { ...p, reactions: newReactions };
        }
        return p;
    });
    setKudosList(updatedList);
    await supabase.from('reactions').delete().match({ kudos_id: post.id, user_id: currentUser.id });
    if (!isRemoving) {
        await supabase.from('reactions').insert({ kudos_id: post.id, user_id: currentUser.id, type });
        if (post.sender.id !== currentUser.id) await createNotification(post.sender.id, 'reaction', post.id);
    }
  };

  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      if (selectedTags.length >= 5) {
          alert("Bạn chỉ được chọn tối đa 5 thẻ!");
          return;
      }
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleCommentInput = (postId, e) => {
    const val = e.target.value;
    setCommentInputs(prev => ({ ...prev, [postId]: val }));
    const cursor = e.target.selectionStart;
    setCursorPos(cursor);
    const textBeforeCursor = val.slice(0, cursor);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    if (currentWord.startsWith('@')) {
        setShowMentionPopup(true);
        setMentionQuery(currentWord.substring(1));
    } else {
        setShowMentionPopup(false);
    }
  };

  const insertMention = (postId, user) => {
    const text = commentInputs[postId] || '';
    const textBeforeCursor = text.slice(0, cursorPos);
    const textAfterCursor = text.slice(cursorPos);
    const words = textBeforeCursor.split(/\s+/);
    words.pop(); 
    const newText = words.join(' ') + ` @${user.full_name} ` + textAfterCursor;
    setCommentInputs(prev => ({ ...prev, [postId]: newText }));
    setShowMentionPopup(false);
    setPendingMentions(prev => {
        const currentList = prev[postId] || [];
        if (!currentList.find(u => u.id === user.id)) {
            return { ...prev, [postId]: [...currentList, user] };
        }
        return prev;
    });
  };

  const submitComment = async (post) => {
    const content = commentInputs[post.id];
    if (!content?.trim()) return;
    const { data: newComment, error } = await supabase.from('comments').insert({ kudos_id: post.id, user_id: currentUser.id, content }).select('*, user:user_id(full_name, avatar_url, id)').single();
    if (!error) {
        const updatedList = kudosList.map(p => {
            if (p.id === post.id) return { ...p, comments: [...(p.comments || []), newComment] };
            return p;
        });
        setKudosList(updatedList);
        setCommentInputs(prev => ({ ...prev, [post.id]: '' }));
        if (post.sender.id !== currentUser.id) await createNotification(post.sender.id, 'comment', post.id);
        const mentions = pendingMentions[post.id] || [];
        const processedIds = new Set();
        for (const user of mentions) {
            if (content.includes(user.full_name) && !processedIds.has(user.id)) {
                await createNotification(user.id, 'mention', post.id);
                processedIds.add(user.id);
            }
        }
        setPendingMentions(prev => ({ ...prev, [post.id]: [] }));
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
        const files = Array.from(e.target.files);
        if(files.some(f=>f.size>5*1024*1024)) return alert("File > 5MB");
        setSelectedFiles(p => [...p, ...files]);
        setPreviewUrls(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
    }
  };
  const removeImage = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleDeleteComment = async (commentId, postId) => {
    if(!confirm("Xóa bình luận?")) return;
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if(!error) {
        setKudosList(prev => prev.map(post => {
            if(post.id === postId) {
                return { ...post, comments: post.comments.filter(c => c.id !== commentId) };
            }
            return post;
        }));
    }
  };
  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
  };
  const saveEditedComment = async (commentId, postId) => {
    if(!editCommentContent.trim()) return;
    const { error } = await supabase.from('comments').update({ content: editCommentContent }).eq('id', commentId);
    if(!error) {
        setKudosList(prev => prev.map(post => {
            if(post.id === postId) {
                return { ...post, comments: post.comments.map(c => c.id === commentId ? { ...c, content: editCommentContent } : c) };
            }
            return post;
        }));
        setEditingCommentId(null);
    }
  };
  const getReactionCounts = (reactions) => {
    if (!reactions) return {};
    return reactions.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
    }, {});
  };
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const renderRecipients = (recipients) => {
      if (!recipients || recipients.length === 0) return <span className="text-gray-400">someone</span>;
      const names = recipients.map(r => r.full_name);
      if (names.length === 1) return <span className="font-bold text-lg text-blue-600">{names[0]}</span>;
      if (names.length === 2) return <span className="font-bold text-lg text-blue-600">{names[0]} and {names[1]}</span>;
      return <span className="font-bold text-lg text-blue-600">{names[0]}, {names[1]} and {names.length - 2} others</span>;
  };

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (userSearchQuery.length > 0) {
        const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${userSearchQuery}%`).limit(5);
        if (data) setSearchResults(data);
      } else setSearchResults([]);
    }, 300);
    return () => clearTimeout(delay);
  }, [userSearchQuery]);

  useEffect(() => {
    if (!showMentionPopup) return;
    const delay = setTimeout(async () => {
        const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${mentionQuery}%`).limit(5);
        if (data) setMentionResults(data);
    }, 300);
    return () => clearTimeout(delay);
  }, [mentionQuery, showMentionPopup]);

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      {/* LIGHTBOX */}
      {viewingImage && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/95 p-4" onClick={() => setViewingImage(null)}>
            <img src={viewingImage} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" onClick={e => e.stopPropagation()}/>
            <button onClick={() => setViewingImage(null)} className="absolute top-4 right-4 text-white p-2 bg-white/20 rounded-full"><X size={24}/></button>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex shadow-sm z-10 sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg"><span className="text-white font-bold text-xl">K</span></div>
            <h1 className="font-bold text-xl text-gray-900">Kudos<span className="text-blue-600">Social</span></h1>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-2">
            <Button onClick={()=>setCurrentView('feed')} variant="ghost" className={`w-full justify-start gap-3 font-semibold ${currentView==='feed'?'bg-blue-50 text-blue-700 border-r-4 border-blue-600':'text-gray-600'}`}><Home size={20}/> News Feed</Button>
            <Button onClick={()=>setCurrentView('leaderboard')} variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:bg-gray-50"><Trophy size={20}/> Leaderboard</Button>
            <Button onClick={()=>setCurrentView('settings')} variant="ghost" className="w-full justify-start gap-3 text-gray-600 hover:bg-gray-50"><Settings size={20}/> Settings</Button>
            <div className="mt-auto pt-6 border-t border-gray-50 mx-2">
                <div className="p-4 bg-gray-50/80 rounded-2xl border border-gray-100/80 hover:border-blue-100 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-10 h-10 ring-2 ring-blue-500 ring-offset-2"><AvatarImage src={currentUser?.avatar_url}/><AvatarFallback>Me</AvatarFallback></Avatar>
                        <div className="flex-1 min-w-0"><p className="text-sm font-bold truncate">{currentUser?.full_name}</p><p className="text-xs text-blue-600">Online</p></div>
                    </div>
                    <Button onClick={handleLogout} variant="outline" size="sm" className="w-full gap-2 text-gray-600 hover:text-red-600"><LogOut size={14}/> Log Out</Button>
                </div>
            </div>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-y-auto bg-gray-50/50">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50/95 backdrop-blur-sm z-40 py-2">
             <div className="flex-1 max-w-2xl relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500" size={20} />
                <Input placeholder="Search kudos, people, tags..." className="pl-12 py-6 bg-white border-gray-200 focus:ring-blue-500 rounded-full shadow-sm text-base" />
             </div>
             
             {/* NOTIFICATIONS */}
             <div className="relative ml-4">
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 relative h-12 w-12 rounded-full hover:bg-white" onClick={() => setShowNotifications(!showNotifications)}>
                    <Bell size={28} />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                </Button>
                {showNotifications && (
                    <div className="absolute right-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="p-4 border-b border-gray-50 bg-gray-50/50 flex justify-between items-center backdrop-blur-sm">
                            <h3 className="font-bold text-gray-800 text-lg">Thông báo</h3>
                            {unreadCount > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">{unreadCount} mới</span>}
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-12 text-center text-gray-400 flex flex-col items-center"><Bell size={40} className="mb-3 opacity-20"/><span className="text-sm">Không có thông báo nào.</span></div>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} onClick={() => handleNotificationClick(notif)} className={`p-4 flex gap-4 hover:bg-blue-50/80 cursor-pointer border-b border-gray-50 last:border-0 transition-colors ${!notif.is_read ? 'bg-blue-50/40' : ''}`}>
                                        <Avatar className="w-12 h-12 border border-white shadow-sm"><AvatarImage src={notif.sender?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm text-gray-800 leading-snug">
                                                <span className="font-bold">{notif.sender?.full_name || 'Người dùng'}</span> 
                                                {notif.type === 'reaction' && <span className="text-gray-600"> đã thả cảm xúc vào bài viết của bạn.</span>}
                                                {notif.type === 'comment' && <span className="text-gray-600"> đã bình luận về bài viết của bạn.</span>}
                                                {notif.type === 'kudos' && <span className="text-blue-600 font-medium"> đã gửi lời khen cho bạn! 🎉</span>}
                                                {notif.type === 'mention' && <span className="text-purple-600 font-medium"> đã nhắc đến bạn trong bình luận.</span>}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1 font-medium">{formatDistanceToNow(new Date(notif.created_at), { locale: vi })} trước</p>
                                        </div>
                                        {!notif.is_read && <div className="w-3 h-3 bg-blue-500 rounded-full mt-2 shrink-0"></div>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
             </div>
          </div>

          {/* Create Kudos */}
          <Card className="mb-8 border-none shadow-xl shadow-blue-900/5 overflow-visible bg-white rounded-3xl">
            <CardContent className="p-8">
                <div className="flex gap-5">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-md"><AvatarImage src={currentUser?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex-1">
                        
                        {/* LIST RECEIVERS */}
                        <div className="flex flex-wrap gap-2 mb-3">
                            {selectedReceivers.map(u => (
                                <Badge key={u.id} variant="secondary" className="px-3 py-1.5 bg-blue-50 text-blue-700 gap-2 text-sm border border-blue-100 hover:bg-blue-100 transition-colors">
                                    <Avatar className="w-6 h-6"><AvatarImage src={u.avatar_url}/></Avatar>
                                    {u.full_name}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeReceiver(u.id);
                                        }}
                                        className="hover:bg-blue-200 rounded-full p-0.5 transition-colors text-blue-400 hover:text-red-500"
                                    >
                                        <X size={14} />
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        
                        {/* USER SEARCH INPUT */}
                        <div ref={searchContainerRef} className="mb-3 relative animate-in fade-in zoom-in-95 group">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><AtSign size={16} className={`transition-colors ${showUserSearch ? 'text-blue-500' : 'text-gray-400'}`}/></div>
                            <Input 
                                placeholder={selectedReceivers.length > 0 ? "Thêm người khác..." : "Nhập tên người nhận..."} 
                                value={userSearchQuery} 
                                onChange={e => { setUserSearchQuery(e.target.value); setShowUserSearch(true); }} 
                                onFocus={() => setShowUserSearch(true)}
                                onKeyDown={handleKeyDown}
                                className="h-12 pl-10 border-blue-200 bg-blue-50/30 text-lg rounded-xl focus:ring-2 ring-blue-200 transition-all"
                            />
                            {showUserSearch && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 p-2 max-h-60 overflow-y-auto">
                                    {searchResults.map(u => (
                                        <div key={u.id} className="p-3 hover:bg-blue-50 rounded-lg cursor-pointer flex gap-3 items-center transition-colors" onClick={() => addReceiver(u)}>
                                            <Avatar className="w-10 h-10"><AvatarImage src={u.avatar_url}/></Avatar>
                                            <div><p className="text-sm font-bold text-gray-800">{u.full_name}</p><p className="text-xs text-gray-500">{u.email}</p></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Textarea placeholder="Who made your day awesome? Send some kudos!" className="mb-4 border-none p-0 text-xl min-h-[80px] resize-none placeholder:text-gray-400 focus-visible:ring-0" value={kudosMessage} onChange={e=>setKudosMessage(e.target.value)}/>
                        
                        {/* DISPLAY TAGS HERE */}
                        {selectedTags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-1">
                            {selectedTags.map(tag => (
                              <Badge key={tag} className={`pl-3 pr-1 py-1 gap-1 cursor-default border ${getTagColor(tag)}`}>
                                #{tag}
                                <button
                                  onClick={() => toggleTag(tag)}
                                  className="p-0.5 hover:bg-black/10 rounded-full transition-colors"
                                >
                                  <X size={12} />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}

                        {previewUrls.length > 0 && <div className="mb-4 grid grid-cols-3 gap-3">{previewUrls.map((url, i) => <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm"><img src={url} className="object-cover w-full h-full"/><button onClick={()=>{setSelectedFiles(selectedFiles.filter((_,idx)=>idx!==i));setPreviewUrls(previewUrls.filter((_,idx)=>idx!==i))}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X size={16}/></button></div>)}</div>}

                        {/* TAG SUGGESTIONS */}
                        {showTagSuggestions && <div className="mb-4 p-5 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Choose Tags</p>
                            <div className="flex flex-wrap gap-2">
                                {predefinedTags.map(t => (
                                    <button
                                        key={t}
                                        onClick={() => toggleTag(t)}
                                        className={`text-sm px-4 py-1.5 rounded-full border transition-all active:scale-95 ${
                                            selectedTags.includes(t)
                                                ? getTagColor(t) + ' ring-2 ring-offset-1'
                                                : 'bg-white border-gray-200 hover:shadow-sm'
                                        }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>}

                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex gap-2">
                                <Button ref={atButtonRef} variant="ghost" size="icon" className={`h-10 w-10 rounded-full ${showUserSearch?'bg-blue-100 text-blue-600':'text-gray-500 hover:bg-gray-100'}`} onClick={()=>{setShowUserSearch(!showUserSearch)}}><AtSign size={20}/></Button>
                                <Button variant="ghost" size="icon" className={`h-10 w-10 rounded-full ${showTagSuggestions?'bg-purple-100 text-purple-600':'text-gray-500 hover:bg-gray-100'}`} onClick={()=>setShowTagSuggestions(!showTagSuggestions)}><Hash size={20}/></Button>
                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-gray-500 hover:bg-gray-100 hover:text-green-600" onClick={()=>fileInputRef.current?.click()}><ImageIcon size={20}/></Button>
                                <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleFileSelect}/>
                            </div>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-full px-8 py-6 text-base font-semibold transition-all active:scale-95" onClick={createKudos} disabled={isSubmitting}>Send Kudos</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* FEED LIST */}
          <div className="space-y-8">
            {isLoadingFeed ? <div className="text-center py-12"><div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div><p className="text-gray-400">Loading feed...</p></div> : kudosList.map(post => {
                const reactionsCount = getReactionCounts(post.reactions);
                const myReaction = post.reactions?.find(r => r.user_id === currentUser?.id)?.type;

                return (
                  <Card key={post.id} id={`post-${post.id}`} className="border-none shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white rounded-3xl overflow-visible">
                    <CardContent className="p-8">
                      <div className="flex gap-5">
                        <Avatar className="w-12 h-12 border border-gray-100"><AvatarImage src={post.sender?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                        <div className="flex-1">
                          
                          {/* Post Info - WITH MENU AND CLICK OUTSIDE FIX */}
                          <div className="flex justify-between mb-3 items-start relative">
                            <div>
                                <p className="text-base text-gray-900 leading-snug">
                                    <span className="font-bold text-lg">{post.sender?.full_name}</span> 
                                    <span className="text-gray-400 mx-1">sent kudos to</span> 
                                    {renderRecipients(post.receiverList)}
                                </p>
                                <p className="text-sm text-gray-400 mt-1">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: vi })}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {post.tags?.[0] && <Badge className={`border-none px-3 py-1 text-sm ${getTagColor(post.tags[0])}`}>{post.tags[0]}</Badge>}
                                {/* POST MENU */}
                                {currentUser?.id === post.sender?.id && (
                                    <div className="relative">
                                        <button 
                                            className="post-menu-trigger p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                            onClick={() => setActivePostMenuId(activePostMenuId === post.id ? null : post.id)}
                                        >
                                            <MoreHorizontal size={20}/>
                                        </button>
                                        {activePostMenuId === post.id && (
                                            <div className="post-menu-dropdown absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95">
                                                <button onClick={() => startEditingPost(post)} className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2 transition-colors"><Edit2 size={14}/> Sửa</button>
                                                <button onClick={() => handleDeletePost(post.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"><Trash2 size={14}/> Xóa</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                          </div>
                          
                          {/* EDITING MODE */}
                          {editingPostId === post.id ? (
                              <div className="mb-5">
                                  <Textarea 
                                    value={editPostMessage} 
                                    onChange={(e) => setEditPostMessage(e.target.value)} 
                                    className="mb-2 min-h-[100px] text-lg bg-gray-50 border-blue-200 focus-visible:ring-blue-500"
                                  />
                                  <div className="flex gap-2 justify-end">
                                      <Button size="sm" variant="ghost" onClick={cancelEditingPost}>Hủy</Button>
                                      <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700" onClick={() => handleUpdatePost(post.id)}>Lưu</Button>
                                  </div>
                              </div>
                          ) : (
                              <p className="text-gray-800 mb-5 whitespace-pre-wrap text-lg leading-relaxed">{post.message}</p>
                          )}
                          
                          {post.image_urls?.length > 0 && <div className={`grid gap-3 mb-5 rounded-2xl overflow-hidden ${post.image_urls.length>1?'grid-cols-2':'grid-cols-1'}`}>{post.image_urls.map((img, i) => <div key={i} className="relative aspect-video bg-gray-100 cursor-zoom-in" onClick={()=>setViewingImage(img)}><img src={img} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500"/></div>)}</div>}
                          
                          {post.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-5">{post.tags.map(t=><span key={t} className="text-sm font-medium px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">#{t}</span>)}</div>}
                          
                          {/* Reaction Stats */}
                          <div className="flex items-center justify-between py-3 border-t border-gray-50">
                             <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                {Object.keys(reactionsCount).length > 0 && <div className="flex -space-x-2 mr-1">{Object.keys(reactionsCount).map(type => <div key={type} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[12px] animate-in zoom-in shadow-sm">{REACTION_TYPES.find(r=>r.id===type)?.emoji}</div>)}</div>}
                                <span>{post.reactions?.length || 0} reactions</span>
                             </div>
                             <div className="text-sm text-gray-500 cursor-pointer hover:underline font-medium" onClick={() => setActiveCommentBox(activeCommentBox === post.id ? null : post.id)}>{post.comments?.length || 0} comments</div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-4 pt-3 border-t border-gray-50 relative">
                            <div className="relative group pb-2">
                                <button onClick={() => handleReaction(post, myReaction || 'like')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full transition-colors ${myReaction ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                                    {myReaction ? <span className="text-xl animate-in zoom-in">{REACTION_TYPES.find(r=>r.id===myReaction)?.emoji}</span> : <ThumbsUp size={20}/>}
                                    <span className="font-bold text-sm">{myReaction ? REACTION_TYPES.find(r=>r.id===myReaction)?.label : 'Like'}</span>
                                </button>
                                <div className="absolute bottom-12 left-0 hidden group-hover:flex bg-white p-2 rounded-full shadow-xl border border-gray-100 animate-in zoom-in slide-in-from-bottom-2 duration-200 z-50 gap-2">
                                    {REACTION_TYPES.map((reaction) => <button key={reaction.id} onClick={(e) => { e.stopPropagation(); handleReaction(post, reaction.id); }} className="p-2 hover:scale-125 transition-transform text-3xl hover:bg-gray-50 rounded-full" title={reaction.label}>{reaction.emoji}</button>)}
                                </div>
                            </div>
                            <button onClick={() => setActiveCommentBox(activeCommentBox === post.id ? null : post.id)} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors"><MessageSquare size={20} /> <span className="font-bold text-sm">Comment</span></button>
                            <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-900 ml-auto transition-colors"><Share2 size={20} /></button>
                          </div>

                          {/* Comment Section */}
                          <AnimatePresence>
                            {activeCommentBox === post.id && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5 bg-gray-50 rounded-2xl p-5">
                                    {post.comments?.length > 0 && (
                                        <div className="space-y-5 mb-5 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                                            {post.comments.map(comment => (
                                                <div key={comment.id} className="flex gap-3 group/comment">
                                                    <Avatar className="w-9 h-9 mt-1"><AvatarImage src={comment.user?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                                    <div className="flex-1">
                                                        <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 relative group-hover/comment:border-blue-100 transition-colors">
                                                            <div className="flex justify-between items-start">
                                                                <p className="text-sm font-bold text-gray-900 mb-1">{comment.user?.full_name}</p>
                                                                {currentUser?.id === comment.user?.id && (<div className="flex gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity"><button onClick={() => startEditingComment(comment)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600"><Edit2 size={14}/></button><button onClick={() => handleDeleteComment(comment.id, post.id)} className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-red-600"><Trash2 size={14}/></button></div>)}
                                                            </div>
                                                            {editingCommentId === comment.id ? (<div className="flex gap-2 mt-2"><Input value={editCommentContent} onChange={(e) => setEditCommentContent(e.target.value)} className="h-9 text-sm" autoFocus/><button onClick={() => saveEditedComment(comment.id, post.id)} className="text-green-600 hover:bg-green-50 p-1.5 rounded"><Check size={18}/></button><button onClick={() => setEditingCommentId(null)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><X size={18}/></button></div>) : <p className="text-sm text-gray-800 break-words leading-relaxed">{comment.content}</p>}
                                                        </div>
                                                        <span className="text-xs text-gray-400 mt-1.5 ml-2 font-medium">{formatDistanceToNow(new Date(comment.created_at), { locale: vi })} trước</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="flex gap-3 relative items-start">
                                        <Avatar className="w-9 h-9"><AvatarImage src={currentUser?.avatar_url}/><AvatarFallback>Me</AvatarFallback></Avatar>
                                        <div className="flex-1 relative">
                                            <Input value={commentInputs[post.id] || ''} onChange={(e) => handleCommentInput(post.id, e)} onKeyDown={(e) => e.key === 'Enter' && submitComment(post)} placeholder="Write a comment..." className="bg-white border-gray-200 rounded-full pr-12 py-5 focus-visible:ring-blue-500 shadow-sm"/>
                                            {showMentionPopup && activeCommentBox === post.id && mentionResults.length > 0 && (<div className="absolute bottom-full left-0 w-64 mb-2 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden">{mentionResults.map(u => (<div key={u.id} className="p-3 hover:bg-blue-50 cursor-pointer flex items-center gap-3" onClick={() => insertMention(post.id, u)}><Avatar className="w-8 h-8"><AvatarImage src={u.avatar_url}/></Avatar><span className="text-sm font-medium">{u.full_name}</span></div>))}</div>)}
                                            <button onClick={() => submitComment(post)} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors"><Send size={18} /></button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
            })}
          </div>
        </div>
      </main>
      
      {/* Right Sidebar (Giữ nguyên) */}
      <aside className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto hidden xl:block sticky top-0 h-screen">
         <Card className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white mb-8 shadow-xl border-none rounded-3xl"><CardContent className="p-6"><h3 className="text-xs font-bold uppercase opacity-80 tracking-wider">Your Impact</h3><div className="text-5xl font-extrabold my-4 tracking-tight">12</div><div className="w-full bg-black/20 rounded-full h-2 mb-2"><div className="bg-white rounded-full h-2 shadow-sm" style={{ width: '45%' }}></div></div><p className="text-xs opacity-80 font-medium">You're in the top 15% this month!</p></CardContent></Card>
         <div className="mb-8">
            <div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Top Givers</h3><Button variant="link" className="text-blue-600 p-0 h-auto text-xs font-bold">View All</Button></div>
            <div className="space-y-5">{topGivers.map((giver, idx) => (<div key={giver.rank} className="flex items-center gap-3 group cursor-pointer"><span className={`text-sm font-bold w-6 text-center ${idx === 0 ? 'text-yellow-500 text-lg' : 'text-gray-400'}`}>{giver.rank}</span><Avatar className="w-10 h-10 border border-gray-100 group-hover:border-blue-200 transition-colors"><AvatarImage src={giver.avatar} /><AvatarFallback>{giver.name[0]}</AvatarFallback></Avatar><div className="flex-1"><p className="font-bold text-sm text-gray-900 group-hover:text-blue-600 transition-colors">{giver.name}</p><p className="text-xs text-gray-500 font-medium">{giver.kudos} Kudos given</p></div>{giver.isTop && <Star className="text-yellow-400 fill-yellow-400" size={16} />}</div>))}</div>
         </div>
         <div><h3 className="font-bold text-gray-900 mb-4">Trending Now</h3><div className="flex flex-wrap gap-2">{trendingTags.map(tag => (<Badge key={tag} variant="secondary" className="bg-gray-50 text-gray-600 hover:bg-gray-100 cursor-pointer px-3 py-1.5 transition-colors font-medium border border-gray-100">{tag}</Badge>))}</div></div>
      </aside>
    </div>
  );
};

export default KudosSocialDashboard;