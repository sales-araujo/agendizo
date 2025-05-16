import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Verificar se o usuário está autenticado
  const isAuthenticated = !!session

  // Rotas que requerem autenticação
  const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")

  // Rotas de autenticação
  const isAuthRoute = req.nextUrl.pathname === "/login" || req.nextUrl.pathname === "/registro"

  // Se o usuário não estiver autenticado e tentar acessar uma rota protegida
  if (!isAuthenticated && isProtectedRoute) {
    const redirectUrl = new URL("/login", req.url)
    redirectUrl.searchParams.set("redirectTo", req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // Se o usuário estiver autenticado e tentar acessar uma rota de autenticação
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

// Configurar quais rotas devem passar pelo middleware
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/registro"],
}
