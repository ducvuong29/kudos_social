import { updateSession } from '@/lib/supabase/middleware'

// BẮT BUỘC: Phải export function tên là "middleware"
export async function middleware(request) {
  return await updateSession(request)
}

// Cấu hình matcher để middleware không chạy trên các file tĩnh
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
