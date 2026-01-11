"use client"

import React, { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, MoreHorizontal, Edit2, Trash2, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale'; 
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useUser } from '@/context/UserContext'; 

// --- CONSTANTS ---
const REACTION_TYPES = [
  { id: 'like', emoji: '👍', label: 'Like', color: 'text-blue-600' },
  { id: 'love', emoji: '❤️', label: 'Love', color: 'text-red-500' },
  { id: 'haha', emoji: '😆', label: 'Haha', color: 'text-yellow-500' },
  { id: 'wow',  emoji: '😮', label: 'Wow',  color: 'text-orange-500' },
  { id: 'sad',  emoji: '😢', label: 'Sad',  color: 'text-yellow-600' },
  { id: 'angry', emoji: '😡', label: 'Angry', color: 'text-red-700' },
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
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
};

const PostItem = ({ post, onDelete, onUpdate, onImageClick }) => {
  const supabase = createClient();
  const { user: currentUser } = useUser(); 

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(post.message);
  
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionResults, setMentionResults] = useState([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [pendingMentions, setPendingMentions] = useState([]);

  // --- LOGIC ---
  const handleDeletePost = async () => {
    if (!confirm("Bạn có chắc chắn muốn xóa bài viết này không?")) return;
    const { error } = await supabase.from('kudos').delete().eq('id', post.id);
    if (!error) onDelete(post.id);
    else alert("Lỗi xóa: " + error.message);
  };

  const handleUpdatePost = async () => {
    if (!editMessage.trim()) return alert("Nội dung trống!");
    const { error } = await supabase.from('kudos').update({ message: editMessage }).eq('id', post.id);
    if (!error) {
        onUpdate({ ...post, message: editMessage });
        setIsEditing(false);
    }
  };

  const handleReaction = async (type) => {
    if (!currentUser) return; 

    const existingReaction = post.reactions.find(r => r.user_id === currentUser.id);
    const isRemoving = existingReaction && existingReaction.type === type;
    
    let newReactions = post.reactions.filter(r => r.user_id !== currentUser.id);
    if (!isRemoving) {
        newReactions.push({ user_id: currentUser.id, type });
        triggerConfetti();
    }
    onUpdate({ ...post, reactions: newReactions });

    await supabase.from('reactions').delete().match({ kudos_id: post.id, user_id: currentUser.id });
    if (!isRemoving) {
       await supabase.from('reactions').insert({ kudos_id: post.id, user_id: currentUser.id, type });
       if (post.sender?.id !== currentUser.id) {
           await supabase.from('notifications').insert({ recipient_id: post.sender.id, sender_id: currentUser.id, type: 'reaction', resource_id: post.id });
       }
    }
  };

  const handleCommentChange = async (e) => {
    const val = e.target.value;
    setCommentInput(val);
    const cursor = e.target.selectionStart;
    setCursorPos(cursor);
    
    const textBeforeCursor = val.slice(0, cursor);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];
    
    if (currentWord.startsWith('@')) {
        setShowMentionPopup(true);
        setMentionQuery(currentWord.substring(1));
        const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${currentWord.substring(1)}%`).limit(5);
        if(data) setMentionResults(data);
    } else {
        setShowMentionPopup(false);
    }
  };

  const insertMention = (user) => {
    const textBefore = commentInput.slice(0, cursorPos);
    const textAfter = commentInput.slice(cursorPos);
    const words = textBefore.split(/\s+/);
    words.pop(); 
    const newText = words.join(' ') + ` @${user.full_name} ` + textAfter;
    setCommentInput(newText);
    setShowMentionPopup(false);
    if (!pendingMentions.find(u => u.id === user.id)) {
        setPendingMentions([...pendingMentions, user]);
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !currentUser) return;
    
    const { data: newComment, error } = await supabase.from('comments')
        .insert({ kudos_id: post.id, user_id: currentUser.id, content: commentInput })
        .select('*, user:user_id(full_name, avatar_url, id)').single();
        
    if (!error) {
        const updatedComments = [...(post.comments || []), newComment];
        onUpdate({ ...post, comments: updatedComments });
        
        setCommentInput('');
        setPendingMentions([]);

        if (post.sender?.id !== currentUser.id) {
            await supabase.from('notifications').insert({ recipient_id: post.sender.id, sender_id: currentUser.id, type: 'comment', resource_id: post.id });
        }
        
        const processedIds = new Set();
        for (const user of pendingMentions) {
             if (commentInput.includes(user.full_name) && !processedIds.has(user.id)) {
                 await supabase.from('notifications').insert({ recipient_id: user.id, sender_id: currentUser.id, type: 'mention', resource_id: post.id });
                 processedIds.add(user.id);
             }
        }
    }
  };

  const reactionsCount = post.reactions ? post.reactions.reduce((acc, curr) => { acc[curr.type] = (acc[curr.type] || 0) + 1; return acc; }, {}) : {};
  const myReaction = post.reactions?.find(r => r.user_id === currentUser?.id)?.type;

  const renderRecipients = (recipients) => {
    if (!recipients || recipients.length === 0) return <span className="text-gray-400">someone</span>;
    const names = recipients.map(r => r.full_name);
    if (names.length === 1) return <span className="font-bold text-lg text-blue-600">{names[0]}</span>;
    if (names.length === 2) return <span className="font-bold text-lg text-blue-600">{names[0]} and {names[1]}</span>;
    return <span className="font-bold text-lg text-blue-600">{names[0]}, {names[1]} and {names.length - 2} others</span>;
  };

  return (
    <Card id={`post-${post.id}`} className="border-none shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white rounded-3xl overflow-visible">
      <CardContent className="p-8">
        <div className="flex gap-5">
          <Avatar className="w-12 h-12 border border-gray-100">
            <AvatarImage src={post.sender?.avatar_url}/>
            <AvatarFallback>{post.sender?.full_name?.charAt(0) || 'U'}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            {/* Header Post */}
            <div className="flex justify-between mb-3 items-start relative">
               <div>
                  <p className="text-base text-gray-900 leading-snug">
                     <span className="font-bold text-lg">{post.sender?.full_name}</span> 
                     <span className="text-gray-400 mx-1">sent kudos to</span> 
                     {renderRecipients(post.receiverList)}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">{formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}</p>
               </div>
               <div className="flex items-center gap-2">
                  {post.tags?.[0] && <Badge className={`border-none px-3 py-1 text-sm ${getTagColor(post.tags[0])}`}>{post.tags[0]}</Badge>}
                  
                  {currentUser?.id === post.sender?.id && (
                    <div className="relative">
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-full cursor-pointer" onClick={() => setIsMenuOpen(!isMenuOpen)}><MoreHorizontal size={20}/></button>
                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-xl shadow-xl border border-gray-100 z-50 overflow-hidden">
                             <button onClick={() => {setIsEditing(true); setIsMenuOpen(false)}} className="w-full text-left px-4 py-3 text-sm flex gap-2 hover:bg-blue-50 text-blue-600 transition-colors cursor-pointer"><Edit2 size={14}/> Edit</button>
                             <button onClick={() => handleDeletePost()} className="w-full text-left px-4 py-3 text-sm flex gap-2 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"><Trash2 size={14}/> Delete</button>
                          </div>
                        )}
                    </div>
                  )}
               </div>
            </div>

            {/* Content Post */}
            {isEditing ? (
               <div className="mb-5">
                  <Textarea value={editMessage} onChange={e => setEditMessage(e.target.value)} className="mb-2 min-h-[100px] text-lg bg-gray-50"/>
                  <div className="flex gap-2 justify-end">
                     <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="cursor-pointer">Cancel</Button>
                     <Button size="sm" onClick={handleUpdatePost} className="cursor-pointer">Save</Button>
                  </div>
               </div>
            ) : (
               <p className="text-gray-800 mb-5 whitespace-pre-wrap text-lg leading-relaxed">{post.message}</p>
            )}

            {/* Images */}
            {post.image_urls?.length > 0 && (
               <div className={`grid gap-3 mb-5 rounded-2xl overflow-hidden ${post.image_urls.length>1?'grid-cols-2':'grid-cols-1'}`}>
                  {post.image_urls.map((img, i) => (
                    <div key={i} className="relative aspect-video bg-gray-100 cursor-zoom-in" onClick={() => onImageClick && onImageClick(img)}>
                       <img src={img} className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-500 cursor-pointer"/>
                    </div>
                  ))}
               </div>
            )}
            
            {/* Tags */}
            {post.tags?.length > 0 && <div className="flex flex-wrap gap-2 mb-5">{post.tags.map(t=><span key={t} className="text-sm font-medium px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg bg-opacity-50">#{t}</span>)}</div>}

            {/* Reactions Stats */}
            <div className="flex items-center justify-between py-3 border-t border-gray-50">
               <div className="flex items-center gap-2 text-sm text-gray-500">
                  {Object.keys(reactionsCount).length > 0 && <div className="flex -space-x-2 mr-1">{Object.keys(reactionsCount).map(type => <div key={type} className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[12px] shadow-sm ring-2 ring-white">{REACTION_TYPES.find(r=>r.id===type)?.emoji}</div>)}</div>}
                  <span>{post.reactions?.length || 0} reactions</span>
               </div>
               <div className="text-sm text-gray-500 cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>{post.comments?.length || 0} comments</div>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 pt-3 border-t border-gray-50 relative ">
               <div className="relative group pb-2">
                   <button onClick={() => handleReaction(myReaction || 'like')} className={`flex items-center gap-2 px-6 py-2.5 rounded-full cursor-pointer transition-colors ${myReaction ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:bg-gray-100'}`}>
                       {myReaction ? <span className="text-xl">{REACTION_TYPES.find(r=>r.id===myReaction)?.emoji}</span> : <ThumbsUp size={20}/>}
                       <span className="font-bold text-sm">{myReaction ? REACTION_TYPES.find(r=>r.id===myReaction)?.label : 'Like'}</span>
                   </button>
                   <div className="absolute bottom-12 left-0 hidden group-hover:flex bg-white p-2 rounded-full shadow-xl gap-2 z-50 border border-gray-100 animate-in slide-in-from-bottom-2 fade-in">
                       {REACTION_TYPES.map((r) => <button key={r.id} onClick={(e)=>{e.stopPropagation(); handleReaction(r.id)}} className="p-2 hover:scale-125 transition-transform text-2xl cursor-pointer" title={r.label}>{r.emoji}</button>)}
                   </div>
               </div>
               <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-2 px-6 py-2.5 rounded-full text-gray-500 hover:bg-gray-100 hover:text-blue-600 transition-colors cursor-pointer"><MessageSquare size={20} /> <span className="font-bold text-sm">Comment</span></button>
               <button className="flex items-center gap-2 px-6 py-2.5 rounded-full text-gray-500 hover:bg-gray-100 ml-auto transition-colors cursor-pointer"><Share2 size={20} /></button>
            </div>

            {/* Comments Area */}
            <AnimatePresence>
               {showComments && (
                 <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mt-5 bg-gray-50 rounded-2xl p-5">
                    {post.comments?.length > 0 && (
                       <div className="space-y-5 mb-5 max-h-96 overflow-y-auto pr-2 custom-scrollbar ">
                          {post.comments.map(comment => (
                             <div key={comment.id} className="flex gap-3 group/comment">
                                <Avatar className="w-9 h-9 mt-1"><AvatarImage src={comment.user?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                                <div className="flex-1">
                                   <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 relative">
                                      <p className="text-sm font-bold text-gray-900 mb-1">{comment.user?.full_name}</p>
                                      <p className="text-sm text-gray-800">{comment.content}</p>
                                   </div>
                                   <span className="text-xs text-gray-400 mt-1.5 ml-2 font-medium">{formatDistanceToNow(new Date(comment.created_at))} ago</span>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                    
                    {/* Input Comment */}
                    <div className="flex gap-3 relative items-start">
                        <Avatar className="w-9 h-9"><AvatarImage src={currentUser?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                        <div className="flex-1 relative">
                           <Input value={commentInput} onChange={handleCommentChange} onKeyDown={(e) => e.key === 'Enter' && submitComment()} placeholder="Write a comment..." className="bg-white rounded-full pr-12 py-5 shadow-sm border-gray-200 focus:ring-1 focus:ring-blue-500"/>
                           {showMentionPopup && mentionResults.length > 0 && (
                              <div className="absolute bottom-full left-0 w-64 mb-2 bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
                                 {mentionResults.map(u => (
                                    <div key={u.id} className="p-3 hover:bg-blue-50 cursor-pointer flex gap-3 items-center transition-colors" onClick={() => insertMention(u)}>
                                       <Avatar className="w-8 h-8"><AvatarImage src={u.avatar_url}/></Avatar><span className="text-sm font-medium">{u.full_name}</span>
                                    </div>
                                 ))}
                              </div>
                           )}
                           <button onClick={submitComment} className="absolute right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:bg-blue-50 p-2 rounded-full transition-colors cursor-pointer"><Send size={18} /></button>
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
};

export default PostItem;