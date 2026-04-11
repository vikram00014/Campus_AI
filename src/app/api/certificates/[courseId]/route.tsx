import { NextRequest, NextResponse } from "next/server";
import { renderToStream } from "@react-pdf/renderer";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";
import { CertificateDocument } from "@/components/certificate-document";
import { createClient } from "@/lib/supabase/server";

function fallbackVerificationId(courseId: string, userId: string): string {
    return `CAI-${courseId.slice(0, 8).toUpperCase()}-${userId.slice(0, 6).toUpperCase()}`;
}

function formatIssueDate(dateValue: string | Date): string {
    const parsed = new Date(dateValue);
    if (Number.isNaN(parsed.getTime())) {
        return new Date().toLocaleDateString("en-GB");
    }
    return parsed.toLocaleDateString("en-GB");
}

function computeGrade(completionPercentage: number, totalHours: number): string {
    if (completionPercentage >= 100 && totalHours >= 15) return "A+";
    if (completionPercentage >= 100) return "A";
    if (completionPercentage >= 90) return "B+";
    if (completionPercentage >= 80) return "B";
    return "C";
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ courseId: string }> }
) {
    try {
        const { courseId } = await params;
        const supabase = await createClient();

        // 1. Authenticate Request
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        // 2. Fetch Course Details
        const { data: course, error } = await supabase
            .from("courses")
            .select("*")
            .eq("id", courseId)
            .eq("user_id", user.id)
            .single();

        if (error || !course) {
            return new NextResponse("Course not found", { status: 404 });
        }

        // 3. Verify Completion Status
        if (course.completion_percentage !== 100) {
            return new NextResponse("Course is not 100% completed yet.", { status: 403 });
        }

        const { data: moduleRows } = await supabase
            .from("modules")
            .select("title, estimated_time, topics(id)")
            .eq("course_id", courseId)
            .order("order_index", { ascending: true }) as {
                data: Array<{
                    title: string;
                    estimated_time: number | null;
                    topics: Array<{ id: string }> | null;
                }> | null;
            };

        const safeModules = moduleRows || [];
        const totalMinutes = safeModules.reduce((sum, module) => sum + (module.estimated_time || 0), 0);
        const totalLearningHours = Math.max(1, Math.round(totalMinutes / 60));
        const topicCount = safeModules.reduce((sum, module) => sum + (module.topics?.length || 0), 0);
        const moduleBasedSkills = safeModules.map((module) => module.title).filter(Boolean).slice(0, 5);
        const skills = moduleBasedSkills.length > 0
            ? moduleBasedSkills
            : ["Analytical Thinking", "Model Building", "Exam Problem Solving", "Revision Planning"];
        const completionPercentage = course.completion_percentage || 0;
        const grade = computeGrade(completionPercentage, totalLearningHours);

        // 4. Resolve certificate metadata
        const studentName = user.user_metadata?.full_name || user.email?.split('@')[0] || "Dedicated Learner";
        let verificationId = fallbackVerificationId(courseId, user.id);
        let issuedAt = course.created_at || new Date().toISOString();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (supabaseUrl && serviceRoleKey) {
            const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
                auth: { persistSession: false, autoRefreshToken: false },
            });

            const { data: existingRows } = await admin
                .from("certificates")
                .select("verification_id, created_at")
                .eq("user_id", user.id)
                .eq("course_id", courseId)
                .order("created_at", { ascending: true })
                .limit(1);

            if (existingRows && existingRows.length > 0) {
                verificationId = existingRows[0].verification_id || verificationId;
                issuedAt = existingRows[0].created_at || issuedAt;
            } else {
                const newVerificationId = `CAI-${randomUUID().split("-")[0].toUpperCase()}`;
                const certificateUrl = `${request.nextUrl.origin}/api/certificates/${courseId}`;
                const { data: insertedRow, error: insertError } = await admin
                    .from("certificates")
                    .insert({
                        user_id: user.id,
                        course_id: courseId,
                        certificate_url: certificateUrl,
                        verification_id: newVerificationId,
                    })
                    .select("verification_id, created_at")
                    .single();

                if (!insertError && insertedRow) {
                    verificationId = insertedRow.verification_id || newVerificationId;
                    issuedAt = insertedRow.created_at || issuedAt;
                } else if (insertError) {
                    console.warn("Certificate record insert failed, using fallback verification ID:", insertError.message);
                }
            }
        }

        // 5. Generate PDF Stream
        const issueDate = formatIssueDate(issuedAt);

        const stream = await renderToStream(
            <CertificateDocument
                studentName={studentName}
                courseName={course.course_name}
                issueDate={issueDate}
                verificationId={verificationId}
                grade={grade}
                completionPercentage={completionPercentage}
                totalLearningHours={totalLearningHours}
                skills={topicCount > 0 ? skills : [...skills, "Self-Learning Discipline"]}
            />
        );

        // Convert the Node stream to a Web ReadableStream
        const webStream = new ReadableStream({
            async start(controller) {
                for await (const chunk of stream) {
                    controller.enqueue(chunk);
                }
                controller.close();
            }
        });

        // 6. Return as PDF Attachment
        return new NextResponse(webStream, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="${course.course_name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_certificate.pdf"`,
            }
        });

    } catch (error) {
        console.error("Certificate generation error:", error);
        return new NextResponse("Failed to generate PDF.", { status: 500 });
    }
}
