import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { form, answers } = body;

    if (!form || !answers || !["parent", "student"].includes(form)) {
      return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
    }

    // Extract student name for easy pairing
    let studentName: string | null = null;
    if (form === "parent" && answers.a_name) {
      studentName = answers.a_name;
    } else if (form === "student") {
      const first = answers.a_first || "";
      const last = answers.a_last || "";
      studentName = [first, last].filter(Boolean).join(" ") || null;
    }

    const { error } = await supabase.from("submissions").insert({
      form,
      student_name: studentName,
      submitted_at: new Date().toISOString(),
      answers,
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to save" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
