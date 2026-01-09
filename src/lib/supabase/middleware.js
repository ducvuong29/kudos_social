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
          // Logic này giúp đồng bộ cookie giữa Next.js và Supabase
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
  const { data: { user } } = await supabase.auth.getUser()

  // 4. Logic bảo vệ Route (Redirect)
  
  // Nếu chưa đăng nhập mà cố vào trang chủ (/) -> Đá về /login
  if (!user && (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/leaderboard' || request.nextUrl.pathname === '/profile')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Nếu đã đăng nhập mà cố vào /login -> Đá về trang chủ (/)
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return response
}