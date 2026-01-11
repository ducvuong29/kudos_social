import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  // Lấy params từ URL
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  
  // Lấy param 'next' để biết chuyển hướng đi đâu sau khi login xong
  // Mặc định là về trang chủ '/' nếu không có 'next'
  const next = searchParams.get('next') ?? '/'

  if (code) {
    // Tạo client phía server để thao tác với Cookie
    const supabase = createClient()
    
    // Đổi 'code' lấy 'session'
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Nếu thành công, chuyển hướng người dùng đến trang đích (vd: /profile)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Nếu có lỗi hoặc không có code, trả về trang lỗi
  return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}