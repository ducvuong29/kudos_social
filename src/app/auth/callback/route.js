import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') ?? '/'
  const origin = requestUrl.origin
  
  // 1. Kiểm tra xem Supabase có trả về lỗi ngay trên URL không
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  
  if (error) {
     // Nếu link hỏng/hết hạn ngay từ đầu -> Chuyển về trang forgot password kèm thông báo lỗi
     return NextResponse.redirect(`${origin}/forgot-password?error=${error_description}`)
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name) { return cookieStore.get(name)?.value },
          set(name, value, options) { cookieStore.set({ name, value, ...options }) },
          remove(name, options) { cookieStore.set({ name, value: '', ...options }) },
        },
      }
    )
    
    // Trao đổi code lấy session
    const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!sessionError) {
      // Thành công -> Chuyển đến trang đặt lại mật khẩu
      const forwardedUrl = `${origin}${next.startsWith('/') ? next : `/${next}`}`
      return NextResponse.redirect(forwardedUrl)
    }
  }

  // Nếu thất bại ở bước đổi code -> Về trang forgot kèm lỗi
  return NextResponse.redirect(`${origin}/forgot-password?error=Link hết hạn hoặc không hợp lệ`)
}