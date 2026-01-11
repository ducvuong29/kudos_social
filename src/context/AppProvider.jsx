"use client"

import { createContext, useContext, useState, useEffect } from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

// 1. Tạo Context Ngôn ngữ
const LanguageContext = createContext();

// Dictionary đơn giản cho Demo (Thực tế nên tách file json riêng)
const translations = {
  en: {
    newsFeed: "News Feed",
    leaderboard: "Leaderboard",
    profile: "Profile",
    community: "Community",
    settings: "Settings",
    logOut: "Log Out",
    online: "Online",
    theme: "Theme",
    language: "Language",
    light: "Light",
    dark: "Dark",
    loading: "Loading...",
    searchPlaceholder: "Search kudos messages...",
    noResults: "No kudos found for",
    noPosts: "No posts yet. Be the first!",
    endOfList: "You've reached the end!",
    myProfile: "My Profile",
    editProfile: "Edit Profile",
    received: "Received",
    given: "Given",
    allActivity: "All Activity",
    kudosReceived: "Kudos Received",
    kudosGiven: "Kudos Given",
    currentStreak: "Current Streak",
    total: "Total",
    active: "Active",
    saveChanges: "Save Changes",
    cancel: "Cancel",
    security: "Security",
    updatePassword: "Update Password",
    loading: "Loading...",
    sentKudosTo: "sent kudos to",
    and: "and",
    others: "others",
    someone: "someone",
    writeComment: "Write a comment...",
    sendKudosPlaceholder: "Send kudos to someone...",
    whatDidTheyDo: "What did they do amazing?...",
    sendKudos: "Send Kudos",
    suggestedTags: "Suggested Tags",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    comment: "Comment",
    share: "Share",
    reactions: "reactions",
    comments: "comments",
    topGivers: "Top Givers",
    topReceivers: "Top Receivers",
    trendingNow: "Trending Now",
    totalKudosReceived: "Total Kudos Received",
    youAreDoingGreat: "You are doing great!",
    findColleague: "Find colleague...",
    mostAppreciated: "Most Appreciated",
    topContributors: "Top Contributors",
    thisWeek: "This Week",
    thisMonth: "This Month",
    allTime: "All Time",
    calculatingScores: "Calculating scores...",
    rank: "Rank",
    colleague: "Colleague",
    department: "Department",
    count: "Count",
    trend: "Trend",
    noDataYet: "No data yet.",
    noColleaguesFound: "No colleagues found matching",
    received: "Received",
    given: "Given",
    notifications: "Notifications",
    markAllRead: "Mark all read",
    noNewNotifications: "No new notifications",
    sentYouAKudos: "sent you a kudos!",
    reactedToYourPost: "reacted to your post.",
    commentedOnYourPost: "commented on your post.",
    mentionedYou: "mentioned you."
  },
  vi: {
    newsFeed: "Bảng tin",
    leaderboard: "Xếp hạng",
    profile: "Cá nhân",
    community: "Cộng đồng",
    settings: "Cài đặt",
    logOut: "Đăng xuất",
    online: "Trực tuyến",
    theme: "Giao diện",
    language: "Ngôn ngữ",
    light: "Sáng",
    dark: "Tối",
    loading: "Đang tải...",
    searchPlaceholder: "Tìm kiếm lời khen...",
    noResults: "Không tìm thấy kết quả cho",
    noPosts: "Chưa có bài viết nào. Hãy mở bát!",
    endOfList: "Bạn đã xem hết tin!",
    myProfile: "Hồ sơ của tôi",
    editProfile: "Chỉnh sửa hồ sơ",
    received: "Đã nhận",
    given: "Đã gửi",
    allActivity: "Tất cả hoạt động",
    kudosReceived: "Kudos đã nhận",
    kudosGiven: "Kudos đã gửi",
    currentStreak: "Chuỗi ngày",
    total: "Tổng",
    active: "Tích cực",
    saveChanges: "Lưu thay đổi",
    cancel: "Hủy",
    security: "Bảo mật",
    updatePassword: "Cập nhật mật khẩu",
    loading: "Đang tải...",
    sentKudosTo: "đã gửi kudos tới",
    and: "và",
    others: "người khác",
    someone: "ai đó",
    writeComment: "Viết bình luận...",
    sendKudosPlaceholder: "Gửi lời khen tới ai đó...",
    whatDidTheyDo: "Họ đã làm gì tuyệt vời?...",
    sendKudos: "Gửi Kudos",
    suggestedTags: "Gợi ý thẻ",
    edit: "Sửa",
    delete: "Xóa",
    save: "Lưu",
    cancel: "Hủy",
    comment: "Bình luận",
    share: "Chia sẻ",
    reactions: "cảm xúc",
    comments: "bình luận",
    topGivers: "Người gửi nhiều nhất",
    topReceivers: "Người nhận nhiều nhất",
    trendingNow: "Xu hướng",
    totalKudosReceived: "Tổng Kudos đã nhận",
    youAreDoingGreat: "Bạn đang làm rất tốt!",
    findColleague: "Tìm đồng nghiệp...",
    mostAppreciated: "Được yêu thích nhất",
    topContributors: "Đóng góp hàng đầu",
    thisWeek: "Tuần này",
    thisMonth: "Tháng này",
    allTime: "Tất cả",
    calculatingScores: "Đang tính điểm...",
    rank: "Hạng",
    colleague: "Đồng nghiệp",
    department: "Phòng ban",
    count: "Số lượng",
    trend: "Xu hướng",
    noDataYet: "Chưa có dữ liệu.",
    noColleaguesFound: "Không tìm thấy đồng nghiệp phù hợp với",
    received: "Đã nhận",
    given: "Đã gửi",
    notifications: "Thông báo",
    markAllRead: "Đánh dấu tất cả đã đọc",
    noNewNotifications: "Không có thông báo mới",
    sentYouAKudos: "đã gửi kudos cho bạn! 🎉",
    reactedToYourPost: "đã bày tỏ cảm xúc về bài viết của bạn.",
    commentedOnYourPost: "đã bình luận về bài viết của bạn.",
    mentionedYou: "đã nhắc đến bạn."
  }
};

export const AppProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Lưu ngôn ngữ vào LocalStorage
  useEffect(() => {
    const savedLang = localStorage.getItem('app-lang');
    if (savedLang) setLanguage(savedLang);
  }, []);

  const changeLanguage = (lang) => {
    setLanguage(lang);
    localStorage.setItem('app-lang', lang);
  };

  const t = translations[language]; // Hàm lấy text

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t }}>
      {/* attribute="class" là quan trọng để Tailwind kích hoạt Dark Mode */}
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </NextThemesProvider>
    </LanguageContext.Provider>
  );
};

export const useApp = () => useContext(LanguageContext);