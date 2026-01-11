import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function updateSession(request) {
  // 1. Tạo response ban đầu
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Khởi tạo Supabase Client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 3. Kiểm tra User hiện tại
  // Dùng getUser() an toàn hơn getSession() trong middleware
  const { data: { user } } = await supabase.auth.getUser()

  // Lấy đường dẫn hiện tại để check cho gọn code
  const path = request.nextUrl.pathname

  // --- 4. LOGIC BẢO VỆ ROUTE (CẬP NHẬT) ---

  // A. Nếu CHƯA đăng nhập mà cố vào các trang nội bộ -> Đá về /login
  // (Đã thêm /community vào danh sách bảo vệ)
  const protectedRoutes = ['/', '/leaderboard', '/profile', '/community']
  
  // Kiểm tra: Nếu path là trang chủ (/) HOẶC path bắt đầu bằng các route con (vd: /profile/123)
  const isProtectedRoute = path === '/' || protectedRoutes.some(route => path.startsWith(route) && route !== '/')

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // B. Nếu ĐÃ đăng nhập mà cố vào các trang Auth (Login/Register/Forgot) -> Đá về trang chủ
  const authRoutes = ['/login']
  
  if (user && authRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}