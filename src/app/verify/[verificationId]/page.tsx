import Link from "next/link";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";

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
  if (!email || !email.includes("@")) return "Unavailable";
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
  const normalizedVerificationId = decodeURIComponent(verificationId).trim().toUpperCase();

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
      if (course) courseName = (course as CourseRow).course_name;

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
    <main className="flex min-h-[calc(100vh-64px)] items-center justify-center bg-background px-4 py-12">
      <section className="w-full max-w-2xl">
        <div className="surface-card p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                isValid ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
              }`}
            >
              {isValid ? <CheckCircle2 className="h-7 w-7" /> : <ShieldAlert className="h-7 w-7" />}
            </div>
            <div>
              <p className="section-label">{isValid ? "Valid Certificate" : "No Match Found"}</p>
              <h1 className="mt-2 text-3xl font-bold">
                {isValid ? "This CAMPUS AI certificate is valid." : "This verification ID was not found."}
              </h1>
              <p className="mt-3 font-mono text-sm text-muted-foreground">{normalizedVerificationId}</p>
            </div>
          </div>

          {isValid ? (
            <div className="mt-8 grid gap-3">
              <ResultRow label="Student" value={studentName} />
              <ResultRow label="Student email" value={studentEmail} />
              <ResultRow label="Course" value={courseName} />
              <ResultRow
                label="Issue date"
                value={new Date(certificate?.created_at || new Date().toISOString()).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <ResultRow label="Verification ID" value={normalizedVerificationId} mono />
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-border bg-muted p-5 text-sm leading-6 text-muted-foreground">
              A wrong or mistyped ID is not an application error. Check the certificate and try again.
            </div>
          )}

          <Button asChild variant="outline" className="mt-8">
            <Link href="/verify">
              <ArrowLeft className="h-4 w-4" />
              Back to verification
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}

function ResultRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="grid gap-1 rounded-xl border border-border bg-muted p-4 sm:grid-cols-[150px_1fr] sm:gap-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={mono ? "font-mono text-sm font-semibold" : "text-sm font-semibold"}>{value}</p>
    </div>
  );
}

