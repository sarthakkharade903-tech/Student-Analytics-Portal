import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users away from protected routes
  if (!user && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Parent Authentication
  const parentToken = request.cookies.get('parent_token')?.value
  let isParentAuth = false
  if (parentToken) {
    try {
      const secret = new TextEncoder().encode(
        process.env.JWT_SECRET || 'super-secret-parent-token-key-change-me-in-prod'
      )
      await jwtVerify(parentToken, secret)
      isParentAuth = true
    } catch (err) {
      // Invalid token
    }
  }

  if (!isParentAuth && pathname.startsWith('/parent') && pathname !== '/parent/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/parent/login'
    return NextResponse.redirect(url)
  }

  if (isParentAuth && pathname === '/parent/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/parent'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
