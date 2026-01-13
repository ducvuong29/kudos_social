"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { ThumbsUp, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// --- LOGIN COMPONENT ---
const LoginPage = ({ isVisible }) => {
  const [showPassword, setShowPassword] = useState(false);
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
      router.refresh();
      router.push("/");
    }
    setLoading(false);
  };

  return (
    <div
      className={`w-full transition-all duration-700 ease-in-out transform-gpu
      /* MOBILE: Dùng relative để chiếm diện tích thật, ẩn/hiện bằng display:none */
      ${isVisible ? "relative block" : "hidden"} 
      
      /* DESKTOP: Dùng absolute để lật 3D */
      md:absolute md:inset-0 md:flex
      ${
        isVisible
          ? "md:opacity-100 md:rotate-y-0 md:z-10"
          : "md:opacity-0 md:rotate-y-180 md:z-0 md:pointer-events-none"
      }
      `}
      style={{
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
      }}
    >
      {/* Card Wrapper: Mobile chiều cao auto, Desktop chiều cao 700px */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl bg-white h-auto md:h-[700px] w-full border border-gray-100">
        {/* Left Side - Form */}
        <div className="bg-white p-6 sm:p-10 md:p-12 flex items-center justify-center">
          <div className="w-full max-w-md">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Welcome Back
            </h1>
            <p className="text-gray-500 mb-6 md:mb-8 font-medium text-sm md:text-base">
              Please enter your details to sign in.
            </p>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-xs md:text-sm">
                <span className="px-4 bg-white text-gray-500">
                  OR CONTINUE WITH
                </span>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:underline cursor-pointer font-semibold"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="pl-10 pr-10 h-12 border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
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
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold shadow-lg shadow-blue-600/30 transition-all rounded-xl"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging In..." : "Log In →"}
            </Button>
          </div>
        </div>

        {/* Right Side - Info (ẨN TRÊN MOBILE) */}
        <div className="hidden md:flex bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex-col justify-between">
          <div className="flex-1 flex flex-col justify-center items-center text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center mb-8 border border-white/30">
              <ThumbsUp className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-4 drop-shadow-md">
              Connect with friends &<br />
              give Kudos!
            </h2>
            <p className="text-lg text-blue-100 max-w-md">
              Join our community to share moments, celebrate achievements, and
              stay connected with the people who matter most.
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex -space-x-2">
              <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500"></div>
              <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500"></div>
              <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500"></div>
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
// --- SIGNUP COMPONENT ---
const SignupPage = ({ isVisible }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // 1. State đánh giá mật khẩu
  const [passwordStrength, setPasswordStrength] = useState(0);

  // 2. Hàm tính điểm
  const calculatePasswordStrength = (pwd) => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.match(/[a-z]/)) strength += 25;
    if (pwd.match(/[A-Z]/)) strength += 25;
    if (pwd.match(/[0-9]/)) strength += 15;
    if (pwd.match(/[^a-zA-Z0-9]/)) strength += 10;
    return Math.min(strength, 100);
  };

  // 3. Hàm lấy màu sắc và nhãn
  const getStrengthLabel = () => {
    if (passwordStrength < 40)
      return { label: "Weak", color: "text-red-600", barColor: "bg-red-500" };
    if (passwordStrength < 70)
      return {
        label: "Medium",
        color: "text-yellow-600",
        barColor: "bg-yellow-500",
      };
    return { label: "Strong", color: "text-blue-600", barColor: "bg-blue-600" };
  };

  // 4. Hàm xử lý khi nhập password (QUAN TRỌNG)
  const handlePasswordChange = (e) => {
    const val = e.target.value;
    setPassword(val);
    setPasswordStrength(calculatePasswordStrength(val));
  };

  const strengthInfo = getStrengthLabel();

  const handleSignup = async () => {
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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
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
    }
    setLoading(false);
  };

  return (
    <div
      className={`w-full transition-all duration-700 ease-in-out transform-gpu
      ${isVisible ? "relative block" : "hidden"} 
      md:absolute md:inset-0 md:flex
      ${
        isVisible
          ? "md:opacity-100 md:rotate-y-0"
          : "md:opacity-0 md:-rotate-y-180 md:pointer-events-none"
      }
      `}
      style={{
        backfaceVisibility: "hidden",
        transformStyle: "preserve-3d",
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 rounded-3xl overflow-hidden shadow-xl bg-white h-auto md:h-[700px] w-full border border-gray-100">
        {/* Left Side - Info (HIDDEN ON MOBILE) */}
        <div className="hidden md:flex bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white flex-col justify-between">
          <div className="flex-1 flex flex-col justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-8 border border-white/30">
              <ThumbsUp className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold mb-6 drop-shadow-md">
              Join the community.
            </h2>
            <p className="text-lg text-blue-100 mb-8">
              Connect, share, and celebrate moments that matter with the people
              who matter most.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500"></div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500"></div>
                <div className="w-10 h-10 rounded-full bg-white border-2 border-indigo-500"></div>
                <div className="w-10 h-10 rounded-full bg-indigo-400 border-2 border-indigo-500 flex items-center justify-center text-sm font-bold">
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
        <div className="bg-white p-6 sm:p-10 md:p-12 flex items-center justify-center overflow-y-auto">
          <div className="w-full max-w-md">
            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
              Create your account
            </h1>
            <p className="text-gray-500 mb-6 md:mb-8 font-medium text-sm md:text-base">
              Start your 30-day free trial. Cancel anytime.
            </p>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-12 border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* Username Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2 text-gray-700">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="yourname"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="8+ chars"
                    value={password}
                    // --- SỬA Ở ĐÂY: Dùng hàm handlePasswordChange ---
                    onChange={handlePasswordChange}
                    className="pl-10 h-12 border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="password"
                    placeholder="Confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 h-12 border-gray-300 text-gray-900 focus-visible:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* --- THÊM PHẦN HIỂN THỊ ĐỘ MẠNH MẬT KHẨU --- */}
            {password && (
              <div className="mb-6 animate-in fade-in slide-in-from-top-1">
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
                {/* Thanh Bar */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ease-out ${strengthInfo.barColor}`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
              </div>
            )}
            {/* ------------------------------------------- */}

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
                className="ml-2 text-sm text-gray-600 cursor-pointer leading-tight"
              >
                I agree to the{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {/* Sign Up Button */}
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-lg font-bold shadow-lg shadow-blue-600/30 transition-all rounded-xl"
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
    // QUAN TRỌNG: flex flex-col và min-h-screen giúp footer luôn ở đáy
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans flex flex-col">
      <style>{`
        /* Chỉ áp dụng hiệu ứng 3D perspective trên màn hình lớn */
        @media (min-width: 768px) {
          .rotate-y-0 { transform: perspective(2000px) rotateY(0deg); }
          .rotate-y-180 { transform: perspective(2000px) rotateY(180deg); }
          .-rotate-y-180 { transform: perspective(2000px) rotateY(-180deg); }
        }
      `}</style>

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gray-50/90 backdrop-blur-sm py-4 md:py-6 border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <div
                  className="w-5 h-5 md:w-6 md:h-6 bg-white rounded"
                  style={{
                    clipPath:
                      "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)",
                  }}
                ></div>
              </div>
              <span className="text-xl md:text-2xl font-extrabold bg-gradient-to-r from-blue-700 to-indigo-600 bg-clip-text text-transparent">
                Kudos Social
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="relative w-52 h-6 hidden lg:block">
                <span
                  className={`absolute right-0 text-gray-600 font-medium transition-opacity duration-300 whitespace-nowrap ${
                    currentPage === "login" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Don't have an account?
                </span>
                <span
                  className={`absolute right-0 text-gray-600 font-medium transition-opacity duration-300 whitespace-nowrap ${
                    currentPage === "signup" ? "opacity-100" : "opacity-0"
                  }`}
                >
                  Already have an account?
                </span>
              </div>
              <Button
                onClick={() =>
                  handlePageSwitch(currentPage === "login" ? "signup" : "login")
                }
                className={`transition-all duration-300 font-semibold px-4 md:px-6 py-2 h-9 md:h-10 text-sm md:text-base rounded-xl ${
                  currentPage === "login"
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-200"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-600/30"
                }`}
              >
                {currentPage === "login" ? "Sign up" : "Log In"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {/* flex-1 để nội dung chiếm hết khoảng trống, đẩy footer xuống */}
      <div className="flex-1 flex items-center justify-center pt-24 pb-8 px-4 w-full">
        <div
          className="w-full max-w-6xl relative"
          style={{ perspective: "2000px" }}
        >
          {/* Wrapper Height: Auto trên mobile (để form đẩy footer xuống), 700px trên Desktop (để quay 3D) */}
          <div
            className="relative h-auto md:h-[700px]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <LoginPage isVisible={currentPage === "login"} />
            <SignupPage isVisible={currentPage === "signup"} />
          </div>
        </div>
      </div>

      {/* Footer */}
      {/* mt-auto quan trọng để footer luôn ở đáy nếu nội dung ngắn */}
      <div className="relative z-40 bg-gray-50 py-6 border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-center text-xs md:text-sm text-gray-500 font-medium">
              © 2026 Kudos Social Inc. All rights reserved.
            </p>
            <div className="flex justify-center items-center gap-4 md:gap-6 text-xs md:text-sm text-gray-600 font-medium">
              <a href="#" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </a>
              <a href="#" className="hover:text-blue-600 transition-colors">
                Help Center
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
