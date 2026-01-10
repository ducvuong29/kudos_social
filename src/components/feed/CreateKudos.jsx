"use client"

import React, { useState, useRef } from 'react';
import { AtSign, Hash, Image as ImageIcon, X, Sparkles, Check } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';

// IMPORT CONTEXT HOOKS
import { useUser } from '@/context/UserContext';
import { useKudos } from '@/context/KudosContext';

const predefinedTags = ['Excellent', 'Brilliant', 'TeamWork', 'LifeSaver', 'DataWizard', 'ProblemSolver', 'Creative', 'Leadership', 'Innovative'];

const getTagColorClass = (tag) => {
    const colors = [
        'bg-rose-600 text-white border-rose-600',
        'bg-blue-600 text-white border-blue-600',
        'bg-emerald-600 text-white border-emerald-600',
        'bg-violet-600 text-white border-violet-600',
        'bg-orange-600 text-white border-orange-600',
        'bg-cyan-600 text-white border-cyan-600',
        'bg-fuchsia-600 text-white border-fuchsia-600',
    ];
    let hash = 0;
    for (let i = 0; i < tag.length; i++) {
        hash = tag.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % colors.length;
    return colors[index];
};

// Không cần nhận props từ cha nữa
const CreateKudos = () => {
    const supabase = createClient();
    const fileInputRef = useRef(null);
    
    // Lấy dữ liệu từ Context
    const { user: currentUser } = useUser();
    const { addNewPost } = useKudos(); 
  
    const [message, setMessage] = useState('');
    const [selectedReceivers, setSelectedReceivers] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previewUrls, setPreviewUrls] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showUserSearch, setShowUserSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showTagSuggestions, setShowTagSuggestions] = useState(false);

    const handleToggleTag = (tag) => {
        if (selectedTags.includes(tag)) {
            setSelectedTags(selectedTags.filter(t => t !== tag));
        } else {
            if (selectedTags.length >= 5) return alert("Bạn chỉ được chọn tối đa 5 thẻ!");
            setSelectedTags([...selectedTags, tag]);
        }
    };

    const handleRemoveTag = (tagToRemove) => setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));

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

    const handleSearchUser = async (val) => {
        setSearchQuery(val);
        setShowUserSearch(true);
        if(val.length > 0) {
            const { data } = await supabase.from('profiles').select('*').ilike('full_name', `%${val}%`).limit(5);
            if(data) setSearchResults(data);
        } else setSearchResults([]);
    };

    const handleSubmit = async () => {
        if (!currentUser) return alert("Vui lòng đăng nhập!");
        if ((!message.trim() && selectedFiles.length === 0) || selectedReceivers.length === 0) {
            return alert('Vui lòng chọn người nhận và nội dung!');
        }
        setIsSubmitting(true);
        try {
            const imageUrls = selectedFiles.length > 0 ? await uploadImages() : [];
            
            // 1. Insert Kudos
            const { data: newKudos, error } = await supabase.from('kudos').insert([{
                sender_id: currentUser.id,
                receiver_id: selectedReceivers[0].id, 
                message: message,
                tags: selectedTags,
                image_urls: imageUrls
            }]).select().single();

            if (error) throw error;

            // 2. Insert Receivers
            const receiversData = selectedReceivers.map(r => ({ kudos_id: newKudos.id, user_id: r.id }));
            await supabase.from('kudos_receivers').insert(receiversData);
            
            // 3. Insert Notifications (MENTION)
            const notificationsData = selectedReceivers.map(receiver => ({
                recipient_id: receiver.id,
                sender_id: currentUser.id,
                type: 'kudos', // Sửa 'mention' thành 'kudos' cho đúng ngữ cảnh bài đăng
                resource_id: newKudos.id,
                is_read: false
            }));

            if (notificationsData.length > 0) {
                await supabase.from('notifications').insert(notificationsData);
            }

            // Reset form
            setMessage(''); 
            setSelectedReceivers([]); 
            setSelectedTags([]); 
            setSelectedFiles([]); 
            setPreviewUrls([]);
            
            // Gọi hàm cập nhật feed từ Context
            addNewPost(); 

        } catch (e) { alert('Lỗi: ' + e.message); } 
        finally { setIsSubmitting(false); }
    };

    const handleFileSelect = (e) => {
        if (e.target.files?.length) {
            const files = Array.from(e.target.files);
            setSelectedFiles(p => [...p, ...files]);
            setPreviewUrls(p => [...p, ...files.map(f => URL.createObjectURL(f))]);
        }
    };

    return (
        <Card className="mb-8 border-none shadow-xl shadow-indigo-900/5 overflow-visible bg-white rounded-3xl">
            <CardContent className="p-8">
                <div className="flex gap-5">
                    <Avatar className="w-14 h-14 border-2 border-white shadow-md ring-2 ring-indigo-50"><AvatarImage src={currentUser?.avatar_url}/><AvatarFallback>U</AvatarFallback></Avatar>
                    <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                            {selectedReceivers.map(u => (
                                <Badge key={u.id} variant="secondary" className="pl-1 pr-3 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-full flex items-center gap-2 transition-colors">
                                    <Avatar className="w-6 h-6"><AvatarImage src={u.avatar_url}/></Avatar>{u.full_name}<button onClick={() => setSelectedReceivers(prev => prev.filter(r => r.id !== u.id))} className="ml-1 hover:text-red-500 hover:bg-white rounded-full p-0.5 transition-all"><X size={14}/></button>
                                </Badge>
                            ))}
                        </div>
                        <div className="mb-3 relative group">
                            <Input placeholder="Gửi lời khen tới ai đó..." value={searchQuery} onChange={e => handleSearchUser(e.target.value)} onFocus={() => setShowUserSearch(true)} className="h-14 pl-5 border-gray-200 bg-gray-50/50 text-lg rounded-2xl focus:bg-white focus:ring-2 ring-indigo-500/20 focus:border-indigo-500 transition-all font-medium"/>
                            {showUserSearch && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 shadow-2xl z-50 p-2 max-h-60 overflow-y-auto rounded-xl animate-in fade-in zoom-in-95">
                                    {searchResults.map(u => (
                                        <div key={u.id} className="p-3 hover:bg-indigo-50 rounded-xl cursor-pointer flex gap-3 items-center transition-colors group/item" onClick={() => { if(!selectedReceivers.find(r=>r.id===u.id)) setSelectedReceivers([...selectedReceivers, u]); setSearchQuery(''); setShowUserSearch(false); }}>
                                            <Avatar className="w-9 h-9 border border-indigo-100"><AvatarImage src={u.avatar_url}/></Avatar><p className="font-semibold text-gray-700 group-hover/item:text-indigo-700 transition-colors">{u.full_name}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <Textarea placeholder="Họ đã làm gì tuyệt vời?..." value={message} onChange={e=>setMessage(e.target.value)} className="mb-4 border-none p-0 text-xl min-h-[80px] resize-none focus-visible:ring-0 placeholder:text-gray-300 font-light leading-relaxed"/>
                        
                        {selectedTags.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-4 animate-in slide-in-from-top-2 fade-in">
                                {selectedTags.map(t => (
                                    <Badge key={t} className={`pl-3 pr-2 py-1.5 gap-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-all ${getTagColorClass(t)}`}>#{t}<button onClick={(e) => { e.stopPropagation(); handleRemoveTag(t); }} className="p-0.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm"><X size={12}/></button></Badge>
                                ))}
                            </div>
                        )}
                        {previewUrls.length > 0 && <div className="mb-4 grid grid-cols-3 gap-3 animate-in fade-in">{previewUrls.map((url, i) => <div key={i} className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group"><img src={url} className="object-cover w-full h-full"/><button onClick={()=>{setSelectedFiles(selectedFiles.filter((_,idx)=>idx!==i));setPreviewUrls(previewUrls.filter((_,idx)=>idx!==i))}} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"><X size={14}/></button></div>)}</div>}
                        
                        {showTagSuggestions && (
                            <div className="mb-6 p-5 bg-white rounded-2xl border-2 border-dashed border-gray-100 animate-in zoom-in-95">
                                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider"><Sparkles size={14} className="text-yellow-500"/> Gợi ý thẻ khen ngợi</div>
                                <div className="flex flex-wrap gap-2.5">
                                    {predefinedTags.map(t => {
                                        const isSelected = selectedTags.includes(t);
                                        return <button key={t} onClick={() => handleToggleTag(t)} className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ease-out select-none border-2 ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50'}`}>{t}{isSelected && <Check size={14} className="inline ml-1.5 -mt-0.5 stroke-[3]"/>}</button>;
                                    })}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                            <div className="flex gap-2">
                                <Button variant="ghost" size="icon" className={`rounded-full transition-colors ${showUserSearch ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} onClick={() => setShowUserSearch(!showUserSearch)}><AtSign size={20}/></Button>
                                <Button variant="ghost" size="icon" className={`rounded-full transition-colors ${showTagSuggestions ? 'bg-indigo-100 text-indigo-600' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`} onClick={() => setShowTagSuggestions(!showTagSuggestions)}><Hash size={20}/></Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 transition-colors" onClick={() => fileInputRef.current?.click()}><ImageIcon size={20}/></Button>
                                <input type="file" ref={fileInputRef} hidden multiple accept="image/*" onChange={handleFileSelect}/>
                            </div>
                            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 py-6 font-bold text-base shadow-xl shadow-indigo-200 active:scale-95 transition-all" onClick={handleSubmit} disabled={isSubmitting}>{isSubmitting ? <span className="animate-spin mr-2">⏳</span> : <span className="mr-2">🚀</span>} Gửi Kudos</Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default CreateKudos;