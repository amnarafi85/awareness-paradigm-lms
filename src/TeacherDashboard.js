import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
// import "./teacher.css";

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [lectureAccessMap, setLectureAccessMap] = useState({});
  const [previewedLectures, setPreviewedLectures] = useState([]);
  const [announcement, setAnnouncement] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [enrollMessage, setEnrollMessage] = useState("");
  const [editState, setEditState] = useState({});

  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;
      if (!currentUser) return;

      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", currentUser.id)
        .single();

      setUser(userProfile);

      const { data: courseJoinData, error } = await supabase
        .from("course_teachers")
        .select("course:course_id(*)")
        .eq("teacher_id", currentUser.id);

      if (error) console.error("Error fetching teacher courses:", error);
      const coursesData = courseJoinData.map((item) => item.course);
      setCourses(coursesData || []);

      const { data: studentsData } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "student");

      setStudents(studentsData || []);
    };

    fetchUserAndData();
  }, []);

  useEffect(() => {
    const fetchCourseDetails = async () => {
      if (!selectedCourseId) return;

      const { data: enrolled } = await supabase
        .from("course_enrollments")
        .select("student_id, users:student_id(id, name, email)")
        .eq("course_id", selectedCourseId);

      setEnrolledStudents(enrolled.map((e) => e.users) || []);

      const { data: announcementsData } = await supabase
        .from("announcements")
        .select("*")
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: false });

      setAnnouncements(announcementsData || []);

      const { data: lecturesData } = await supabase
        .from("lectures")
        .select("*")
        .eq("course_id", selectedCourseId)
        .order("created_at", { ascending: false });

      setLectures(lecturesData || []);

      const { data: accessData } = await supabase
        .from("lecture_access")
        .select("lecture_id, student_id, can_view");

      const accessMap = {};
      accessData?.forEach(({ lecture_id, student_id, can_view }) => {
        if (!accessMap[lecture_id]) accessMap[lecture_id] = {};
        accessMap[lecture_id][student_id] = can_view;
      });
      setLectureAccessMap(accessMap);
    };

    fetchCourseDetails();
  }, [selectedCourseId]);

  const handlePostAnnouncement = async () => {
    if (!selectedCourseId || !announcement.trim()) return;

    await supabase.from("announcements").insert({
      course_id: selectedCourseId,
      content: announcement.trim(),
    });

    setAnnouncement("");
    const { data } = await supabase
      .from("announcements")
      .select("*")
      .eq("course_id", selectedCourseId)
      .order("created_at", { ascending: false });

    setAnnouncements(data || []);
  };

  const handleDeleteAnnouncement = async (id) => {
    await supabase.from("announcements").delete().eq("id", id);
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const handleLectureUpload = async () => {
    if (!selectedCourseId || !videoTitle || !videoLink) return;

    const previewUrl = videoLink.includes("/view")
      ? videoLink.replace("/view", "/preview")
      : videoLink;

    const { data: lecture } = await supabase
      .from("lectures")
      .insert({
        course_id: selectedCourseId,
        title: videoTitle,
        video_url: previewUrl,
      })
      .select()
      .single();

    if (lecture) {
      const accessInserts = enrolledStudents.map((s) => ({
        lecture_id: lecture.id,
        student_id: s.id,
        can_view: true,
      }));
      await supabase.from("lecture_access").insert(accessInserts);
    }

    setVideoTitle("");
    setVideoLink("");

    const { data } = await supabase
      .from("lectures")
      .select("*")
      .eq("course_id", selectedCourseId)
      .order("created_at", { ascending: false });

    setLectures(data || []);
  };

  const handleDeleteLecture = async (id) => {
    await supabase.from("lectures").delete().eq("id", id);
    await supabase.from("lecture_access").delete().eq("lecture_id", id);
    setLectures((prev) => prev.filter((l) => l.id !== id));
  };

  const handleAccessToggle = async (lectureId, studentId, canView) => {
    const { data: existing } = await supabase
      .from("lecture_access")
      .select("id")
      .eq("lecture_id", lectureId)
      .eq("student_id", studentId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("lecture_access")
        .update({ can_view: canView })
        .eq("id", existing.id);
    } else {
      await supabase.from("lecture_access").insert({
        lecture_id: lectureId,
        student_id: studentId,
        can_view: canView,
      });
    }

    setLectureAccessMap((prev) => ({
      ...prev,
      [lectureId]: {
        ...(prev[lectureId] || {}),
        [studentId]: canView,
      },
    }));
  };

  const togglePreview = (id) => {
    setPreviewedLectures((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleEnrollStudent = async () => {
    if (!selectedCourseId || !selectedStudentId) return;

    const { data: exists } = await supabase
      .from("course_enrollments")
      .select("*")
      .eq("course_id", selectedCourseId)
      .eq("student_id", selectedStudentId);

    if (exists.length > 0) {
      setEnrollMessage("Already enrolled.");
      return;
    }

    await supabase.from("course_enrollments").insert({
      course_id: selectedCourseId,
      student_id: selectedStudentId,
    });

    const student = students.find((s) => s.id === selectedStudentId);
    setEnrolledStudents((prev) => [...prev, student]);
    setEnrollMessage(`Enrolled ${student?.name || ""}`);
  };

  const handleRemoveStudent = async (studentId) => {
    await supabase
      .from("course_enrollments")
      .delete()
      .eq("student_id", studentId)
      .eq("course_id", selectedCourseId);

    setEnrolledStudents((prev) => prev.filter((s) => s.id !== studentId));
  };

  const handleEditLecture = (id, field, value) => {
    setEditState((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSaveLecture = async (id) => {
    const changes = editState[id];
    if (!changes) return;

    await supabase
      .from("lectures")
      .update({ title: changes.title, video_url: changes.video_url })
      .eq("id", id);

    setEditState((prev) => {
      const newState = { ...prev };
      delete newState[id];
      return newState;
    });

    const { data } = await supabase
      .from("lectures")
      .select("*")
      .eq("course_id", selectedCourseId)
      .order("created_at", { ascending: false });

    setLectures(data || []);
  };

  return (
    <div className="dashboard-container">
      <h1 className="dashboard-title">Welcome, {user?.name}</h1>

      <section className="dashboard-section">
        <label>Select Course</label>
        <select
          value={selectedCourseId || ""}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="dashboard-select"
        >
          <option value="">-- Select Course --</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.title}
            </option>
          ))}
        </select>
      </section>

      {selectedCourseId && (
        <>
          {/* Upload Lecture */}
          <section className="dashboard-section">
            <h2>Upload Lecture</h2>
            <input
              type="text"
              placeholder="Title"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />
            <input
              type="text"
              placeholder="Video Link"
              value={videoLink}
              onChange={(e) => setVideoLink(e.target.value)}
            />
            <button onClick={handleLectureUpload}>Upload</button>
          </section>

          {/* Announcements */}
          <section className="dashboard-section">
            <h2>Announcements</h2>
            <textarea
              value={announcement}
              onChange={(e) => setAnnouncement(e.target.value)}
              placeholder="Write an announcement..."
            />
            <button onClick={handlePostAnnouncement}>Post</button>
            <ul>
              {announcements.map((a) => (
                <li key={a.id}>
                  {a.content}
                  <button onClick={() => handleDeleteAnnouncement(a.id)}>Delete</button>
                </li>
              ))}
            </ul>
          </section>

          {/* Enrolled Students */}
          <section className="dashboard-section">
            <h2>Manage Students</h2>
            <ul>
              {enrolledStudents.map((s) => (
                <li key={s.id}>
                  {s.name} ({s.email})
                  <button onClick={() => handleRemoveStudent(s.id)}>Remove</button>
                </li>
              ))}
            </ul>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">-- Select Student --</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.email})
                </option>
              ))}
            </select>
            <button onClick={handleEnrollStudent}>Enroll</button>
            {enrollMessage && <p>{enrollMessage}</p>}
          </section>

          {/* Lectures */}
          <section className="dashboard-section">
            <h2>Lectures</h2>
            {lectures.map((lec) => (
              <div key={lec.id} className="lecture-card">
                <input
                  value={editState[lec.id]?.title ?? lec.title}
                  onChange={(e) => handleEditLecture(lec.id, "title", e.target.value)}
                />
                <input
                  value={editState[lec.id]?.video_url ?? lec.video_url}
                  onChange={(e) => handleEditLecture(lec.id, "video_url", e.target.value)}
                />
                <button onClick={() => handleSaveLecture(lec.id)}>Save</button>
                <button onClick={() => togglePreview(lec.id)}>
                  {previewedLectures.includes(lec.id) ? "Hide" : "Preview"}
                </button>
                <button onClick={() => handleDeleteLecture(lec.id)}>Delete</button>

                {previewedLectures.includes(lec.id) && (
                  <iframe src={lec.video_url} width="100%" height="400" allowFullScreen></iframe>
                )}

                <div>
                  <h4>Access Control</h4>
                  {enrolledStudents.map((s) => (
                    <label key={s.id}>
                      <input
                        type="checkbox"
                        checked={lectureAccessMap[lec.id]?.[s.id] ?? false}
                        onChange={(e) =>
                          handleAccessToggle(lec.id, s.id, e.target.checked)
                        }
                      />
                      {s.name} ({s.email})
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
};

export default TeacherDashboard;
