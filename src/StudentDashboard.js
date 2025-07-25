import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";
import { useNavigate } from "react-router-dom";
const StudentDashboard = () => {
  const [user, setUser] = useState(null);
  const [userName, setUserName] = useState("");
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [courseDetails, setCourseDetails] = useState([]);
  const [previewedLectures, setPreviewedLectures] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    const fetchUserAndEnrollments = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUser = sessionData.session?.user;
      setUser(currentUser);

      if (!currentUser) return;

      const { data: userDetails } = await supabase
        .from("users")
        .select("name")
        .eq("id", currentUser.id)
        .single();

      if (userDetails?.name) {
        setUserName(userDetails.name);
      }

      const { data: enrollments, error: enrollmentError } = await supabase
        .from("course_enrollments")
        .select("course_id")
        .eq("student_id", currentUser.id);

      if (enrollmentError || !enrollments || enrollments.length === 0) return;

      const courseIds = enrollments.map((e) => e.course_id);

      const { data: courses } = await supabase
        .from("courses")
        .select("id, title")
        .in("id", courseIds);

      const { data: announcements } = await supabase
        .from("announcements")
        .select("id, content, course_id")
        .in("course_id", courseIds);

      const { data: lectures } = await supabase
        .from("lectures")
        .select("id, course_id, title, video_url")
        .in("course_id", courseIds);

      const { data: accessData } = await supabase
        .from("lecture_access")
        .select("lecture_id, can_view")
        .eq("student_id", currentUser.id);

      const { data: courseTeachers } = await supabase
        .from("course_teachers")
        .select("course_id, teacher_id")
        .in("course_id", courseIds);

      const teacherIds = courseTeachers.map((ct) => ct.teacher_id);

      const { data: teachers } = await supabase
        .from("users")
        .select("id, email, name")
        .in("id", teacherIds);

      const accessibleLectureIds = new Set(
        accessData?.filter((a) => a.can_view).map((a) => a.lecture_id) || []
      );

      const enriched = courses.map((course) => {
        const thisCourseTeachers = courseTeachers.filter(
          (ct) => ct.course_id === course.id
        );
        return {
          ...course,
          teachers: thisCourseTeachers.map(
            (ct) => teachers.find((t) => t.id === ct.teacher_id)
          ),
          announcements: announcements.filter((a) => a.course_id === course.id),
          lectures: lectures.filter(
            (l) =>
              l.course_id === course.id && accessibleLectureIds.has(l.id)
          )
        };
      });

      setEnrolledCourses(courseIds);
      setCourseDetails(enriched);
    };

    fetchUserAndEnrollments();
  }, []);

  const togglePreview = (lectureId) => {
    setPreviewedLectures((prev) =>
      prev.includes(lectureId)
        ? prev.filter((id) => id !== lectureId)
        : [...prev, lectureId]
    );
  };

  const getDriveEmbedUrl = (url) => {
    try {
      const match = url.match(/\/d\/(.*?)\//);
      if (match && match[1]) {
        return `https://drive.google.com/file/d/${match[1]}/preview`;
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login"); 
  };

  const randomColor = () => {
    const colors = ["#fef3c7", "#d1fae5", "#e0f2fe", "#fde68a", "#fcd34d", "#fca5a5"];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const selectedCourse = courseDetails.find(c => c.id === selectedCourseId);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🎓 Student Dashboard</h1>
        <h2 className="welcome-message">Welcome, {userName || user?.email || "Loading..."}</h2>
        <button onClick={handleLogout} className="logout-button">Logout</button>
      </header>

      {courseDetails.length > 0 && (
        <div className="course-selector">
          <label>Select a Course:</label>
          <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)}>
            <option value="">-- Select --</option>
            {courseDetails.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      )}

      {!selectedCourseId ? (
        <p className="no-course-message">Please select a course to view details.</p>
      ) : selectedCourse ? (
        <section key={selectedCourse.id} className="course-card">
          <div className="course-header">
            <h3 className="course-title">📘 {selectedCourse.title}</h3>
            <p className="course-instructors">
              Instructor(s):{" "}
              {selectedCourse.teachers.map(t => t?.email || "Unknown").join(", ")}
            </p>
          </div>

          <div className="course-section">
            <h4>📢 Announcements</h4>
            {selectedCourse.announcements.length > 0 ? (
              <ul className="announcement-list">
                {selectedCourse.announcements.map((a) => (
                  <li
                    key={a.id}
                    className="announcement-item"
                    style={{
                      backgroundColor: randomColor(),
                      padding: "12px",
                      borderRadius: "8px",
                      marginBottom: "8px",
                      fontWeight: "500",
                    }}
                  >
                    {a.content}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-note">No announcements yet.</p>
            )}
          </div>

          <div className="course-section">
            <h4>🎥 Lectures</h4>
            {selectedCourse.lectures.length > 0 ? (
              <ul className="lecture-list">
                {selectedCourse.lectures.map((lec) => {
                  const embedUrl = getDriveEmbedUrl(lec.video_url);
                  return (
                    <li key={lec.id} className="lecture-item">
                      <div className="lecture-title">
                        {lec.title}
                        <button
                          onClick={() => togglePreview(lec.id)}
                          className="preview-btn"
                        >
                          {previewedLectures.includes(lec.id)
                            ? "Hide Preview"
                            : "Preview"}
                        </button>
                      </div>

                      {previewedLectures.includes(lec.id) && embedUrl && (
                        <div className="lecture-preview">
                          <iframe
                            src={embedUrl}
                            width="420"
                            height="240"
                            allow="autoplay"
                            sandbox="allow-scripts allow-same-origin"
                            allowFullScreen
                            title={`lecture-${lec.id}`}
                            className="lecture-iframe"
                          ></iframe>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="empty-note">
                No lectures available or you do not have access.
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default StudentDashboard;
