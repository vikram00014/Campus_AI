import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ShieldAlert, ArrowLeft } from "lucide-react";

interface VerificationRow {
    verification_id: string;
    created_at: string;
    course_id: string;
    user_id: string;
}

interface CourseRow {
    id: string;
    course_name: string;
}

interface AuthUser {
    email?: string;
    user_metadata?: {
        full_name?: string;
    };
}

function maskEmail(email?: string): string {
    if (!email || !email.includes("@")) {
        return "Unavailable";
    }
    const [name, domain] = email.split("@");
    const masked = name.length <= 2 ? `${name[0] || "*"}*` : `${name[0]}***${name[name.length - 1]}`;
    return `${masked}@${domain}`;
}

export default async function VerifyCertificateResultPage({
    params,
}: {
    params: Promise<{ verificationId: string }>;
}) {
    const { verificationId } = await params;
    const normalizedVerificationId = decodeURIComponent(verificationId).trim();

    let certificate: VerificationRow | null = null;
    let courseName = "Unavailable";
    let studentName = "Verified Learner";
    let studentEmail = "Unavailable";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (supabaseUrl && serviceRoleKey) {
        const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false },
        });

        const { data: certRow } = await admin
            .from("certificates")
            .select("verification_id, created_at, course_id, user_id")
            .eq("verification_id", normalizedVerificationId)
            .maybeSingle();

        certificate = (certRow as VerificationRow | null) || null;

        if (certificate) {
            const { data: course } = await admin
                .from("courses")
                .select("id, course_name")
                .eq("id", certificate.course_id)
                .maybeSingle();
            if (course) {
                courseName = (course as CourseRow).course_name;
            }

            const { data: userData } = await admin.auth.admin.getUserById(certificate.user_id);
            const authUser = userData?.user as AuthUser | undefined;
            studentName = authUser?.user_metadata?.full_name || studentName;
            studentEmail = maskEmail(authUser?.email);
        }
    } else {
        const publicClient = await createClient();
        const { data: certRow } = await publicClient
            .from("certificates")
            .select("verification_id, created_at, course_id, user_id")
            .eq("verification_id", normalizedVerificationId)
            .maybeSingle();
        certificate = (certRow as VerificationRow | null) || null;
    }

    const isValid = Boolean(certificate);

    return (
        <div className="min-h-[calc(100vh-64px)] bg-[#0b1120]">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <Card className={`glass ${isValid ? "border-emerald-400/20" : "border-red-400/20"}`}>
                <CardHeader>
                    <CardTitle className="text-3xl flex items-center gap-2 text-white">
                        {isValid ? (
                            <>
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                                Certificate Verified
                            </>
                        ) : (
                            <>
                                <ShieldAlert className="w-8 h-8 text-red-500" />
                                Certificate Not Found
                            </>
                        )}
                    </CardTitle>
                    <CardDescription className="text-[#8ea1ab]">
                        Verification ID: <span className="font-mono">{normalizedVerificationId}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isValid ? (
                        <>
                            <Badge variant="default" className="bg-emerald-400/10 text-emerald-300 border-emerald-400/20">
                                Authentic CAMPUS AI Credential
                            </Badge>
                            <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4 space-y-2 text-[#e2edf2]">
                                <p><span className="text-[#8ea1ab]">Student:</span> {studentName}</p>
                                <p><span className="text-[#8ea1ab]">Student Email:</span> {studentEmail}</p>
                                <p><span className="text-[#8ea1ab]">Course:</span> {courseName}</p>
                                <p>
                                    <span className="text-[#8ea1ab]">Issued On:</span>{" "}
                                    {new Date(certificate?.created_at || new Date().toISOString()).toLocaleDateString("en-GB")}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-red-300">
                            No certificate matched this verification ID. Check the ID and try again.
                        </div>
                    )}

                    <Link href="/verify">
                        <Button variant="outline" className="gap-2 border-white/8 bg-white/[0.03] text-[#d5e5ee] hover:bg-white/5 hover:text-white">
                            <ArrowLeft className="w-4 h-4" /> Back to Verify
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
        </div>
    );
}
