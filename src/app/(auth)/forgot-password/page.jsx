'use client'

import React, { useState } from 'react';
import { Mail, Eye, EyeOff, ArrowLeft, RotateCcw, CheckCircle } from 'lucide-react';

const ForgotPasswordPages = () => {
  const [currentPage, setCurrentPage] = useState('forgot'); // 'forgot' or 'reset'
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    setPasswordStrength(calculatePasswordStrength(value));
  };

  const getStrengthLabel = () => {
    if (passwordStrength < 40) return { label: 'Weak', color: 'text-red-600' };
    if (passwordStrength < 70) return { label: 'Medium', color: 'text-yellow-600' };
    return { label: 'Strong', color: 'text-blue-600' };
  };

  const strengthInfo = getStrengthLabel();

  // Forgot Password Page
  const ForgotPasswordPage = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">Kudos Social</span>
          </div>
          <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-all cursor-pointer">
            Sign In
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center">
                <RotateCcw className="w-10 h-10 text-blue-600" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-3">
              Forgot Password?
            </h1>
            
            {/* Description */}
            <p className="text-gray-600 text-center mb-8 leading-relaxed">
              No worries! Enter the email address associated with your Kudos account and we'll send you a link to reset your password.
            </p>

            {/* Form */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. name@company.com"
                    className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg hover:shadow-xl">
                Send Reset Link
              </button>

              <button 
                onClick={() => setCurrentPage('forgot')}
                className="w-full flex items-center justify-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-all cursor-pointer py-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Login
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">© 2024 Kudos Social. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
              Help Center
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-blue-600 cursor-pointer transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </footer>
    </div>
  );

  // Set New Password Page
  const SetNewPasswordPage = () => (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
              <div className="w-2 h-8 bg-blue-600 rounded-sm"></div>
            </div>
            <span className="text-xl font-bold text-gray-900">Kudos Social</span>
          </div>
          <a href="#" className="text-blue-600 font-semibold hover:text-blue-700 cursor-pointer transition-colors">
            Help Center
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-3xl shadow-2xl p-8">
            {/* Title */}
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Set New Password
            </h1>
            
            {/* Description */}
            <p className="text-gray-600 mb-8">
              Almost there! Choose a strong password to secure your account.
            </p>

            {/* Form */}
            <div className="space-y-6">
              {/* New Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    placeholder="Enter new password"
                    className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-700">Strength:</span>
                        <span className={`text-sm font-bold ${strengthInfo.color}`}>
                          {strengthInfo.label}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-gray-600">{passwordStrength}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength < 40 ? 'bg-red-500' :
                          passwordStrength < 70 ? 'bg-yellow-500' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 italic mt-2">
                      Must be at least 8 characters with a mix of letters, numbers & symbols.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pr-12 pl-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <button
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold hover:bg-blue-700 transition-all cursor-pointer shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
                Update Password
                <CheckCircle className="w-5 h-5" />
              </button>

              <button 
                onClick={() => setCurrentPage('forgot')}
                className="w-full flex items-center justify-center gap-2 text-blue-600 font-semibold hover:text-blue-700 transition-all cursor-pointer py-2"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to login
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-sm text-gray-500">
            © 2024 Kudos Social. All rights reserved. Your security is our priority.
          </p>
        </div>
      </footer>
    </div>
  );

  return (
    <div>
      {/* Toggle between pages for demo */}
      <div className="fixed top-4 left-4 z-50 bg-white rounded-lg shadow-lg p-4">
        <p className="text-xs font-semibold text-gray-600 mb-2">Demo Navigation:</p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage('forgot')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
              currentPage === 'forgot'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Forgot Password
          </button>
          <button
            onClick={() => setCurrentPage('reset')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
              currentPage === 'reset'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Set New Password
          </button>
        </div>
      </div>

      {/* Render current page */}
      {currentPage === 'forgot' ? <ForgotPasswordPage /> : <SetNewPasswordPage />}
    </div>
  );
};

export default ForgotPasswordPages;