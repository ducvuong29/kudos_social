"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThumbsUp, Mail, Lock, Eye, EyeOff, User, Github } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link"; // <--- 1. THÊM IMPORT NÀY

// --- LOGIN COMPONENT ---
const LoginPage = ({ isVisible }) => {
  const [showPassword, setShowPassword] = useState(false);
  // State quản lý form
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Vui lòng nhập đầy đủ thông tin!");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert("Đăng nhập thất bại: " + error.message);
    } else {
      router.refresh(); // Làm mới để Middleware chuyển hướng hoặc cập nhật UI
      router.push("/"); // Chuyển về trang chủ
    }
    setLoading(false);
  };

  return (
    <div
      className={`absolute inset-0 transition-all duration-700 ease-in-out transform-gpu ${
        isVisible
          ? "opacity-100 rotate-y-0"
          : "opacity-0 rotate-y-180 pointer-events-none"
      }`}
      style={{
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl h-[700px]">
        {/* Left Side - Form */}
        <div className="bg-white p-12 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-bold mb-2">Welcome Back</h1>
            <p className="text-gray-600 mb-8">
              Please enter your details to sign in.
            </p>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium">Password</label>
                
                {/* --- 2. THAY ĐỔI Ở ĐÂY: Dùng Link thay cho button --- */}
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-blue-600 hover:underline cursor-pointer"
                >
                  Forgot password?
                </Link>
                {/* ---------------------------------------------------- */}

              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  // Bắt sự kiện nhấn Enter
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-400" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center mb-6">
              <Checkbox id="remember" />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-gray-600 cursor-pointer"
              >
                Remember me for 30 days
              </label>
            </div>

            {/* Login Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging In..." : "Log In →"}
            </Button>
          </div>
        </div>

        {/* Right Side - Info */}
        <div className="bg-blue-600 p-12 text-white flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 bg-blue-500 rounded-3xl flex items-center justify-center mb-8">
              <ThumbsUp className="w-12 h-12" />
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Connect with friends &<br />
              give Kudos!
            </h2>
            <p className="text-lg text-blue-100 max-w-md">
              Join our community to share moments, celebrate achievements, and
              stay connected with the people who matter most.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 bg-blue-500 rounded-2xl p-4">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500"></div>
              <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500"></div>
              <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500"></div>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-yellow-300">★★★★★</span>
            </div>
            <span className="text-sm font-medium">
              Trusted by 10k+ creators
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- SIGNUP COMPONENT ---
const SignupPage = ({ isVisible }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSignup = async () => {
    // 1. Validate cơ bản
    if (!email || !username || !password || !confirmPassword) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }
    if (password !== confirmPassword) {
      alert("Mật khẩu xác nhận không khớp!");
      return;
    }
    if (!agreedToTerms) {
      alert("Bạn phải đồng ý với điều khoản sử dụng!");
      return;
    }

    setLoading(true);

    // 2. Gọi API đăng ký Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // QUAN TRỌNG: Gửi metadata để Trigger SQL tự động tạo Profile
        data: {
          full_name: username,
        },
      },
    });

    if (error) {
      alert("Đăng ký thất bại: " + error.message);
    } else {
      alert(
        "Đăng ký thành công! Hãy kiểm tra email để xác nhận tài khoản (nếu bật Confirm Email)."
      );
      // Có thể chuyển về tab login hoặc trang chủ tùy logic
    }
    setLoading(false);
  };

  return (
    <div
      className={`absolute inset-0 transition-all duration-700 ease-in-out transform-gpu ${
        isVisible
          ? "opacity-100 rotate-y-0"
          : "opacity-0 -rotate-y-180 pointer-events-none"
      }`}
      style={{
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="grid md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-2xl h-[700px]">
        {/* Left Side - Info */}
        <div className="bg-blue-600 p-12 text-white flex flex-col justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mb-8">
              <ThumbsUp className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-bold mb-6">Join the community.</h2>
            <p className="text-lg text-blue-100 mb-8">
              Connect, share, and celebrate moments that matter with the people
              who matter most.
            </p>
          </div>

          <div className="bg-blue-500 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500"></div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500"></div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-blue-500"></div>
                <div className="w-10 h-10 rounded-full bg-blue-400 border-2 border-blue-500 flex items-center justify-center text-sm font-bold">
                  +2k
                </div>
              </div>
            </div>
            <p className="text-sm font-medium">
              Join 2,000+ creators sharing kudos today.
            </p>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="bg-white p-12 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <h1 className="text-4xl font-bold mb-2">Create your account</h1>
            <p className="text-gray-600 mb-8">
              Start your 30-day free trial. Cancel anytime.
            </p>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12"
                />
              </div>
            </div>

            {/* Password Inputs */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="8+ chars"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12"
                  />
                </div>
              </div>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start mb-6">
              <Checkbox
                id="terms"
                checked={agreedToTerms}
                onCheckedChange={setAgreedToTerms}
                className="mt-1"
              />
              <label
                htmlFor="terms"
                className="ml-2 text-sm text-gray-600 cursor-pointer"
              >
                I agree to the{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Terms of Service
                </a>{" "}
                and{" "}
                <a href="#" className="text-blue-600 hover:underline">
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {/* Sign Up Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-semibold"
              onClick={handleSignup}
              disabled={loading}
            >
              {loading ? "Creating Account..." : "Get Started →"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- APP COMPONENT (MAIN) ---
export default function App() {
  const [currentPage, setCurrentPage] = useState("login");

  const handlePageSwitch = (newPage) => {
    setCurrentPage(newPage);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <style>{`
        .rotate-y-0 {
          transform: perspective(2000px) rotateY(0deg);
        }
        .rotate-y-180 {
          transform: perspective(2000px) rotateY(180deg);
        }
        .-rotate-y-180 {
          transform: perspective(2000px) rotateY(-180deg);
        }
      `}</style>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <div
                  className="w-6 h-6 bg-white rounded"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                ></div>
              </div>
              <span className="text-xl font-bold">Kudos Social</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-52 h-6">
                <span
                  className={`absolute right-0 text-gray-600 transition-opacity duration-300 whitespace-nowrap ${
                    currentPage === "login" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Don't have an account?
                </span>
                <span
                  className={`absolute right-0 text-gray-600 transition-opacity duration-300 whitespace-nowrap ${
                    currentPage === "signup" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Already have an account?
                </span>
              </div>
              <Button
                onClick={() =>
                  handlePageSwitch(
                    currentPage === "login" ? "signup" : "login"
                  )
                }
                className={`transition-all duration-300 ${
                  currentPage === "login"
                    ? "bg-blue-100 text-blue-600 hover:bg-blue-200"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {currentPage === "login" ? "Sign up" : "Log In"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Flip Animation */}
      <div className="flex items-center justify-center pt-24 pb-4 px-4 min-h-[calc(100vh-200px)]">
        <div
          className="w-full max-w-6xl relative"
          style={{ perspective: "2000px" }}
        >
          <div
            className="relative h-[700px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <LoginPage isVisible={currentPage === "login"} />
            <SignupPage isVisible={currentPage === "signup"} />
          </div>
        </div>
      </div>

      {/* Footer - Below Form */}
      <div className="relative z-40 bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="relative h-16">
            {/* Login Footer */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                currentPage === "login" ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="flex justify-center items-center gap-6 text-sm text-gray-600 mb-3">
                <a href="#" className="hover:text-gray-900">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-gray-900">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-gray-900">
                  Help Center
                </a>
              </div>
              <p className="text-center text-sm text-gray-500">
                © 2024 Kudos Social Inc. All rights reserved.
              </p>
            </div>

            {/* Signup Footer */}
            <div
              className={`absolute inset-0 transition-opacity duration-300 ${
                currentPage === "signup" ? "opacity-100" : "opacity-0"
              }`}
            >
              <p className="text-center text-sm text-gray-500">
                © 2024 Kudos Inc. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}