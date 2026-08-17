"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export type AuthResult = {
    success?: boolean;
    error?: string;
    needsConfirmation?: boolean;
    message?: string;
};

export async function login(formData: FormData): Promise<AuthResult> {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
        return { error: "Please enter both email and password." };
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: error.message };
    }

    return { success: true };
}

export async function signup(formData: FormData): Promise<AuthResult> {
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim() || email.split("@")[0] || "Student";

    if (!email || !password) {
        return { error: "Please enter both email and password." };
    }

    if (password.length < 6) {
        return { error: "Password must be at least 6 characters." };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: name,
            },
        },
    });

    if (error) {
        return { error: error.message };
    }

    if (data.user && !data.session) {
        return {
            success: true,
            needsConfirmation: true,
            message: "Account created! Please check your email to confirm your account, then sign in.",
        };
    }

    return { success: true, needsConfirmation: false };
}

export async function logout() {
    try {
        const supabase = await createClient();
        await supabase.auth.signOut();
    } catch (err) {
        console.warn("Logout error:", err);
    }
    revalidatePath("/", "layout");
    redirect("/auth");
}

