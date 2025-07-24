import React, { useState, useEffect } from "react";
import { addCourse } from "./courseApi";
import { supabase } from "./supabaseClient";

export default function AddCourseForm() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [teachers, setTeachers] = useState([]);

  useEffect(() => {
    const fetchTeachers = async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, name")
        .eq("role", "teacher");
      if (data) setTeachers(data);
    };
    fetchTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addCourse({ title, description, teacher_id: teacherId });
      alert("Course added successfully!");
      setTitle("");
      setDescription("");
      setTeacherId("");
    } catch (error) {
      alert("Failed to add course: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Add Course</h2>
      <input
        type="text"
        placeholder="Course Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Course Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <select
        value={teacherId}
        onChange={(e) => setTeacherId(e.target.value)}
        required
      >
        <option value="">Assign Teacher</option>
        {teachers.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
      <button type="submit">Add Course</button>
    </form>
  );
}
