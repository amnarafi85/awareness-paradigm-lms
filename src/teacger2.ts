import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const TeacherDashboard = () => {
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [studentsByCourse, setStudentsByCourse] = useState({});
  const [announcement, setAnnouncement] = useState("");
  const [selectedCourseId, setSelectedCourseId] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [announcementsByCourse, setAnnouncementsByCourse] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const { data: teacher } = await supabase
        .from("users")
        .select("id")
        .eq("email", user.email)
        .single();

      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("teacher_id", teacher.id);

      setCourses(coursesData);

      const students = {};
      const announcements = {};

      for (const course of coursesData) {
        const { data: enrollments } = await supabase
          .from("course_enrollments")
          .select("student_id, students:student_id(name, email)")
          .eq("course_id", course.id);
        students[course.id] = enrollments || [];

        const { data: courseAnnouncements } = await supabase
          .from("announcements")
          .select("*")
          .eq("course_id", course.id)
          .order("created_at", { ascending: false });

        announcements[course.id] = courseAnnouncements || [];
      }

      setStudentsByCourse(students);
      setAnnouncementsByCourse(announcements);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleAnnouncement = async () => {
    if (!selectedCourseId || !announcement.trim()) return;

    const { error } = await supabase.from("announcements").insert({
      course_id: selectedCourseId,
      content: announcement,
    });

    if (!error) {
      alert("Announcement posted.");
      setAnnouncement("");
    }
  };

  const handleLectureUpload = async () => {
    if (!selectedCourseId || !videoFile || !videoTitle.trim()) return;

    const fileExt = videoFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `${selectedCourseId}/${fileName}`;

    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("course-materials")
        .createSignedUploadUrl(filePath);

    if (signedUrlError) {
      alert("Failed to create signed URL");
      console.error(signedUrlError);
      return;
    }

    const { signedUrl } = signedUrlData;

    // Manual upload with progress tracking
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", signedUrl, true);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const percentComplete = Math.round((e.loaded / e.total) * 100);
        setUploadProgress(percentComplete);
      }
    };

    xhr.onload = async () => {
      if (xhr.status === 200) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("course-materials").getPublicUrl(filePath);

        await supabase.from("lectures").insert({
          course_id: selectedCourseId,
          video_url: publicUrl,
          title: videoTitle,
        });

        alert("Lecture uploaded successfully!");
        setUploadProgress(0);
        setVideoFile(null);
        setVideoTitle("");
      } else {
        alert("Upload failed.");
        console.error(xhr.responseText);
      }
    };

    xhr.onerror = () => {
      alert("Upload error occurred.");
    };

    xhr.send(videoFile);
  };

  if (loading) {
    return (
      <>
        <style jsx>{`
          .loading-container {
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
            overflow: hidden;
            font-family: 'Inter', 'Segoe UI', sans-serif;
          }

          .loading-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.4) 0%, transparent 50%),
                        radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.4) 0%, transparent 50%);
            animation: backgroundFloat 15s ease-in-out infinite;
          }

          @keyframes backgroundFloat {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            33% { transform: translateY(-15px) rotate(2deg); }
            66% { transform: translateY(10px) rotate(-2deg); }
          }

          .loading-content {
            position: relative;
            z-index: 1;
            text-align: center;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 30px;
            padding: 4rem 3rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
          }

          .loading-spinner {
            position: relative;
            margin: 0 auto 2rem;
          }

          .spinner {
            width: 80px;
            height: 80px;
            border: 6px solid rgba(255, 255, 255, 0.2);
            border-top: 6px solid #fbbf24;
            border-right: 6px solid #f59e0b;
            border-radius: 50%;
            animation: spin 1.2s linear infinite;
          }

          .spinner-inner {
            position: absolute;
            top: 15px;
            left: 15px;
            width: 50px;
            height: 50px;
            border: 4px solid rgba(255, 255, 255, 0.3);
            border-bottom: 4px solid #10b981;
            border-radius: 50%;
            animation: spin 0.8s linear infinite reverse;
          }

          .loading-text {
            color: white;
            font-size: 1.8rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            animation: pulse 2s ease-in-out infinite;
          }

          .loading-subtitle {
            color: rgba(255, 255, 255, 0.8);
            font-size: 1.1rem;
            font-weight: 400;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          @keyframes pulse {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.8; transform: scale(1.05); }
          }
        `}</style>
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-spinner">
              <div className="spinner">
                <div className="spinner-inner"></div>
              </div>
            </div>
            <div className="loading-text">Loading Dashboard</div>
            <div className="loading-subtitle">Preparing your teaching tools...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .teacher-dashboard-wrapper {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          background-attachment: fixed;
          padding: 2rem;
          font-family: 'Inter', 'Segoe UI', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        .teacher-dashboard-wrapper::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                      radial-gradient(circle at 40% 80%, rgba(120, 219, 255, 0.3) 0%, transparent 50%);
          pointer-events: none;
          z-index: 0;
          animation: backgroundFloat 20s ease-in-out infinite;
        }

        .floating-particles {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 0;
        }

        .particle {
          position: absolute;
          width: 6px;
          height: 6px;
          background: rgba(255, 255, 255, 0.6);
          border-radius: 50%;
          animation: float 20s infinite linear;
        }

        .particle:nth-child(1) { left: 10%; animation-delay: 0s; }
        .particle:nth-child(2) { left: 20%; animation-delay: 3s; }
        .particle:nth-child(3) { left: 30%; animation-delay: 6s; }
        .particle:nth-child(4) { left: 40%; animation-delay: 9s; }
        .particle:nth-child(5) { left: 50%; animation-delay: 12s; }
        .particle:nth-child(6) { left: 60%; animation-delay: 15s; }
        .particle:nth-child(7) { left: 70%; animation-delay: 18s; }
        .particle:nth-child(8) { left: 80%; animation-delay: 21s; }
        .particle:nth-child(9) { left: 90%; animation-delay: 24s; }

        @keyframes backgroundFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(5px) rotate(-1deg); }
        }

        @keyframes float {
          0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
        }

        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }

        .welcome-header {
          text-align: center;
          margin-bottom: 3rem;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(25px);
          border-radius: 25px;
          padding: 3rem 2rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.2);
          position: relative;
          overflow: hidden;
          animation: slideInDown 0.8s ease-out;
        }

        .welcome-header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
          animation: shimmer 4s infinite;
        }

        @keyframes slideInDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .teacher-avatar {
          width: 120px;
          height: 120px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 3rem;
          font-weight: bold;
          color: white;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          animation: avatarPulse 3s ease-in-out infinite;
          margin: 0 auto 2rem;
          position: relative;
          overflow: hidden;
        }

        .teacher-avatar::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.3), transparent);
          animation: avatarShimmer 3s infinite;
        }

        @keyframes avatarPulse {
          0%, 100% { transform: scale(1); box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3); }
          50% { transform: scale(1.05); box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4); }
        }

        @keyframes avatarShimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .welcome-title {
          font-size: 3.5rem;
          font-weight: 800;
          margin: 0 0 1rem;
          background: linear-gradient(45deg, #fff, #e0e7ff, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          animation: textGlow 3s ease-in-out infinite alternate;
          position: relative;
        }

        @keyframes textGlow {
          from { filter: drop-shadow(0 0 10px rgba(255, 255, 255, 0.5)); }
          to { filter: drop-shadow(0 0 20px rgba(255, 255, 255, 0.8)); }
        }

        .welcome-subtitle {
          font-size: 1.5rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          font-weight: 600;
          animation: fadeInUp 1s ease-out 0.5s both;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .courses-section {
          margin-bottom: 4rem;
          animation: fadeInUp 1s ease-out 0.3s both;
        }

        .section-title {
          font-size: 2.5rem;
          font-weight: 800;
          color: white;
          margin-bottom: 2rem;
          text-align: center;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .section-title::after {
          content: '';
          position: absolute;
          bottom: -10px;
          left: 50%;
          transform: translateX(-50%);
          width: 100px;
          height: 4px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 2px;
        }

        .courses-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(450px, 1fr));
          gap: 2.5rem;
        }

        .course-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(25px);
          border-radius: 25px;
          padding: 2.5rem;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
          transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          border: 1px solid rgba(255, 255, 255, 0.25);
          position: relative;
          overflow: hidden;
          animation: fadeInUp 0.8s ease-out forwards;
          opacity: 0;
          transform: translateY(50px);
        }

        .course-card:nth-child(1) { animation-delay: 0.1s; }
        .course-card:nth-child(2) { animation-delay: 0.2s; }
        .course-card:nth-child(3) { animation-delay: 0.3s; }
        .course-card:nth-child(4) { animation-delay: 0.4s; }

        .course-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
          transition: left 0.6s;
        }

        .course-card:hover::before {
          left: 100%;
        }

        .course-card:hover {
          transform: translateY(-15px) scale(1.02);
          box-shadow: 0 30px 60px rgba(0, 0, 0, 0.3);
          border-color: rgba(255, 255, 255, 0.4);
        }

        .course-header {
          margin-bottom: 2rem;
          position: relative;
        }

        .course-title {
          font-size: 2rem;
          font-weight: 800;
          color: white;
          margin: 0 0 1rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
        }

        .course-card:hover .course-title {
          color: #fbbf24;
          transform: translateX(5px);
        }

        .course-description {
          font-size: 1.1rem;
          color: rgba(255, 255, 255, 0.9);
          margin: 0;
          line-height: 1.7;
          transition: color 0.3s ease;
        }

        .course-card:hover .course-description {
          color: rgba(255, 255, 255, 1);
        }

        .course-divider {
          height: 3px;
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          border-radius: 2px;
          margin: 2rem 0;
          opacity: 0.7;
          transition: all 0.3s ease;
        }

        .course-card:hover .course-divider {
          opacity: 1;
          transform: scaleX(1.1);
        }

        .subsection-title {
          font-size: 1.3rem;
          font-weight: 700;
          color: #fbbf24;
          margin: 0 0 1.5rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .students-section {
          margin-bottom: 2rem;
        }

        .students-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 300px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .students-list::-webkit-scrollbar {
          width: 6px;
        }

        .students-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .students-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .student-item {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1rem 1.25rem;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 15px;
          border-left: 4px solid #10b981;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .student-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.1), transparent);
          transition: left 0.5s;
        }

        .student-item:hover::before {
          left: 100%;
        }

        .student-item:hover {
          transform: translateX(10px) scale(1.02);
          background: rgba(255, 255, 255, 0.12);
          border-left-color: #059669;
          box-shadow: 0 8px 25px rgba(16, 185, 129, 0.2);
        }

        .student-avatar {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: linear-gradient(135deg, #10b981, #059669);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          font-size: 1.2rem;
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
          transition: transform 0.3s ease;
        }

        .student-item:hover .student-avatar {
          transform: scale(1.1) rotate(5deg);
        }

        .student-info {
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .student-name {
          font-weight: 700;
          color: white;
          font-size: 1.1rem;
          margin-bottom: 0.25rem;
        }

        .student-email {
          font-size: 0.9rem;
          color: rgba(255, 255, 255, 0.7);
        }

        .announcements-section {
          margin-bottom: 1.5rem;
        }

        .announcements-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 10px;
        }

        .announcements-list::-webkit-scrollbar {
          width: 6px;
        }

        .announcements-list::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }

        .announcements-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }

        .announcement-item {
          padding: 1rem 1.25rem;
          background: rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          border-left: 4px solid #f59e0b;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          position: relative;
          overflow: hidden;
        }

        .announcement-item::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(245, 158, 11, 0.1), transparent);
          transition: left 0.5s;
        }

        .announcement-item:hover::before {
          left: 100%;
        }

        .announcement-item:hover {
          transform: translateX(10px) scale(1.02);
          background: rgba(245, 158, 11, 0.2);
          border-left-color: #d97706;
          box-shadow: 0 8px 25px rgba(245, 158, 11, 0.2);
        }

        .announcement-date {
          font-size: 0.85rem;
          font-weight: 700;
          color: #d97706;
          margin-bottom: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .announcement-content {
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.95);
          line-height: 1.6;
          margin: 0;
        }

        .empty-state {
          color: rgba(255, 255, 255, 0.6);
          font-style: italic;
          text-align: center;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 15px;
          border: 2px dashed rgba(255, 255, 255, 0.2);
          margin: 0;
          transition: all 0.3s ease;
        }

        .empty-state:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .action-section {
          margin-bottom: 3rem;
          animation: fadeInUp 1s ease-out 0.5s both;
        }

        .action-card {
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(25px);
          border-radius: 25px;
          padding: 3rem;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.25);
          max-width: 800px;
          margin: 0 auto;
          position: relative;
          overflow: hidden;
          transition: all 0.3s ease;
        }

        .action-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.05), transparent);
          animation: cardShimmer 6s infinite;
        }

        @keyframes cardShimmer {
          0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
          100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
        }

        .action-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 35px 70px rgba(0, 0, 0, 0.3);
        }

        .action-title {
          font-size: 2rem;
          font-weight: 800;
          margin: 0 0 2rem;
          background: linear-gradient(45deg, #fff, #fbbf24);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          text-align: center;
          text-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          position: relative;
        }

        .form-group {
          margin-bottom: 1.5rem;
          position: relative;
        }

        .form-label {
          display: block;
          font-size: 1rem;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.9);
          margin-bottom: 0.75rem;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .form-input, .form-select, .form-textarea {
          width: 100%;
          box-sizing: border-box;
          padding: 1rem 1.25rem;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          font-size: 1rem;
          color: white;
          font-family: inherit;
          font-weight: 500;
        }

        .form-input::placeholder, .form-textarea::placeholder {
          color: rgba(255, 255, 255, 0.6);
        }

        .form-input:focus, .form-select:focus, .form-textarea:focus {
          border-color: #fbbf24;
          background: rgba(255, 255, 255, 0.15);
          outline: none;
          box-shadow: 0 0 0 4px rgba(251, 191, 36, 0.2);
          transform: translateY(-2px);
        }

        .form-textarea {
          resize: vertical;
          min-height: 120px;
          line-height: 1.6;
        }

        .file-upload-wrapper {
          position: relative;
        }

        .file-input {
          position: absolute;
          opacity: 0;
          width: 100%;
          height: 100%;
          cursor: pointer;
        }

        .file-upload-label {
          display: block;
          padding: 1.5rem;
          border: 2px dashed rgba(255, 255, 255, 0.3);
          border-radius: 15px;
          background: rgba(255, 255, 255, 0.05);
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          color: rgba(255, 255, 255, 0.8);
          font-weight: 600;
          position: relative;
          overflow: hidden;
        }

        .file-upload-label::before {
          content: '📁';
          display: block;
          font-size: 2rem;
          margin-bottom: 0.5rem;
          animation: bounce 2s infinite;
        }

        .file-upload-label:hover {
          border-color: #fbbf24;
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(251, 191, 36, 0.2);
        }

        .progress-section {
          margin: 1.5rem 0;
          padding: 1rem;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .progress-bar {
          width: 100%;
          height: 12px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 6px;
          overflow: hidden;
          margin-bottom: 0.75rem;
          position: relative;
        }

        .progress-bar::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(45deg, transparent 25%, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.1) 50%, transparent 50%, transparent 75%, rgba(255,255,255,0.1) 75%);
          background-size: 20px 20px;
          animation: progressStripes 1s linear infinite;
        }

        @keyframes progressStripes {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(135deg, #10b981, #059669);
          border-radius: 6px;
          transition: width 0.3s ease;
          position: relative;
          overflow: hidden;
        }

        .progress-fill::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
          animation: progressShine 2s infinite;
        }

        @keyframes progressShine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }

        .progress-text {
          font-size: 1rem;
          color: #10b981;
          font-weight: 700;
          text-align: center;
          display: block;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
        }

        .action-button {
          width: 100%;
          padding: 1.25rem 2rem;
          font-weight: 700;
          font-size: 1.1rem;
          border: none;
          border-radius: 15px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          position: relative;
          overflow: hidden;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .action-button::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: all 0.5s ease;
        }

        .action-button:hover::before {
          left: 100%;
        }

        .announcement-btn {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
        }

        .announcement-btn:hover {
          background: linear-gradient(135deg, #2563eb, #1e40af);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 40px rgba(59, 130, 246, 0.5);
        }

        .upload-btn {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 10px 30px rgba(16, 185, 129, 0.4);
        }

        .upload-btn:hover {
          background: linear-gradient(135deg, #059669, #047857);
          transform: translateY(-3px) scale(1.02);
          box-shadow: 0 15px 40px rgba(16, 185, 129, 0.5);
        }

        .action-button:disabled {
          background: rgba(255, 255, 255, 0.2);
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
          opacity: 0.6;
        }

        .action-button:disabled::before {
          display: none;
        }

        /* Enhanced Responsive Design */
        @media (max-width: 1200px) {
          .courses-grid {
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
          }
        }

        @media (max-width: 768px) {
          .teacher-dashboard-wrapper {
            padding: 1rem;
          }

          .welcome-header {
            padding: 2rem 1.5rem;
          }

          .welcome-title {
            font-size: 2.5rem;
          }

          .teacher-avatar {
            width: 100px;
            height: 100px;
            font-size: 2.5rem;
          }

          .courses-grid {
            grid-template-columns: 1fr;
            gap: 2rem;
          }

          .course-card, .action-card {
            padding: 2rem;
          }

          .section-title {
            font-size: 2rem;
          }

          .course-title {
            font-size: 1.5rem;
          }

          .action-title {
            font-size: 1.5rem;
          }
        }

        @media (max-width: 480px) {
          .welcome-header, .course-card, .action-card {
            padding: 1.5rem;
          }

          .welcome-title {
            font-size: 2rem;
          }

          .teacher-avatar {
            width: 80px;
            height: 80px;
            font-size: 2rem;
          }

          .course-title {
            font-size: 1.3rem;
          }

          .student-item {
            padding: 0.75rem 1rem;
          }

          .student-avatar {
            width: 40px;
            height: 40px;
            font-size: 1rem;
          }

          .form-input, .form-select, .form-textarea {
            padding: 0.75rem 1rem;
          }
        }
      `}</style>

      <div className="teacher-dashboard-wrapper">
        <div className="floating-particles">
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
          <div className="particle"></div>
        </div>

        <div className="dashboard-container">
          <div className="welcome-header">
            <div className="teacher-avatar">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <h1 className="welcome-title">Welcome, {user?.email}</h1>
            <p className="welcome-subtitle">🎓 Teacher Dashboard</p>
          </div>

          <div className="courses-section">
            <h2 className="section-title">📚 Your Courses</h2>
            
            <div className="courses-grid">
              {courses.map((course, index) => (
                <div key={course.id} className="course-card" style={{ animationDelay: `${index * 0.1}s` }}>
                  <div className="course-header">
                    <h3 className="course-title">{course.title}</h3>
                    <p className="course-description">{course.description}</p>
                  </div>

                  <div className="course-divider"></div>

                  <div className="students-section">
                    <h4 className="subsection-title">
                      👥 Enrolled Students ({studentsByCourse[course.id]?.length || 0})
                    </h4>
                    <div className="students-list">
                      {studentsByCourse[course.id]?.length > 0 ? (
                        studentsByCourse[course.id].map((s) => (
                          <div key={s.student_id} className="student-item">
                            <div className="student-avatar">
                              {s.students.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="student-info">
                              <span className="student-name">{s.students.name}</span>
                              <span className="student-email">{s.students.email}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-state">No students enrolled yet</p>
                      )}
                    </div>
                  </div>

                  <div className="announcements-section">
                    <h4 className="subsection-title">📢 Recent Announcements</h4>
                    <div className="announcements-list">
                      {announcementsByCourse[course.id]?.length > 0 ? (
                        announcementsByCourse[course.id].slice(0, 3).map((a) => (
                          <div key={a.id} className="announcement-item">
                            <div className="announcement-date">
                              🕒 {new Date(a.created_at).toLocaleDateString()}
                            </div>
                            <div className="announcement-content">{a.content}</div>
                          </div>
                        ))
                      ) : (
                        <p className="empty-state">No announcements posted yet</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Announcement Posting */}
          <div className="action-section">
            <div className="action-card">
              <h2 className="action-title">📢 Make an Announcement</h2>
              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select
                  className="form-select"
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  value={selectedCourseId || ""}
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Announcement</label>
                <textarea
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  placeholder="Type your announcement here..."
                  className="form-textarea"
                  rows="4"
                />
              </div>
              <button
                onClick={handleAnnouncement}
                className="action-button announcement-btn"
                disabled={!selectedCourseId || !announcement.trim()}
              >
                📢 Post Announcement
              </button>
            </div>
          </div>

          {/* Lecture Upload */}
          <div className="action-section">
            <div className="action-card">
              <h2 className="action-title">🎥 Upload Recorded Lecture</h2>
              <div className="form-group">
                <label className="form-label">Lecture Title</label>
                <input
                  type="text"
                  placeholder="Enter lecture title..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Video File</label>
                <div className="file-upload-wrapper">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    className="file-input"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload" className="file-upload-label">
                    {videoFile ? `📹 ${videoFile.name}` : "Choose video file..."}
                  </label>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Select Course</label>
                <select
                  className="form-select"
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  value={selectedCourseId || ""}
                >
                  <option value="">Choose a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>
              {uploadProgress > 0 && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">🚀 {uploadProgress}% uploaded</span>
                </div>
              )}
              <button
                onClick={handleLectureUpload}
                className="action-button upload-btn"
                disabled={!selectedCourseId || !videoFile || !videoTitle.trim()}
              >
                🎥 Upload Lecture
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default TeacherDashboard;
