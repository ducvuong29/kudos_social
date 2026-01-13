"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  AtSign,
  Hash,
  Image as ImageIcon,
  X,
  Sparkles,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/context/UserContext";
import { useApp } from "@/context/AppProvider";

const predefinedTags = [
  "Excellent",
  "Brilliant",
  "TeamWork",
  "LifeSaver",
  "DataWizard",
  "ProblemSolver",
  "Creative",
  "Leadership",
  "Innovative",
];

const getTagColorClass = (tag) => {
  const colors = [
    "bg-rose-600 text-white border-rose-600",
    "bg-blue-600 text-white border-blue-600",
    "bg-emerald-600 text-white border-emerald-600",
    "bg-violet-600 text-white border-violet-600",
    "bg-orange-600 text-white border-orange-600",
    "bg-cyan-600 text-white border-cyan-600",
    "bg-fuchsia-600 text-white border-fuchsia-600",
  ];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

const CreateKudos = ({ onSuccess }) => {
  const supabase = createClient();
  const fileInputRef = useRef(null);
  const searchInputRef = useRef(null);
  const searchContainerRef = useRef(null);
  const { t } = useApp();
  const { user: currentUser } = useUser();

  const [message, setMessage] = useState("");
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]); // ẢNH ĐƯỢC CHỌN
  const [previewUrls, setPreviewUrls] = useState([]); // ẢNH XEM TRƯỚC
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showUserSearch, setShowUserSearch] = useState(false);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);

  // --- LOGIC ---
  const handleAtClick = () => {
    setIsSearchActive(true);
    setShowUserSearch(true);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setIsSearchActive(false);
        setShowUserSearch(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleTag = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length >= 5)
        return alert("Bạn chỉ được chọn tối đa 5 thẻ!");
      setSelectedTags([...selectedTags, tag]);
    }
  };
  // KHI ẤN VÀO TAG THÌ XÓA TAG
  const handleRemoveTag = (tagToRemove) =>
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));

  const handleFileSelect = (e) => {
    if (e.target.files?.length) {
      const files = Array.from(e.target.files);
      setSelectedFiles((p) => [...p, ...files]);
      setPreviewUrls((p) => [
        ...p,
        ...files.map((f) => URL.createObjectURL(f)),
      ]);
    }
  };

  const uploadImages = async () => {
    const uploadedUrls = [];
    for (const file of selectedFiles) {
      const fileName = `${Date.now()}_${Math.random()
        .toString(36)
        .substring(2)}.${file.name.split(".").pop()}`;
      const { error } = await supabase.storage
        .from("kudos_images")
        .upload(`${currentUser.id}/${fileName}`, file);
      if (!error) {
        const { data } = supabase.storage
          .from("kudos_images")
          .getPublicUrl(`${currentUser.id}/${fileName}`);
        if (data) uploadedUrls.push(data.publicUrl);
      }
    }
    return uploadedUrls;
  };

  const handleSearchUser = async (val) => {
    setSearchQuery(val);
    setShowUserSearch(true);
    if (val.length > 0) {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${val}%`)
        .neq("id", currentUser.id)
        .limit(5);
      if (data) setSearchResults(data);
    } else setSearchResults([]);
  };

  const handleSubmit = async () => {
    if (!currentUser) return alert("Vui lòng đăng nhập!");
    if (
      (!message.trim() && selectedFiles.length === 0) ||
      selectedReceivers.length === 0
    ) {
      return alert("Vui lòng chọn người nhận và nội dung!");
    }
    setIsSubmitting(true);
    try {
      const imageUrls = selectedFiles.length > 0 ? await uploadImages() : [];
      const { data: newKudos, error } = await supabase
        .from("kudos")
        .insert([
          {
            sender_id: currentUser.id,
            receiver_id: selectedReceivers[0].id,
            message: message,
            tags: selectedTags,
            image_urls: imageUrls,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      // INSERT DATA FOR KUDOS_RECEIVERS TABLE
      const receiversData = selectedReceivers.map((r) => ({
        kudos_id: newKudos.id,
        user_id: r.id,
      }));
      await supabase.from("kudos_receivers").insert(receiversData);

      const notificationsData = selectedReceivers.map((receiver) => ({
        recipient_id: receiver.id,
        sender_id: currentUser.id,
        type: "kudos",
        resource_id: newKudos.id,
        is_read: false,
      }));
      if (notificationsData.length > 0)
        await supabase.from("notifications").insert(notificationsData);

      setMessage("");
      setSelectedReceivers([]);
      setSelectedTags([]);
      setSelectedFiles([]);
      setPreviewUrls([]);

      if (onSuccess) {
        onSuccess();
      }
    } catch (e) {
      alert("Lỗi: " + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    // THAY ĐỔI: Giảm margin-bottom và border-radius trên mobile
    <Card className="mb-4 md:mb-8 border-none shadow-lg shadow-indigo-900/5 overflow-visible bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl transition-colors">
      <CardContent className="p-4 md:p-8">
        <div className="flex gap-3 md:gap-5">
          {/* Avatar nhỏ hơn trên mobile */}
          <Avatar className="w-10 h-10 md:w-14 md:h-14 border-2 border-white dark:border-slate-700 shadow-md ring-2 ring-indigo-50 dark:ring-slate-700">
            <AvatarImage
              src={currentUser?.avatar_url || "https://github.com/shadcn.png"}
            />
            <AvatarFallback>
              {currentUser?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Selected Receivers */}
            <div className="flex flex-wrap gap-2 mb-3">
              {selectedReceivers.map((u) => (
                <Badge
                  key={u.id}
                  variant="secondary"
                  className="pl-1 pr-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-full flex items-center gap-2 transition-colors"
                >
                  <Avatar className="w-5 h-5 md:w-6 md:h-6">
                    <AvatarImage
                      src={u.avatar_url || "https://github.com/shadcn.png"}
                    />
                  </Avatar>
                  <span className="truncate max-w-[100px] md:max-w-none">
                    {u.full_name}
                  </span>
                  <button
                    onClick={() =>
                      setSelectedReceivers((prev) =>
                        prev.filter((r) => r.id !== u.id)
                      )
                    }
                    className="ml-1 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded-full p-0.5 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </Badge>
              ))}
            </div>

            {/* Search Input - responsive height */}
            <div className="mb-3 relative group" ref={searchContainerRef}>
              <Input
                ref={searchInputRef}
                placeholder={t.sendKudosPlaceholder}
                value={searchQuery}
                onChange={(e) => handleSearchUser(e.target.value)}
                onFocus={() => {
                  setIsSearchActive(true);
                  setShowUserSearch(true);
                }}
                className={`h-12 md:h-14 pl-4 md:pl-5 border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-slate-900/50 text-base md:text-lg rounded-xl md:rounded-2xl transition-all font-medium dark:text-white dark:placeholder:text-gray-500 ${
                  isSearchActive
                    ? "bg-white dark:bg-slate-900 ring-2 ring-indigo-500/20 border-indigo-500 shadow-sm"
                    : ""
                }`}
              />
              {/* ... (Phần hiển thị kết quả tìm kiếm giữ nguyên) */}
              {showUserSearch && searchResults.length > 0 && (
                <div className="absolute top-full left-0 w-full mt-2 bg-white dark:bg-slate-800 border border-gray-100 dark:border-gray-700 shadow-2xl z-50 p-2 max-h-60 overflow-y-auto rounded-xl animate-in fade-in zoom-in-95">
                  {searchResults.map((u) => (
                    <div
                      key={u.id}
                      className="p-3 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-xl cursor-pointer flex gap-3 items-center transition-colors group/item"
                      onClick={() => {
                        if (!selectedReceivers.find((r) => r.id === u.id))
                          setSelectedReceivers([...selectedReceivers, u]);
                        setSearchQuery("");
                        setShowUserSearch(false);
                        setIsSearchActive(false);
                      }}
                    >
                      <Avatar className="w-9 h-9 border border-indigo-100 dark:border-slate-600">
                        <AvatarImage
                          src={u.avatar_url || "https://github.com/shadcn.png"}
                        />
                        <AvatarFallback>
                          {u.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-semibold text-gray-700 dark:text-gray-200 group-hover/item:text-indigo-700 dark:group-hover/item:text-indigo-400 transition-colors">
                        {u.full_name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Textarea */}
            <Textarea
              placeholder={t.whatDidTheyDo}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="mb-4 border-none p-0 text-base md:text-xl min-h-[60px] md:min-h-[80px] resize-none focus-visible:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 font-light leading-relaxed bg-transparent dark:text-white"
            />

            {/* ... (Phần Tags & Images Preview giữ nguyên) */}
            {selectedTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 animate-in slide-in-from-top-2 fade-in">
                {selectedTags.map((t) => (
                  <Badge
                    key={t}
                    className={`pl-3 pr-2 py-1.5 gap-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-all ${getTagColorClass(
                      t
                    )}`}
                  >
                    #{t}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveTag(t);
                      }}
                      className="p-0.5 bg-white/20 hover:bg-white/40 rounded-full transition-colors backdrop-blur-sm cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            {previewUrls.length > 0 && (
              <div className="mb-4 grid grid-cols-3 gap-3 animate-in fade-in">
                {previewUrls.map((url, i) => (
                  <div
                    key={i}
                    className="relative aspect-square rounded-2xl overflow-hidden shadow-sm group"
                  >
                    <img src={url} className="object-cover w-full h-full" />
                    <button
                      onClick={() => {
                        setSelectedFiles(
                          selectedFiles.filter((_, idx) => idx !== i)
                        );
                        setPreviewUrls(
                          previewUrls.filter((_, idx) => idx !== i)
                        );
                      }}
                      className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500 cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Tag Suggestions - Giữ nguyên */}
            {showTagSuggestions && (
              <div className="mb-6 p-5 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700 animate-in zoom-in-95">
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <Sparkles size={14} className="text-yellow-500" />{" "}
                  {t.suggestedTags}
                </div>
                <div className="flex flex-wrap gap-2.5">
                  {predefinedTags.map((tag) => {
                    const isSelected = selectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        onClick={() => handleToggleTag(tag)}
                        className={`relative px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ease-out select-none border-2 cursor-pointer ${
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 scale-105"
                            : "bg-white dark:bg-slate-800 border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-indigo-200 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-700"
                        }`}
                      >
                        {tag}
                        {isSelected && (
                          <Check
                            size={14}
                            className="inline ml-1.5 -mt-0.5 stroke-[3]"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Footer Buttons - Flex wrap và điều chỉnh kích thước */}
            <div className="flex flex-wrap justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-700 gap-2">
              <div className="flex gap-1 md:gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleAtClick}
                  className={`rounded-full cursor-pointer transition-colors w-8 h-8 md:w-10 md:h-10 ${
                    isSearchActive
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                >
                  <AtSign size={18} className="md:w-5 md:h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full cursor-pointer transition-colors w-8 h-8 md:w-10 md:h-10 ${
                    showTagSuggestions
                      ? "bg-indigo-100 text-indigo-600"
                      : "text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-gray-600 dark:hover:text-gray-300"
                  }`}
                  onClick={() => setShowTagSuggestions(!showTagSuggestions)}
                >
                  <Hash size={18} className="md:w-5 md:h-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full cursor-pointer text-gray-400 dark:text-gray-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 transition-colors w-8 h-8 md:w-10 md:h-10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon size={18} className="md:w-5 md:h-5" />
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  hidden
                  multiple
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </div>
              <Button
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 md:px-8 py-4 md:py-6 font-bold text-sm md:text-base shadow-xl cursor-pointer shadow-indigo-200 dark:shadow-none active:scale-95 transition-all ml-auto"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="animate-spin mr-2">⏳</span>
                ) : (
                  <span className="mr-2">🚀</span>
                )}{" "}
                {t.sendKudos}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreateKudos;
