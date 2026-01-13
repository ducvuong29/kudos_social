"use client";

import React, { useState, useEffect } from "react";
import {
  ThumbsUp,
  MessageSquare,
  Share2,
  MoreHorizontal,
  Edit2,
  Trash2,
  Send,
  X,
  Check,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { useUser } from "@/context/UserContext";
import { useApp } from "@/context/AppProvider";
import Image from "next/image";

// --- CONSTANTS ---
const REACTION_TYPES = [
  { id: "like", emoji: "👍", label: "Like", color: "text-blue-600" },
  { id: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { id: "haha", emoji: "😆", label: "Haha", color: "text-yellow-500" },
  { id: "wow", emoji: "😮", label: "Wow", color: "text-orange-500" },
  { id: "sad", emoji: "😢", label: "Sad", color: "text-yellow-600" },
  { id: "angry", emoji: "😡", label: "Angry", color: "text-red-700" },
];

const getTagColor = (tag) => {
  const colorMap = {
    Excellent: "bg-yellow-100 text-yellow-700 border-yellow-200",
    Brilliant: "bg-orange-100 text-orange-700 border-orange-200",
    TeamWork: "bg-emerald-100 text-emerald-700 border-emerald-200",
    LifeSaver: "bg-rose-100 text-rose-700 border-rose-200",
    DataWizard: "bg-cyan-100 text-cyan-700 border-cyan-200",
    ProblemSolver: "bg-violet-100 text-violet-700 border-violet-200",
    Creative: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    Leadership: "bg-red-100 text-red-700 border-red-200",
    Innovative: "bg-indigo-100 text-indigo-700 border-indigo-200",
  };
  return colorMap[tag] || "bg-gray-100 text-gray-700 border-gray-200";
};

const triggerConfetti = () => {
  confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
};

const PostItem = ({ post, onDelete, onUpdate, onImageClick }) => {
  const supabase = createClient();
  const { user: currentUser } = useUser();
  const { t } = useApp();

  // Post States
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editMessage, setEditMessage] = useState(post.message);

  // Comment Creation States
  const [showComments, setShowComments] = useState(false);
  const [commentInput, setCommentInput] = useState("");
  const [showMentionPopup, setShowMentionPopup] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionResults, setMentionResults] = useState([]);
  const [cursorPos, setCursorPos] = useState(0);
  const [pendingMentions, setPendingMentions] = useState([]);

  // --- MỚI: Comment Edit/Delete States ---
  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null); // ID của comment đang mở menu
  const [editingCommentId, setEditingCommentId] = useState(null); // ID của comment đang sửa
  const [editCommentContent, setEditCommentContent] = useState(""); // Nội dung đang sửa
  const [isDeleteConfirm, setIsDeleteConfirm] = useState(false);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null);
  // --- LOGIC POST ---
  const handleDeletePost = async () => {
    // Không cần window.confirm hay e.preventDefault ở đây nữa

    // 1. Đóng menu ngay để UI gọn gàng
    setIsMenuOpen(false);

    // 2. Gọi API xóa
    const { error } = await supabase.from("kudos").delete().eq("id", post.id);

    if (error) {
      alert("Lỗi xóa: " + error.message);
      setIsDeleteConfirm(false); // Reset lại nếu lỗi
    } else {
      onDelete(post.id); // Cập nhật UI thành công
    }
  };
  const handleUpdatePost = async () => {
    if (!editMessage.trim()) return alert("Nội dung trống!");
    const { error } = await supabase
      .from("kudos")
      .update({ message: editMessage })
      .eq("id", post.id);
    if (!error) {
      onUpdate({ ...post, message: editMessage });
      setIsEditing(false);
    }
  };

  const handleReaction = async (type) => {
    if (!currentUser) return;

    const existingReaction = post.reactions.find(
      (r) => r.user_id === currentUser.id
    );
    const isRemoving = existingReaction && existingReaction.type === type;

    let newReactions = post.reactions.filter(
      (r) => r.user_id !== currentUser.id
    );

    if (!isRemoving) {
      newReactions.push({ user_id: currentUser.id, type });
      triggerConfetti();
    }
    onUpdate({ ...post, reactions: newReactions });

    await supabase
      .from("reactions")
      .delete()
      .match({ kudos_id: post.id, user_id: currentUser.id });
    if (!isRemoving) {
      await supabase
        .from("reactions")
        .insert({ kudos_id: post.id, user_id: currentUser.id, type });

      if (post.sender?.id !== currentUser.id) {
        await supabase.from("notifications").insert({
          recipient_id: post.sender.id,
          sender_id: currentUser.id,
          type: "reaction",
          resource_id: post.id,
        });
      }
    }
  };

  // --- LOGIC COMMENT CREATION ---
  const handleCommentChange = async (e) => {
    const val = e.target.value;
    setCommentInput(val);
    const cursor = e.target.selectionStart;
    setCursorPos(cursor);

    const textBeforeCursor = val.slice(0, cursor);
    const words = textBeforeCursor.split(/\s+/);
    const currentWord = words[words.length - 1];

    if (currentWord.startsWith("@")) {
      setShowMentionPopup(true);
      setMentionQuery(currentWord.substring(1));
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${currentWord.substring(1)}%`)
        .neq("id", currentUser.id)
        .limit(5);
      if (data) setMentionResults(data);
    } else {
      setShowMentionPopup(false);
    }
  };

  const insertMention = (user) => {
    const textBefore = commentInput.slice(0, cursorPos);
    const textAfter = commentInput.slice(cursorPos);
    const words = textBefore.split(/\s+/);
    words.pop();
    const newText = words.join(" ") + ` @${user.full_name} ` + textAfter;
    setCommentInput(newText);
    setShowMentionPopup(false);
    if (!pendingMentions.find((u) => u.id === user.id)) {
      setPendingMentions([...pendingMentions, user]);
    }
  };

  const submitComment = async () => {
    if (!commentInput.trim() || !currentUser) return;

    const { data: newComment, error } = await supabase
      .from("comments")
      .insert({
        kudos_id: post.id,
        user_id: currentUser.id,
        content: commentInput,
      })
      .select("*, user:user_id(full_name, avatar_url, id)")
      .single();

    if (!error) {
      const updatedComments = [...(post.comments || []), newComment];
      onUpdate({ ...post, comments: updatedComments });

      setCommentInput("");
      setPendingMentions([]);

      if (post.sender?.id !== currentUser.id) {
        await supabase.from("notifications").insert({
          recipient_id: post.sender.id,
          sender_id: currentUser.id,
          type: "comment",
          resource_id: post.id,
        });
      }

      const processedIds = new Set();
      for (const user of pendingMentions) {
        if (
          commentInput.includes(user.full_name) &&
          !processedIds.has(user.id)
        ) {
          await supabase.from("notifications").insert({
            recipient_id: user.id,
            sender_id: currentUser.id,
            type: "mention",
            resource_id: post.id,
          });
          processedIds.add(user.id);
        }
      }
    }
  };

  // --- MỚI: LOGIC SỬA/XÓA COMMENT ---
  const handleDeleteComment = async (commentId) => {
    // 1. Backup dữ liệu cũ để revert nếu lỗi
    const previousComments = [...post.comments];

    // 2. Optimistic Update (Ẩn comment ngay lập tức cho mượt)
    const updatedComments = post.comments.filter((c) => c.id !== commentId);
    onUpdate({ ...post, comments: updatedComments });

    // 3. Reset các state menu
    setActiveCommentMenuId(null);
    setConfirmDeleteCommentId(null);

    // 4. Gọi API xóa thật
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    // 5. Nếu lỗi thì khôi phục lại
    if (error) {
      console.error("Lỗi xóa comment:", error);
      alert("Không xóa được comment: " + error.message);
      onUpdate({ ...post, comments: previousComments }); // Hoàn tác
    }
  };

  const startEditingComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditCommentContent(comment.content);
    setActiveCommentMenuId(null);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editCommentContent.trim()) return;

    // 1. Gọi API update
    const { error } = await supabase
      .from("comments")
      .update({ content: editCommentContent })
      .eq("id", commentId);

    if (!error) {
      // 2. Cập nhật UI
      const updatedComments = post.comments.map((c) =>
        c.id === commentId ? { ...c, content: editCommentContent } : c
      );
      // GỌI HÀM CỦA CHA ĐỂ UPDATE SWR CACHE
      onUpdate({ ...post, comments: updatedComments });
      setEditingCommentId(null);
    } else {
      alert("Lỗi cập nhật: " + error.message);
    }
  };

  const reactionsCount = post.reactions
    ? post.reactions.reduce((acc, curr) => {
        acc[curr.type] = (acc[curr.type] || 0) + 1;
        return acc;
      }, {})
    : {};
  const myReaction = post.reactions?.find(
    (r) => r.user_id === currentUser?.id
  )?.type;

  const renderRecipients = (recipients) => {
    if (!recipients || recipients.length === 0)
      return <span className="text-gray-400">someone</span>;
    const names = recipients.map((r) => r.full_name);
    if (names.length === 1)
      return (
        <span className="font-bold text-lg text-blue-600">{names[0]}</span>
      );
    if (names.length === 2)
      return (
        <span className="font-bold text-lg text-blue-600">
          {names[0]} and {names[1]}
        </span>
      );
    return (
      <span className="font-bold text-lg text-blue-600">
        {names[0]}, {names[1]} and {names.length - 2} others
      </span>
    );
  };

  return (
    <Card
      id={`post-${post.id}`}
      className="border-none shadow-sm hover:shadow-lg transition-shadow duration-300 bg-white dark:bg-slate-800 rounded-2xl md:rounded-3xl overflow-visible transition-colors"
    >
      <CardContent className="p-4 md:p-8">
        <div className="flex gap-3 md:gap-5">
          <Avatar className="w-10 h-10 md:w-12 md:h-12 border border-gray-100 dark:border-slate-700">
            <AvatarImage src={post.sender?.avatar_url} />
            <AvatarFallback>
              {post.sender?.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            {/* Header Post */}
            <div className="flex justify-between mb-3 items-start relative">
              <div>
                <p className="text-sm md:text-base text-gray-900 dark:text-white leading-snug break-words">
                  <span className="font-bold text-base md:text-lg">
                    {post.sender?.full_name}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 mx-1">
                    {t.sentKudosTo}
                  </span>
                  {renderRecipients(post.receiverList)}
                </p>
                <p className="text-xs md:text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {formatDistanceToNow(new Date(post.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              {/* Menu & Tags */}
              <div className="flex items-center gap-2 shrink-0">
                {post.tags?.[0] && (
                  <Badge
                    className={`border-none px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm whitespace-nowrap ${getTagColor(
                      post.tags[0]
                    )}`}
                  >
                    {post.tags[0]}
                  </Badge>
                )}

                {currentUser?.id === post.sender?.id && (
                  <div className="relative">
                    <button
                      className="p-1.5 md:p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full cursor-pointer"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                      <MoreHorizontal size={20} />
                    </button>
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                        {/* Nút Edit (Giữ nguyên) */}
                        {!isDeleteConfirm && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Chặn click lan ra ngoài
                              setIsEditing(true);
                              setIsMenuOpen(false);
                            }}
                            className="w-full text-left px-4 py-3 text-sm flex gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 transition-colors cursor-pointer"
                          >
                            <Edit2 size={14} /> {t.edit}
                          </button>
                        )}

                        {/* LOGIC NÚT XÓA MỚI */}
                        {!isDeleteConfirm ? (
                          // TRẠNG THÁI 1: Hiện nút Xóa bình thường
                          <button
                            onClick={(e) => {
                              e.stopPropagation(); // Chặn click lan ra ngoài
                              setIsDeleteConfirm(true); // Chuyển sang chế độ xác nhận
                            }}
                            className="w-full text-left px-4 py-3 text-sm flex gap-2 hover:bg-red-50 dark:hover:bg-slate-800 text-red-600 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} /> {t.delete}
                          </button>
                        ) : (
                          // TRẠNG THÁI 2: Hiện xác nhận "Chắc chắn xóa?"
                          <div className="bg-red-50 dark:bg-red-900/10 p-2">
                            <p className="text-xs text-red-600 px-2 mb-2 font-medium">
                              Bạn chắc chứ?
                            </p>
                            <div className="flex gap-2 px-2 pb-1">
                              {/* Nút HỦY */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setIsDeleteConfirm(false); // Quay lại
                                }}
                                className="flex-1 py-1.5 text-xs bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-600 rounded text-gray-600 dark:text-gray-300 hover:bg-gray-100"
                              >
                                Hủy
                              </button>

                              {/* Nút XÓA THẬT */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(); // Gọi hàm xóa
                                }}
                                className="flex-1 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                              >
                                Xóa
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Content Post */}
            {isEditing ? (
              <div className="mb-5">
                <Textarea
                  value={editMessage}
                  onChange={(e) => setEditMessage(e.target.value)}
                  className="mb-2 min-h-[100px] text-base md:text-lg bg-gray-50 dark:bg-slate-900 dark:text-white dark:border-slate-700"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setIsEditing(false)}
                    className="cursor-pointer dark:text-gray-300 dark:hover:bg-slate-700"
                  >
                    {t.cancel}
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdatePost}
                    className="cursor-pointer"
                  >
                    {t.save}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-gray-800 dark:text-gray-200 mb-4 md:mb-5 whitespace-pre-wrap text-base md:text-lg leading-relaxed">
                {post.message}
              </p>
            )}

            {/* Images - ĐÃ SỬA: Thêm e.stopPropagation() */}
            {post.image_urls?.length > 0 && (
              <div
                className={`grid gap-2 md:gap-3 mb-4 md:mb-5 rounded-2xl overflow-hidden ${
                  post.image_urls.length > 1 ? "grid-cols-2" : "grid-cols-1"
                }`}
              >
                {post.image_urls.map((img, i) => (
                  <div
                    key={i}
                    className="relative aspect-video bg-gray-100 dark:bg-slate-900 cursor-zoom-in group"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onImageClick) onImageClick(img);
                    }}
                  >
                    <Image
                      src={img}
                      alt={`post-image-${i}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      quality={85}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                  </div>
                ))}
              </div>
            )}

            {/* Tags */}
            {post.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 md:mb-5">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="text-xs md:text-sm font-medium px-2.5 py-1 md:px-3 md:py-1.5 bg-blue-50 text-blue-600 rounded-lg bg-opacity-50"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            {/* Reactions Stats */}
            <div className="flex items-center justify-between py-3 border-t border-gray-50 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                {Object.keys(reactionsCount).length > 0 && (
                  <div className="flex -space-x-2 mr-1">
                    {Object.keys(reactionsCount).map((type) => (
                      <div
                        key={type}
                        className="w-6 h-6 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-[12px] shadow-sm ring-2 ring-white dark:ring-slate-800"
                      >
                        {REACTION_TYPES.find((r) => r.id === type)?.emoji}
                      </div>
                    ))}
                  </div>
                )}
                <span>
                  {post.reactions?.length || 0} {t.reactions}
                </span>
              </div>
              <div
                className="text-xs md:text-sm text-gray-500 dark:text-gray-400 cursor-pointer hover:underline"
                onClick={() => setShowComments(!showComments)}
              >
                {post.comments?.length || 0} {t.comments}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between md:justify-start gap-1 md:gap-4 pt-3 border-t border-gray-50 dark:border-gray-700 relative">
              <div className="relative group pb-2 flex-1 md:flex-none">
                <button
                  onClick={() => handleReaction(myReaction || "like")}
                  className={`w-full md:w-auto flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-6 py-2 md:py-2.5 rounded-full cursor-pointer transition-colors ${
                    myReaction
                      ? "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                  }`}
                >
                  {myReaction ? (
                    <span className="text-lg md:text-xl">
                      {REACTION_TYPES.find((r) => r.id === myReaction)?.emoji}
                    </span>
                  ) : (
                    <ThumbsUp size={18} className="md:w-5 md:h-5" />
                  )}
                  <span className="font-bold text-xs md:text-sm">
                    {myReaction
                      ? REACTION_TYPES.find((r) => r.id === myReaction)?.label
                      : t.like}
                  </span>
                </button>
                <div className="absolute bottom-12 left-0 hidden group-hover:flex bg-white dark:bg-slate-800 p-2 rounded-full shadow-xl gap-2 z-50 border border-gray-100 dark:border-gray-700 animate-in slide-in-from-bottom-2 fade-in">
                  {REACTION_TYPES.map((r) => (
                    <button
                      key={r.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(r.id);
                      }}
                      className="p-2 hover:scale-125 transition-transform text-2xl cursor-pointer"
                      title={r.label}
                    >
                      {r.emoji}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowComments(!showComments)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-6 py-2 md:py-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <MessageSquare size={18} className="md:w-5 md:h-5" />{" "}
                <span className="font-bold text-xs md:text-sm">
                  {t.comment}
                </span>
              </button>

              <button className="flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-2 md:px-6 py-2 md:py-2.5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors cursor-pointer md:ml-auto">
                <Share2 size={18} className="md:w-5 md:h-5" />
                <span className="font-bold text-xs md:text-sm md:hidden">
                  Share
                </span>
              </button>
            </div>

            {/* Comments Area - ĐÃ CẬP NHẬT */}
            <AnimatePresence>
              {showComments && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 md:mt-5 bg-gray-50 dark:bg-slate-900/50 rounded-2xl p-3 md:p-5"
                >
                  {post.comments?.length > 0 && (
                    <div className="space-y-5 mb-5 max-h-96 overflow-y-auto pr-2 custom-scrollbar ">
                      {post.comments.map((comment) => (
                        <div
                          key={comment.id}
                          className="flex gap-3 group/comment relative"
                        >
                          <Avatar className="w-8 h-8 md:w-9 md:h-9 mt-1">
                            <AvatarImage src={comment.user?.avatar_url} />
                            <AvatarFallback>U</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-white dark:bg-slate-800 p-3 md:p-4 rounded-2xl rounded-tl-none shadow-sm border border-gray-100 dark:border-slate-700 relative">
                              <div className="flex justify-between items-start">
                                <p className="text-xs md:text-sm font-bold text-gray-900 dark:text-white mb-1">
                                  {comment.user?.full_name}
                                </p>

                                {/* MỚI: Menu Edit/Delete cho Comment */}
                                {currentUser?.id === comment.user?.id &&
                                  !editingCommentId && (
                                    <div className="relative">
                                      <button
                                        onClick={() =>
                                          setActiveCommentMenuId(
                                            activeCommentMenuId === comment.id
                                              ? null
                                              : comment.id
                                          )
                                        }
                                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full opacity-0 group-hover/comment:opacity-100 transition-opacity"
                                      >
                                        <MoreHorizontal size={14} />
                                      </button>

                                      {activeCommentMenuId === comment.id && (
                                        <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                                          {/* LOGIC: Nếu ĐANG xác nhận xóa comment này -> Hiện nút Có/Không */}
                                          {confirmDeleteCommentId ===
                                          comment.id ? (
                                            <div className="bg-red-50 dark:bg-red-900/20 p-1.5">
                                              <p className="text-[10px] text-center text-red-600 font-bold mb-1">
                                                Xóa thật?
                                              </p>
                                              <div className="flex gap-1">
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setConfirmDeleteCommentId(
                                                      null
                                                    ); // Hủy, quay lại menu thường
                                                  }}
                                                  className="flex-1 py-1 text-[10px] bg-white border rounded hover:bg-gray-100 text-gray-600"
                                                >
                                                  Hủy
                                                </button>
                                                <button
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteComment(
                                                      comment.id
                                                    ); // Xóa thật
                                                  }}
                                                  className="flex-1 py-1 text-[10px] bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                                                >
                                                  Xóa
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            // LOGIC: Menu bình thường (Edit / Delete)
                                            <>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  startEditingComment(comment);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs flex gap-2 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 transition-colors cursor-pointer"
                                              >
                                                <Edit2 size={12} /> {t.edit}
                                              </button>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  setConfirmDeleteCommentId(
                                                    comment.id
                                                  ); // Chuyển sang chế độ xác nhận
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs flex gap-2 hover:bg-red-50 dark:hover:bg-slate-800 text-red-600 transition-colors cursor-pointer"
                                              >
                                                <Trash2 size={12} /> {t.delete}
                                              </button>
                                            </>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  )}
                              </div>

                              {/* MỚI: Hiển thị nội dung hoặc ô Input khi sửa */}
                              {editingCommentId === comment.id ? (
                                <div className="mt-1">
                                  <Input
                                    value={editCommentContent}
                                    onChange={(e) =>
                                      setEditCommentContent(e.target.value)
                                    }
                                    className="h-8 text-xs md:text-sm mb-2"
                                    autoFocus
                                    onKeyDown={(e) =>
                                      e.key === "Enter" &&
                                      handleUpdateComment(comment.id)
                                    }
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setEditingCommentId(null)}
                                      className="text-xs text-gray-500 hover:underline cursor-pointer"
                                    >
                                      {t.cancel}
                                    </button>
                                    <button
                                      onClick={() =>
                                        handleUpdateComment(comment.id)
                                      }
                                      className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                                    >
                                      {t.save}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-xs md:text-sm text-gray-800 dark:text-gray-300 break-words whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              )}
                            </div>
                            <span className="text-[10px] md:text-xs text-gray-400 dark:text-gray-500 mt-1.5 ml-2 font-medium">
                              {formatDistanceToNow(
                                new Date(comment.created_at)
                              )}{" "}
                              ago
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Input Comment */}
                  <div className="flex gap-2 md:gap-3 relative items-start">
                    <Avatar className="w-8 h-8 md:w-9 md:h-9">
                      <AvatarImage src={currentUser?.avatar_url} />
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 relative">
                      <Input
                        value={commentInput}
                        onChange={handleCommentChange}
                        onKeyDown={(e) => e.key === "Enter" && submitComment()}
                        placeholder={t.writeComment}
                        className="bg-white dark:bg-slate-800 rounded-full pr-10 md:pr-12 py-4 md:py-5 shadow-sm border-gray-200 dark:border-slate-700 focus:ring-1 focus:ring-blue-500 dark:text-white dark:placeholder:text-gray-500 text-sm md:text-base"
                      />
                      {showMentionPopup && mentionResults.length > 0 && (
                        <div className="absolute bottom-full left-0 w-64 mb-2 bg-white dark:bg-slate-800 border rounded-xl shadow-xl z-50 overflow-hidden dark:border-slate-700">
                          {mentionResults.map((u) => (
                            <div
                              key={u.id}
                              className="p-3 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer flex gap-3 items-center transition-colors"
                              onClick={() => insertMention(u)}
                            >
                              <Avatar className="w-8 h-8">
                                <AvatarImage
                                  src={
                                    u.avatar_url ||
                                    "https://github.com/shadcn.png"
                                  }
                                />
                                <AvatarFallback>
                                  {u.full_name?.charAt(0).toUpperCase() || "U"}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-sm font-medium dark:text-gray-200">
                                {u.full_name}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      <button
                        onClick={submitComment}
                        className="absolute right-1.5 md:right-2 top-1/2 -translate-y-1/2 text-blue-600 hover:bg-blue-50 p-1.5 md:p-2 rounded-full transition-colors cursor-pointer"
                      >
                        <Send size={16} className="md:w-[18px] md:h-[18px]" />
                      </button>
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

// Custom comparison để control chính xác khi nào re-render
export default PostItem;
