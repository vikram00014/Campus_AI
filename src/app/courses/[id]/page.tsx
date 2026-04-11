import { fetchCourseData } from "@/app/actions/player";
import { redirect } from "next/navigation";
import CoursePlayerClient from "./player-client";

export default async function CoursePlayerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const courseData = await fetchCourseData(id);

    if (!courseData) {
        redirect("/dashboard");
    }

    // Unpack Server Component data and pass to interactive Client Component
    return <CoursePlayerClient courseData={courseData} />;
}
