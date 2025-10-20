import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check if user is authenticated before attempting logout
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Only sign out if user is actually authenticated
      await supabase.auth.signOut();
      console.log("User logged out due to tab/window close");
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ success: false, error: "Logout failed" }, { status: 500 });
  }
}