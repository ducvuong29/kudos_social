"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const supabase = createClient();
  const [user, setUser] = useState(null); // User này sẽ chứa cả Auth + Profile
  const [isLoading, setIsLoading] = useState(true);

  // Hàm core để lấy dữ liệu
  const fetchUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        // Lấy thêm thông tin Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        // --- QUAN TRỌNG: GỘP DATA ---
        // Gộp thông tin Auth (email, id) và Profile (avatar, name) thành 1 object
        setUser({
            ...authUser,       // Có id, email
            ...profileData     // Có full_name, avatar_url, job_title
        });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Lỗi tải user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // 1. Gọi lần đầu
    fetchUserData();

    // 2. --- QUAN TRỌNG: LẮNG NGHE SỰ KIỆN AUTH ---
    // Giúp đồng bộ state ngay khi Supabase nhận diện được session trong cookie/storage
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
           fetchUserData(); // Tải lại data nếu vừa đăng nhập xong
        } else if (event === 'SIGNED_OUT') {
           setUser(null);
           setIsLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ 
        user,           // Biến user này giờ đã đầy đủ thông tin
        isLoading, 
        refreshProfile: fetchUserData // Hàm để các trang khác gọi cập nhật (vd: sau khi edit profile)
    }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  return useContext(UserContext);
};