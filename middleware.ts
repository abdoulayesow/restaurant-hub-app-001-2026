export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/inventory/:path*',
    '/production/:path*',
    '/sales/:path*',
    '/expenses/:path*',
    '/bank/:path*',
    '/admin/:path*',
    '/settings/:path*',
    '/editor/:path*',
    '/profile/:path*',
  ],
}
