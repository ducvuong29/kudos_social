"use client"

import React, { useState, useEffect } from 'react';
import { 
  Search, Download, Upload, Flame, 
  MapPin, Briefcase, X, Loader2, Camera, Edit, Lock, CheckCircle,
  Eye, EyeOff 
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import PostItem from '@/components/feed/PostItem'; 
import NotificationList from '@/components/common/NotificationList'; // <--- IMPORT
import { useUser } from '@/context/UserContext'; // <--- IMPORT

const ProfilePage = () => {
  const supabase = createClient();
  
  // 1. LẤY USER TỪ CONTEXT
  const { user, profile, isLoading: isLoadingUser, refreshProfile } = useUser();
  
  // Stats & Feed
  const [stats, setStats] = useState({ received: 0, given: 0, streak: 0 });
  const [activeTab, setActiveTab] = useState('received'); 
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(false);

  // Edit Profile
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '', job_title: '', department: '', location: '', bio: '', avatar_url: ''
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  // Change Password
  const [passData, setPassData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loadingPass, setLoadingPass] = useState(false);
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });

  const toggleShow = (field) => setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));

  // --- 2. SET DATA KHI PROFILE ĐÃ LOAD ---
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        job_title: profile.job_title || '',
        department: profile.department || '',
        location: profile.location || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || ''
      });
    }
  }, [profile]);

  // --- 3. STATS LOGIC (Giữ nguyên vì là logic riêng của trang Profile) ---
  useEffect(() => {
    if (!user) return;
    const calculateStats = async () => {
        try {
            const { count: receivedCount } = await supabase.from('kudos_receivers').select('*', { count: 'exact', head: true }).eq('user_id', user.id);
            const { data: givenData, count: givenCount } = await supabase.from('kudos').select('created_at', { count: 'exact' }).eq('sender_id', user.id).order('created_at', { ascending: false });

            let currentStreak = 0;
            if (givenData && givenData.length > 0) {
                const uniqueDates = [...new Set(givenData.map(item => new Date(item.created_at).toISOString().split('T')[0]))];
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

                if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
                    currentStreak = 1; 
                    for (let i = 0; i < uniqueDates.length - 1; i++) {
                        const diffDays = Math.ceil(Math.abs(new Date(uniqueDates[i]) - new Date(uniqueDates[i+1])) / (1000 * 60 * 60 * 24)); 
                        if (diffDays === 1) currentStreak++; else break;
                    }
                }
            }
            setStats({ received: receivedCount || 0, given: givenCount || 0, streak: currentStreak });
        } catch (error) { console.error("Error stats:", error); }
    };
    calculateStats();
  }, [user]);

  // --- 4. FEED LOGIC (Giữ nguyên vì logic filter theo Tab khác với trang chủ) ---
  useEffect(() => {
    if (!user) return;
    const fetchPosts = async () => {
      setLoadingPosts(true);
      setPosts([]);
      try {
        const selectQuery = `*, sender:sender_id(full_name, avatar_url, id), recipients:kudos_receivers(user:user_id(full_name, avatar_url, id)), comments(id, content, created_at, user:user_id(full_name, avatar_url, id)), reactions(type, user_id)`;
        let dataToSet = [];
        const fetchGiven = () => supabase.from('kudos').select(selectQuery).eq('sender_id', user.id).order('created_at', { ascending: false });
        const fetchReceived = async () => {
            const { data: refs } = await supabase.from('kudos_receivers').select('kudos_id').eq('user_id', user.id);
            const ids = refs ? refs.map(r => r.kudos_id) : [];
            if (ids.length === 0) return { data: [] };
            return supabase.from('kudos').select(selectQuery).in('id', ids).order('created_at', { ascending: false });
        };

        if (activeTab === 'given') { const { data } = await fetchGiven(); dataToSet = data || []; } 
        else if (activeTab === 'received') { const { data } = await fetchReceived(); dataToSet = data || []; } 
        else if (activeTab === 'all') {
            const [givenRes, receivedRes] = await Promise.all([fetchGiven(), fetchReceived()]);
            const combinedMap = new Map();
            [...(givenRes.data||[]), ...(receivedRes.data||[])].forEach(p => combinedMap.set(p.id, p));
            dataToSet = Array.from(combinedMap.values()).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        const formattedData = dataToSet.map(p => ({
            ...p,
            receiverList: p.recipients ? p.recipients.map(r => r.user) : [],
            image_urls: p.image_urls || (p.image_url ? [p.image_url] : []),
            comments: p.comments || [],
            reactions: p.reactions || []
        }));
        setPosts(formattedData);
      } catch (error) { console.error("Error posts:", error); } finally { setLoadingPosts(false); }
    };
    fetchPosts();
  }, [activeTab, user]);

  // --- HANDLERS ---
  const handleAvatarChange = (e) => { const file = e.target.files[0]; if (file) { setAvatarFile(file); setPreviewUrl(URL.createObjectURL(file)); } };
  
  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
      const updates = {
        id: user.id, full_name: formData.full_name, job_title: formData.job_title,
        department: formData.department, location: formData.location, bio: formData.bio,
        avatar_url: avatarUrl, updated_at: new Date(),
      };
      const { error } = await supabase.from('profiles').upsert(updates);
      if (error) throw error;
      
      // Gọi refresh từ Context để cập nhật toàn app
      await refreshProfile();
      
      setIsEditing(false); setAvatarFile(null); alert("Cập nhật thành công!");
    } catch (error) { alert('Lỗi cập nhật: ' + error.message); } finally { setIsSaving(false); }
  };

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passData;
    if (!currentPassword || !newPassword || !confirmPassword) return alert("Vui lòng nhập đầy đủ các trường mật khẩu");
    setLoadingPass(true);
    try {
        const { error: verifyError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
        if (verifyError) throw new Error("Mật khẩu hiện tại không chính xác!");
        if (newPassword !== confirmPassword) throw new Error("Mật khẩu mới và xác nhận không khớp.");
        if (newPassword.length < 6) throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
        if (newPassword === currentPassword) throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ.");
        const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
        if (updateError) throw updateError;
        alert("Đổi mật khẩu thành công!");
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) { alert(error.message || "Lỗi đổi mật khẩu"); } finally { setLoadingPass(false); }
  };

  if (isLoadingUser) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
       
       {/* EDIT MODAL */}
       {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-800">Edit Profile</h3>
              <button onClick={() => setIsEditing(false)}><X className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            <div className="p-6 grid gap-6 max-h-[70vh] overflow-y-auto">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative group">
                   <img src={previewUrl || formData.avatar_url || "https://github.com/shadcn.png"} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"/>
                   <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                      <Camera className="text-white w-8 h-8"/><input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange}/>
                   </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Full Name</label><input type="text" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Job Title</label><input type="text" value={formData.job_title} onChange={e => setFormData({...formData, job_title: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Department</label><input type="text" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"/></div>
                <div className="space-y-2"><label className="text-sm font-medium text-gray-700">Location</label><input type="text" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Hanoi"/></div>
                <div className="space-y-2 md:col-span-2"><label className="text-sm font-medium text-gray-700">Bio</label><textarea value={formData.bio} onChange={e => setFormData({...formData, bio: e.target.value})} className="w-full p-2 border border-gray-200 rounded-lg outline-none h-24 resize-none focus:ring-2 focus:ring-blue-500"/></div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
               <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg">Cancel</button>
               <button onClick={handleSaveProfile} disabled={isSaving} className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">{isSaving && <Loader2 className="w-4 h-4 animate-spin"/>} Save Changes</button>
            </div>
          </div>
        </div>
       )}

       {/* HEADER */}
       <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
         <div className="px-4 sm:px-6 lg:px-8">
           <div className="flex h-16 items-center justify-between">
             <div className="flex items-center gap-3"><h2 className="text-xl font-bold text-gray-800">My Profile</h2></div>
             <div className="flex items-center gap-4 ml-auto">
               <div className="relative hidden sm:block group">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                 <input type="text" placeholder="Search..." className="pl-10 pr-4 h-10 w-48 lg:w-72 bg-gray-50/50 border border-gray-200 rounded-full text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
               </div>
               
               {/* SỬ DỤNG COMPONENT NOTIFICATION LIST */}
               <NotificationList  />
               
             </div>
           </div>
         </div>
       </header>

       {/* CONTENT */}
       <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-7xl mx-auto">
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
           
           {/* LEFT COLUMN */}
           <div className="lg:col-span-4 space-y-6">
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden sticky top-24 z-0">
               <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>
               <div className="px-6 pb-6 text-center -mt-16">
                 <div className="relative inline-block">
                    <img src={profile?.avatar_url || "https://github.com/shadcn.png"} alt="Profile" className="w-32 h-32 rounded-full border-4 border-white shadow-md object-cover bg-white"/>
                 </div>
                 <div className="mt-4">
                    <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || "New User"}</h2>
                    <p className="text-blue-600 font-medium">{profile?.job_title || "No Job Title"}</p>
                 </div>
                 <div className="flex items-center justify-center gap-4 mt-4 text-sm text-gray-500">
                    <div className="flex items-center gap-1"><Briefcase className="w-4 h-4"/> <span>{profile?.department || "No Dept"}</span></div>
                    <div className="flex items-center gap-1"><MapPin className="w-4 h-4"/> <span>{profile?.location || "No Location"}</span></div>
                 </div>
                 {profile?.bio && <p className="mt-4 text-gray-600 text-sm leading-relaxed px-4 italic">"{profile.bio}"</p>}
                 <button onClick={() => setIsEditing(true)} className="mt-6 w-full bg-gray-900 text-white py-2.5 rounded-xl font-semibold hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200">
                   <Edit className="w-4 h-4" /> Edit Profile
                 </button>
               </div>
             </div>

             {/* CHANGE PASSWORD */}
             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4 text-gray-900"><Lock className="w-5 h-5 text-gray-700" /><h3 className="font-bold">Security</h3></div>
                <div className="space-y-4">
                    <div className="relative">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Current Password</label>
                        <div className="relative">
                            <input type={showPassword.current ? "text" : "password"} value={passData.currentPassword} onChange={(e) => setPassData({...passData, currentPassword: e.target.value})} className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Enter current password" />
                            <button type="button" onClick={() => toggleShow('current')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword.current ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                    </div>
                    <div className="relative">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">New Password</label>
                        <div className="relative">
                            <input type={showPassword.new ? "text" : "password"} value={passData.newPassword} onChange={(e) => setPassData({...passData, newPassword: e.target.value})} className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Min 6 characters" />
                            <button type="button" onClick={() => toggleShow('new')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword.new ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                    </div>
                    <div className="relative">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Confirm Password</label>
                        <div className="relative">
                            <input type={showPassword.confirm ? "text" : "password"} value={passData.confirmPassword} onChange={(e) => setPassData({...passData, confirmPassword: e.target.value})} className="w-full p-2.5 pr-10 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Re-enter new password" />
                            <button type="button" onClick={() => toggleShow('confirm')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPassword.confirm ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                        </div>
                    </div>
                    <button onClick={handleUpdatePassword} disabled={loadingPass} className="w-full mt-2 bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2">{loadingPass ? <Loader2 className="w-4 h-4 animate-spin"/> : <CheckCircle className="w-4 h-4"/>} Update Password</button>
                </div>
             </div>
           </div>

           {/* RIGHT COLUMN */}
           <div className="lg:col-span-8 space-y-6">
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-blue-300 transition-all group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors"><Download className="w-5 h-5 text-blue-600" /></div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Total</span>
                 </div>
                 <div className="text-3xl font-bold text-gray-900">{stats.received}</div>
                 <p className="text-sm text-gray-500 mt-1">Kudos Received</p>
               </div>
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-purple-300 transition-all group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center group-hover:bg-purple-100 transition-colors"><Upload className="w-5 h-5 text-purple-600" /></div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded-full">Total</span>
                 </div>
                 <div className="text-3xl font-bold text-gray-900">{stats.given}</div>
                 <p className="text-sm text-gray-500 mt-1">Kudos Given</p>
               </div>
               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 hover:border-orange-300 transition-all group">
                 <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center group-hover:bg-orange-100 transition-colors"><Flame className="w-5 h-5 text-orange-600" /></div>
                    <span className="text-xs font-bold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">Active</span>
                 </div>
                 <div className="text-3xl font-bold text-gray-900">{stats.streak} Days</div>
                 <p className="text-sm text-gray-500 mt-1">Current Streak</p>
               </div>
             </div>

             <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden min-h-[500px]">
                <div className="flex border-b border-gray-100 sticky top-0 bg-white z-10">
                    <button onClick={() => setActiveTab('received')} className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'received' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>Received {activeTab === 'received' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}</button>
                    <button onClick={() => setActiveTab('given')} className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'given' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>Given {activeTab === 'given' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}</button>
                    <button onClick={() => setActiveTab('all')} className={`flex-1 py-4 text-sm font-semibold transition-colors relative ${activeTab === 'all' ? 'text-blue-600 bg-blue-50/50' : 'text-gray-500 hover:bg-gray-50'}`}>All Activity {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}</button>
                </div>
                
                <div className="p-4 sm:p-6 bg-gray-50/30">
                    {loadingPosts ? (
                        <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2"/><p className="text-gray-400 text-sm">Loading activity...</p></div>
                    ) : posts.length > 0 ? (
                        <div className="space-y-6">
                            {posts.map(item => (
                                <PostItem 
                                    key={item.id} 
                                    post={item} 
                                    // Không cần truyền currentUser vì PostItem tự lấy từ context
                                    onDelete={(id) => setPosts(posts.filter(p => p.id !== id))}
                                    onUpdate={(updatedPost) => setPosts(posts.map(p => p.id === updatedPost.id ? updatedPost : p))}
                                    onImageClick={(img) => window.open(img, '_blank')}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl opacity-50">{activeTab === 'received' ? '📥' : activeTab === 'given' ? '📤' : '🗂️'}</div>
                            <h3 className="text-gray-900 font-bold mb-2">No activity found</h3>
                            <p className="text-gray-500 text-sm max-w-xs mx-auto">No activity yet.</p>
                        </div>
                    )}
                </div>
             </div>
           </div>
         </div>
       </main>
    </div>
  );
};

export default ProfilePage;