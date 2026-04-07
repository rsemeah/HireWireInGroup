import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile, error } = await supabase
    .from("user_profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ...profile,
    email: user.email,
  })
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()

  const { data: existing } = await supabase
    .from("user_profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (existing) {
    const { error } = await supabase
      .from("user_profile")
      .update({
        full_name: body.full_name,
        headline: body.headline,
        location: body.location,
        summary: body.summary,
        years_experience: body.years_experience,
        skills: body.skills,
        linkedin_url: body.linkedin_url,
        portfolio_url: body.portfolio_url,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    const { error } = await supabase
      .from("user_profile")
      .insert({
        user_id: user.id,
        full_name: body.full_name,
        headline: body.headline,
        location: body.location,
        summary: body.summary,
        years_experience: body.years_experience,
        skills: body.skills,
        linkedin_url: body.linkedin_url,
        portfolio_url: body.portfolio_url,
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
