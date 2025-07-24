import { supabase } from "./supabaseClient";

export async function addCourse(course) {
  const { data, error } = await supabase
    .from("courses")
    .insert([
      {
        title: course.title,
        description: course.description,
        teacher_id: course.teacher_id,
      },
    ]);

  if (error) throw error;
  return data;
}
