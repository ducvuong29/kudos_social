"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hàm fetch dữ liệu (có thể gọi lại khi cần reload)
  const fetchUserData = async () => {
    setIsLoading(true);
    try {
      // 1. Get Auth User
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser) {
        setUser(authUser);
        // 2. Get Profile Data
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        setProfile(profileData);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (error) {
      console.error('Lỗi tải user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  return (
    <UserContext.Provider value={{ user, profile, isLoading, refreshProfile: fetchUserData }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook custom để dùng nhanh ở các file khác
export const useUser = () => {
  return useContext(UserContext);
};