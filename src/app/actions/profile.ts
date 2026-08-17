"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function updateProfile(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
        redirect("/auth");
    }

    const fullName = String(formData.get("fullName") || "").trim();
    const college = String(formData.get("college") || "").trim();
    const learningGoal = String(formData.get("learningGoal") || "").trim();
    const bio = String(formData.get("bio") || "").trim();
    const linkedinUrl = String(formData.get("linkedinUrl") || "").trim();
    const focusArea = String(formData.get("focusArea") || "").trim();

    if (!fullName) {
        redirect("/profile?error=full_name_required");
    }

    const { error } = await supabase.auth.updateUser({
        data: {
            full_name: fullName,
            college,
            learning_goal: learningGoal,
            bio,
            linkedin_url: linkedinUrl,
            focus_area: focusArea,
        },
    });

    if (error) {
        console.error("Profile update failed:", error.message);
        redirect("/profile?error=update_failed");
    }

    revalidatePath("/profile");
    revalidatePath("/dashboard");
    redirect("/profile?updated=1");
}
