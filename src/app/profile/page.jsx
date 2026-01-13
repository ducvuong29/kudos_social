"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  Upload,
  Flame,
  MapPin,
  Briefcase,
  X,
  Loader2,
  Camera,
  Edit,
  Lock,
  CheckCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import useSWR from "swr";
import PostItem from "@/components/feed/PostItem";
import NotificationList from "@/components/common/NotificationList";
import { useUser } from "@/context/UserContext";
import { useApp } from "@/context/AppProvider";

const ProfilePage = () => {
  const supabase = createClient();
  const { user, isLoading: isLoadingUser, refreshProfile } = useUser();
  const { t } = useApp();

  const [activeTab, setActiveTab] = useState("received");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingImage, setViewingImage] = useState(null);

  // Edit Profile & Password State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    job_title: "",
    department: "",
    location: "",
    bio: "",
    avatar_url: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loadingPass, setLoadingPass] = useState(false);
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // --- SET FORM DATA ---
  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        job_title: user.job_title || "",
        department: user.department || "",
        location: user.location || "",
        bio: user.bio || "",
        avatar_url: user.avatar_url || "",
      });
    }
  }, [user]);

  // --- SWR FETCH STATS ---
  const { data: stats } = useSWR(
    user ? ["profile-stats", user.id] : null,
    async () => {
      const { count: receivedCount } = await supabase
        .from("kudos_receivers")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      const { data: givenData, count: givenCount } = await supabase
        .from("kudos")
        .select("created_at", { count: "exact" })
        .eq("sender_id", user.id)
        .order("created_at", { ascending: false });

      let currentStreak = 0;
      if (givenData && givenData.length > 0) {
        const uniqueDates = [
          ...new Set(
            givenData.map(
              (item) => new Date(item.created_at).toISOString().split("T")[0]
            )
          ),
        ];
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000)
          .toISOString()
          .split("T")[0];
        if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
          currentStreak = 1;
          for (let i = 0; i < uniqueDates.length - 1; i++) {
            const diffDays = Math.ceil(
              Math.abs(
                new Date(uniqueDates[i]) - new Date(uniqueDates[i + 1])
              ) /
                (1000 * 60 * 60 * 24)
            );
            if (diffDays === 1) currentStreak++;
            else break;
          }
        }
      }
      return {
        received: receivedCount || 0,
        given: givenCount || 0,
        streak: currentStreak,
      };
    },
    {
      fallbackData: { received: 0, given: 0, streak: 0 },
      revalidateOnFocus: false,
    }
  );

  // --- SWR FETCH POSTS ---
  const {
    data: posts,
    isLoading: loadingPosts,
    mutate: mutatePosts,
  } = useSWR(
    user ? ["profile-posts", user.id, activeTab] : null,
    async () => {
      const selectQuery = `*,
        sender:sender_id(full_name, avatar_url, id),
        recipients:kudos_receivers(user:user_id(full_name, avatar_url, id)),
        comments(id, content, created_at, user:user_id(full_name, avatar_url, id)), 
        reactions(type, user_id)`;
      let dataToSet = [];
      const fetchGiven = async () => {
        const { data } = await supabase
          .from("kudos")
          .select(selectQuery)
          .eq("sender_id", user.id)
          .order("created_at", { ascending: false });
        return data || [];
      };
      const fetchReceived = async () => {
        const { data: refs } = await supabase
          .from("kudos_receivers")
          .select("kudos_id")
          .eq("user_id", user.id);
        const ids = refs ? refs.map((r) => r.kudos_id) : [];
        if (ids.length === 0) return [];
        const { data } = await supabase
          .from("kudos")
          .select(selectQuery)
          .in("id", ids)
          .order("created_at", { ascending: false });
        return data || [];
      };

      if (activeTab === "given") {
        dataToSet = await fetchGiven();
      } else if (activeTab === "received") {
        dataToSet = await fetchReceived();
      } else if (activeTab === "all") {
        const [givenData, receivedData] = await Promise.all([
          fetchGiven(),
          fetchReceived(),
        ]);
        const combinedMap = new Map();
        [...givenData, ...receivedData].forEach((p) =>
          combinedMap.set(p.id, p)
        );
        dataToSet = Array.from(combinedMap.values()).sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
      }

      return dataToSet.map((p) => ({
        ...p,
        receiverList: p.recipients ? p.recipients.map((r) => r.user) : [],
        image_urls: p.image_urls || (p.image_url ? [p.image_url] : []),
        comments: p.comments
          ? p.comments.sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            )
          : [],
        reactions: p.reactions || [],
      }));
    },
    {
      dedupingInterval: 10000,
      revalidateOnFocus: false,
      revalidateOnMount: true,
    }
  );

  const filteredPosts =
    posts?.filter((post) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      const matchMessage = post.message?.toLowerCase().includes(query);
      const matchSender = post.sender?.full_name?.toLowerCase().includes(query);
      const matchReceiver = post.receiverList?.some((r) =>
        r.full_name.toLowerCase().includes(query)
      );
      return matchMessage || matchSender || matchReceiver;
    }) || [];

  // --- HÀM UPDATE CACHE SWR (Dùng cho Sửa post & Comment & Reaction) ---
  const handleUpdatePostList = async (updatedPost) => {
    // false ở tham số thứ 2 nghĩa là chỉ update cache client, không fetch lại từ server
    await mutatePosts(
      posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
      false
    );
  };

  // --- HÀM DELETE CACHE SWR ---
  const handleDeletePostList = async (postId) => {
    await mutatePosts(
      posts.filter((p) => p.id !== postId),
      false
    );
  };

  const toggleShow = (field) =>
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = formData.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }
      const updates = {
        id: user.id,
        full_name: formData.full_name,
        job_title: formData.job_title,
        department: formData.department,
        location: formData.location,
        bio: formData.bio,
        avatar_url: avatarUrl,
        updated_at: new Date(),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      await refreshProfile();
      setIsEditing(false);
      setAvatarFile(null);
      alert("Cập nhật thành công!");
    } catch (error) {
      alert("Lỗi cập nhật: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdatePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passData;
    if (!currentPassword || !newPassword || !confirmPassword)
      return alert("Vui lòng nhập đầy đủ các trường mật khẩu");
    setLoadingPass(true);
    try {
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });
      if (verifyError) throw new Error("Mật khẩu hiện tại không chính xác!");
      if (newPassword !== confirmPassword)
        throw new Error("Mật khẩu mới và xác nhận không khớp.");
      if (newPassword.length < 6)
        throw new Error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      if (newPassword === currentPassword)
        throw new Error("Mật khẩu mới không được trùng với mật khẩu cũ.");
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;
      alert("Đổi mật khẩu thành công!");
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      alert(error.message || "Lỗi đổi mật khẩu");
    } finally {
      setLoadingPass(false);
    }
  };

  const handleFocusReadOnly = (e) => {
    e.target.removeAttribute("readonly");
  };

  if (isLoadingUser)
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-900">
        <Loader2 className="animate-spin text-blue-500 w-10 h-10" />
      </div>
    );
  if (!user)
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-500">
        Please log in to view your profile.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50/50 dark:bg-slate-900/50 pb-24 md:pb-10 transition-colors">
      {/* --- MODAL XEM ẢNH --- */}
      {viewingImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 cursor-zoom-out"
          onClick={() => setViewingImage(null)}
        >
          <div className="relative max-w-screen-xl max-h-screen w-full h-full flex items-center justify-center">
            <button
              onClick={() => setViewingImage(null)}
              className="absolute top-2 right-2 md:top-4 md:right-4 text-white/70 hover:text-white p-2 bg-black/50 hover:bg-black/70 rounded-full transition-all z-50 cursor-pointer"
            >
              <X size={32} />
            </button>
            <img
              src={viewingImage}
              alt="Full screen"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-default animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* POPUP EDIT PROFILE */}
      {isEditing && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50 shrink-0">
              <h3 className="font-bold text-lg text-gray-800 dark:text-white">
                {t.editProfile}
              </h3>
              <button onClick={() => setIsEditing(false)}>
                <X className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer" />
              </button>
            </div>
            <div className="p-6 grid gap-6 overflow-y-auto">
              <div className="flex flex-col items-center justify-center gap-4">
                <div className="relative group">
                  <img
                    src={
                      previewUrl ||
                      formData.avatar_url ||
                      "https://github.com/shadcn.png"
                    }
                    alt="Avatar"
                    className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-700 shadow-lg"
                  />
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["Full Name", "Job Title", "Department", "Location"].map(
                  (label) => {
                    const key = label.toLowerCase().replace(" ", "_");
                    return (
                      <div key={key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {label}
                        </label>
                        <input
                          type="text"
                          value={formData[key]}
                          onChange={(e) =>
                            setFormData({ ...formData, [key]: e.target.value })
                          }
                          className="w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    );
                  }
                )}
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none h-24 resize-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}{" "}
                {t.saveChanges}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40 transition-colors">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white truncate">
                {t.myProfile}
              </h2>
            </div>
            <div className="flex items-center gap-4 ml-auto hidden md:flex">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                <form
                  role="search"
                  autoComplete="off"
                  onSubmit={(e) => e.preventDefault()}
                >
                  <input
                    type="search"
                    name="search_query_profile"
                    autoComplete="off"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="pl-10 pr-4 h-10 w-64 bg-gray-50/50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-full text-sm focus:bg-white dark:focus:bg-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none transition-all dark:text-white"
                  />
                </form>
              </div>
              <NotificationList />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 lg:px-8 py-4 md:py-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-4 space-y-6">
            {/* Profile Info Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden z-10 transition-colors">
              <div className="h-24 md:h-32 bg-gradient-to-r from-blue-400 to-purple-500"></div>
              <div className="px-6 pb-6 text-center -mt-12 md:-mt-16">
                <div className="relative inline-block">
                  <img
                    src={user?.avatar_url || "https://github.com/shadcn.png"}
                    alt="Profile"
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-white dark:border-slate-800 shadow-md object-cover bg-white dark:bg-slate-700"
                  />
                </div>
                <div className="mt-3 md:mt-4">
                  <h2 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">
                    {user?.full_name || "New User"}
                  </h2>
                  <p className="text-sm md:text-base text-blue-600 dark:text-blue-400 font-medium">
                    {user?.job_title || "No Job Title"}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                    <Briefcase className="w-3 h-3" />
                    <span>{user?.department || "No Dept"}</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 dark:bg-slate-700/50 px-3 py-1 rounded-full">
                    <MapPin className="w-3 h-3" />
                    <span>{user?.location || "No Location"}</span>
                  </div>
                </div>
                {user?.bio && (
                  <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm leading-relaxed px-2 italic">
                    "{user.bio}"
                  </p>
                )}
                <button
                  onClick={() => setIsEditing(true)}
                  className="mt-6 w-full bg-gray-900 dark:bg-white text-white dark:text-slate-900 py-2.5 rounded-xl font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-all flex items-center justify-center gap-2 shadow-lg shadow-gray-200 dark:shadow-none cursor-pointer text-sm md:text-base"
                >
                  <Edit className="w-4 h-4" /> {t.editProfile}
                </button>
              </div>
            </div>

            {/* Security Card */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 md:p-6 z-0 transition-colors">
              <div className="flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                <Lock className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <h3 className="font-bold">{t.security}</h3>
              </div>
              <form autoComplete="off" action="#">
                <div style={{ position: "absolute", opacity: 0, zIndex: -10 }}>
                  <input
                    type="text"
                    name="fake_username"
                    tabIndex={-1}
                    defaultValue=" "
                  />
                  <input
                    type="password"
                    name="fake_password"
                    tabIndex={-1}
                    defaultValue=" "
                  />
                </div>
                <div className="space-y-4">
                  {["current", "new", "confirm"].map((field, idx) => {
                    const labels = [
                      "Current Password",
                      "New Password",
                      "Confirm Password",
                    ];
                    const keys = [
                      "currentPassword",
                      "newPassword",
                      "confirmPassword",
                    ];
                    return (
                      <div key={field} className="relative">
                        <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                          {labels[idx]}
                        </label>
                        <div className="relative">
                          <input
                            autoComplete="new-password"
                            name={`field_${field}_random`}
                            readOnly={true}
                            onFocus={handleFocusReadOnly}
                            type={showPassword[field] ? "text" : "password"}
                            value={passData[keys[idx]]}
                            onChange={(e) =>
                              setPassData({
                                ...passData,
                                [keys[idx]]: e.target.value,
                              })
                            }
                            className="w-full p-2.5 pr-10 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                            placeholder="..."
                          />
                          <button
                            type="button"
                            onClick={() => toggleShow(field)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                          >
                            {showPassword[field] ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={loadingPass}
                    className="w-full mt-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 py-2.5 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loadingPass ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}{" "}
                    {t.updatePassword}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="lg:col-span-8 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700 text-center md:text-left transition-all">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1 md:mb-4 items-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-50 dark:bg-blue-900/50 rounded-xl flex items-center justify-center mb-1 md:mb-0">
                    <Download className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {t.total}
                  </span>
                </div>
                <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.received}
                </div>
                <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {t.kudosReceived}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700 text-center md:text-left transition-all">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1 md:mb-4 items-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-purple-50 dark:bg-purple-900/50 rounded-xl flex items-center justify-center mb-1 md:mb-0">
                    <Upload className="w-4 h-4 md:w-5 md:h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                    {t.total}
                  </span>
                </div>
                <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.given}
                </div>
                <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {t.kudosGiven}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-3 md:p-5 shadow-sm border border-gray-200 dark:border-gray-700 text-center md:text-left transition-all">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-1 md:mb-4 items-center">
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-50 dark:bg-orange-900/50 rounded-xl flex items-center justify-center mb-1 md:mb-0">
                    <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="hidden md:inline-block text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-2 py-1 rounded-full">
                    {t.active}
                  </span>
                </div>
                <div className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white">
                  {stats?.streak} Days
                </div>
                <p className="text-[10px] md:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                  {t.currentStreak}
                </p>
              </div>
            </div>

            {/* Posts List */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden min-h-[500px] transition-colors">
              <div className="flex border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
                {["received", "given", "all"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSearchQuery("");
                    }}
                    className={`flex-1 py-4 text-sm font-semibold transition-colors relative cursor-pointer ${
                      activeTab === tab
                        ? "text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/20"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {tab === "received"
                      ? t.received
                      : tab === "given"
                      ? t.given
                      : t.allActivity}
                    {activeTab === tab && (
                      <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 dark:bg-blue-400"></div>
                    )}
                  </button>
                ))}
              </div>

              <div className="p-4 sm:p-6 bg-gray-50/30 dark:bg-slate-900/50">
                {loadingPosts && !posts ? (
                  <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">{t.loading}</p>
                  </div>
                ) : filteredPosts && filteredPosts.length > 0 ? (
                  <div className="space-y-6">
                    {filteredPosts.map((item) => (
                      <PostItem
                        key={item.id}
                        post={item}
                        onDelete={handleDeletePostList}
                        onUpdate={handleUpdatePostList}
                        onImageClick={(img) => setViewingImage(img)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl opacity-50">
                      {activeTab === "received"
                        ? "📥"
                        : activeTab === "given"
                        ? "📤"
                        : "🗂️"}
                    </div>
                    <h3 className="text-gray-900 dark:text-white font-bold mb-2">
                      {t.noResults}
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mx-auto">
                      {searchQuery
                        ? `${t.noResults} "${searchQuery}"`
                        : t.noPosts}
                    </p>
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
