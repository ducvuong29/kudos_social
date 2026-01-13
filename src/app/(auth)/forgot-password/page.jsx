"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  Mail,
  Eye,
  EyeOff,
  ArrowLeft,
  RotateCcw,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

// --- 1. VIEW GỬI LINK (Responsive Updated) ---
const ForgotPasswordView = ({
  email,
  setEmail,
  loading,
  message,
  handleSendResetLink,
}) => (
  <div className="w-full max-w-md px-4">
    {" "}
    {/* Thêm px-4 để tránh sát lề mobile */}
    <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-6 md:p-8 border border-gray-100">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 md:w-20 md:h-20 bg-blue-50 rounded-full flex items-center justify-center">
          <RotateCcw className="w-8 h-8 md:w-10 md:h-10 text-blue-600" />
        </div>
      </div>

      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-2 md:mb-3">
        Forgot Password?
      </h1>
      <p className="text-sm md:text-base text-gray-500 text-center mb-6 md:mb-8 leading-relaxed">
        No worries! Enter your email and we'll send you a link to reset your
        password.
      </p>

      {message.content && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2 ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-100"
              : "bg-red-50 text-red-700 border border-red-100"
          }`}
        >
          {message.content}
        </div>
      )}

      <div className="space-y-4 md:space-y-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@company.com"
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 text-sm md:text-base bg-gray-50/50 focus:bg-white"
              disabled={loading}
            />
          </div>
        </div>

        <button
          onClick={handleSendResetLink}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 md:py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-200 hover:shadow-xl flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5" />
          ) : (
            "Send Reset Link"
          )}
        </button>

        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 text-gray-500 font-medium hover:text-gray-800 transition-all cursor-pointer py-2 text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  </div>
);

// --- 2. VIEW ĐẶT LẠI MẬT KHẨU (Responsive Updated) ---
const SetNewPasswordView = ({
  newPassword,
  setNewPassword,
  confirmPassword,
  setConfirmPassword,
  loading,
  message,
  handleUpdatePassword,
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/[a-z]/)) strength += 25;
    if (password.match(/[A-Z]/)) strength += 25;
    if (password.match(/[0-9]/)) strength += 15;
    if (password.match(/[^a-zA-Z0-9]/)) strength += 10;
    return Math.min(strength, 100);
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 40)
      return { label: "Weak", color: "text-red-600", bar: "bg-red-500" };
    if (passwordStrength < 70)
      return {
        label: "Medium",
        color: "text-yellow-600",
        bar: "bg-yellow-500",
      };
    return { label: "Strong", color: "text-blue-600", bar: "bg-blue-600" };
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const strengthInfo = getStrengthLabel();

  return (
    <div className="w-full max-w-md px-4">
      <div className="bg-white rounded-2xl md:rounded-3xl shadow-xl md:shadow-2xl p-6 md:p-8 border border-gray-100">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 md:mb-3">
          Set New Password
        </h1>
        <p className="text-sm md:text-base text-gray-500 mb-6 md:mb-8">
          Almost there! Choose a strong password to secure your account.
        </p>

        {message.content && (
          <div
            className={`mb-6 p-4 rounded-xl text-sm font-medium text-center animate-in fade-in slide-in-from-top-2 ${
              message.type === "success"
                ? "bg-green-50 text-green-700 border border-green-100"
                : "bg-red-50 text-red-700 border border-red-100"
            }`}
          >
            {message.content}
          </div>
        )}

        <div className="space-y-4 md:space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => handlePasswordChange(e.target.value)}
                placeholder="Enter new password"
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 text-sm md:text-base bg-gray-50/50 focus:bg-white"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1"
                type="button"
              >
                {showNewPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>

            {newPassword && (
              <div className="mt-3 animate-in fade-in slide-in-from-top-1">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-gray-500">
                      Strength:
                    </span>
                    <span className={`text-xs font-bold ${strengthInfo.color}`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-gray-400">
                    {passwordStrength}%
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${strengthInfo.bar}`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5 md:mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                className="w-full pr-12 pl-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-gray-900 text-sm md:text-base bg-gray-50/50 focus:bg-white"
              />
              <button
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors p-1"
                type="button"
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 md:py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg shadow-blue-200 hover:shadow-xl flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed text-sm md:text-base"
          >
            {loading ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <>
                Update Password <CheckCircle className="w-5 h-5" />
              </>
            )}
          </button>

          <Link
            href="/login"
            className="w-full flex items-center justify-center gap-2 text-gray-500 font-medium hover:text-gray-800 transition-all cursor-pointer py-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

// --- 3. MAIN COMPONENT (Responsive Wrapper) ---
const ForgotPasswordContent = () => {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialView = searchParams.get("view") === "reset" ? "reset" : "forgot";
  const [currentView, setCurrentView] = useState(initialView);

  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", content: "" });

  useEffect(() => {
    if (searchParams.get("view") === "reset") {
      setCurrentView("reset");
    }
  }, [searchParams]);

  // ... (Logic handleSendResetLink & handleUpdatePassword giữ nguyên như đã sửa trước đó)
  const handleSendResetLink = async () => {
    if (!email)
      return setMessage({ type: "error", content: "Vui lòng nhập email." });
    setLoading(true);
    setMessage({ type: "", content: "" });

    try {
      const origin = window.location.origin;
      const targetPath = encodeURIComponent("/forgot-password?view=reset");
      const redirectUrl = `${origin}/auth/callback?next=${targetPath}`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });
      if (error) throw error;
      setMessage({
        type: "success",
        content: "Link khôi phục đã được gửi! Vui lòng kiểm tra email của bạn.",
      });
    } catch (error) {
      setMessage({ type: "error", content: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!newPassword || !confirmPassword)
      return setMessage({
        type: "error",
        content: "Vui lòng nhập đầy đủ thông tin.",
      });
    if (newPassword !== confirmPassword)
      return setMessage({
        type: "error",
        content: "Mật khẩu xác nhận không khớp.",
      });

    setLoading(true);
    setMessage({ type: "", content: "" });

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      alert("Đổi mật khẩu thành công! Bạn sẽ được chuyển về trang đăng nhập.");
      router.push("/login");
    } catch (error) {
      setMessage({
        type: "error",
        content: "Lỗi đổi mật khẩu: " + error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 py-4 px-4 md:px-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex gap-1 transition-transform group-hover:scale-105">
              <div className="w-1.5 md:w-2 h-6 md:h-8 bg-blue-600 rounded-full"></div>
              <div className="w-1.5 md:w-2 h-6 md:h-8 bg-blue-500 rounded-full opacity-80"></div>
              <div className="w-1.5 md:w-2 h-6 md:h-8 bg-blue-400 rounded-full opacity-60"></div>
            </div>
            <span className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">
              Kudos Social
            </span>
          </Link>
          <Link
            href="/login"
            className="bg-blue-50 text-blue-600 px-4 md:px-6 py-2 rounded-lg font-semibold hover:bg-blue-100 transition-all cursor-pointer text-sm md:text-base border border-blue-100"
          >
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4 bg-gray-50/50">
        {currentView === "forgot" ? (
          <ForgotPasswordView
            email={email}
            setEmail={setEmail}
            loading={loading}
            message={message}
            handleSendResetLink={handleSendResetLink}
          />
        ) : (
          <SetNewPasswordView
            newPassword={newPassword}
            setNewPassword={setNewPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            loading={loading}
            message={message}
            handleUpdatePassword={handleUpdatePassword}
          />
        )}
      </main>

      <footer className="bg-white border-t border-gray-200 py-6 px-6 mt-auto">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-xs md:text-sm text-gray-500 font-medium">
            © 2026 Kudos Social Inc. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

const ForgotPasswordPages = () => {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
        </div>
      }
    >
      <ForgotPasswordContent />
    </Suspense>
  );
};

export default ForgotPasswordPages;
