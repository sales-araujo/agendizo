import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { Database } from "@/lib/supabase/database.types"

export async function POST() {
  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })

  await supabase.auth.signOut()

  return NextResponse.redirect(new URL("/", process.env.NEXT_PUBLIC_APP_URL!))
}
