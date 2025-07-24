import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://htcvvwvvlixmatxqpvyj.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y3Z2d3Z2bGl4bWF0eHFwdnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzMDc1MSwiZXhwIjoyMDY4NDA2NzUxfQ.YjJQn4yjvAzzWy3ibYvUJXjP1yPCFgEeNWTI5OFE6oo'
);

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [courseTitle, setCourseTitle] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    fetchUsers();
    fetchTeachers();
    fetchStudents();
    fetchCourses();
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    if (data) setUsers(data);
  };

  const fetchTeachers = async () => {
    const { data } = await supabase.from('users').select('id, name, email,is_block,plaintext_password').eq('role', 'teacher');
    if (data) setTeachers(data);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from('users').select('id, name, email,is_block,plaintext_password').eq('role', 'student');
    if (data) setStudents(data);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select('id, title, description, teacher_id, users(name, email)')
      .order('title');
    if (data) setCourses(data);
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Are you sure?')) return;
    await supabase.from('users').delete().eq('id', id);
    fetchUsers();
  };

  const deleteCourse = async (id) => {
    if (!window.confirm('Delete this course?')) return;
    await supabase.from('courses').delete().eq('id', id);
    fetchCourses();
  };

  const handleUserCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rows = event.target.result.split('\n').filter(Boolean);
      const usersData = rows.slice(1).map(row => {
        const [name, email, role] = row.split(',').map(x => x.trim());
        return { name, email, role };
      });
      const { error } = await supabase.from('users').insert(usersData);
      if (error) alert(error.message);
      else fetchUsers();
    };
    reader.readAsText(file);
  };

  const handleCourseCSV = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const rows = event.target.result.split('\n').filter(Boolean);
      const courseRows = rows.slice(1).map(row => row.split(',').map(x => x.trim()));
      const teacherMap = Object.fromEntries(teachers.map(t => [t.email, t.id]));
      const courseData = courseRows.map(([title, description, teacherEmail]) => ({
        title,
        description,
        teacher_id: teacherMap[teacherEmail]
      })).filter(c => c.teacher_id);
      const { error } = await supabase.from('courses').insert(courseData);
      if (error) alert(error.message);
      else fetchCourses();
    };
    reader.readAsText(file);
  };

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseTitle || !selectedTeacherId) return alert('Required fields missing');
    await supabase.from('courses').insert([{ title: courseTitle, description: courseDescription, teacher_id: selectedTeacherId }]);
    setCourseTitle('');
    setCourseDescription('');
    setSelectedTeacherId('');
    fetchCourses();
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedCourseId) return alert('Select both student and course');
    const { error } = await supabase.from('course_enrollments').insert({
      student_id: selectedStudentId,
      course_id: selectedCourseId
    });
    if (error) alert(error.message);
    else alert('Student enrolled successfully');
    setSelectedStudentId('');
    setSelectedCourseId('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '24px',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '30px',
        boxShadow: '0 25px 50px rgba(0, 0, 0, 0.1)',
        animation: 'slideDown 0.8s ease-out'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px',
            animation: 'pulse 2s infinite'
          }}>
            <span style={{ fontSize: '24px', color: 'white' }}>⚡</span>
          </div>
          <div>
            <h1 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              margin: 0
            }}>
              Admin Dashboard
            </h1>
            <p style={{ color: '#666', margin: 0, fontSize: '16px' }}>
              Manage your Awareness Paradigm platform
            </p>
          </div>
        </div>
      </div>

      {/* Management Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {/* User Management */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeInUp 0.8s ease-out 0.2s both'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '28px', color: 'white' }}>👥</span>
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '15px'
          }}>
            User Management
          </h2>
          <button
            onClick={() => navigate('/admin/create-user')}
            style={{
              width: '100%',
              padding: '15px 20px',
              background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(79, 172, 254, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(79, 172, 254, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(79, 172, 254, 0.3)';
            }}
          >
            Create New User
          </button>
        </div>

        {/* User CSV Upload */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeInUp 0.8s ease-out 0.4s both'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #a8edea, #fed6e3)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '28px', color: '#333' }}>📊</span>
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '15px'
          }}>
            Upload Users (CSV)
          </h2>
          <input 
            type="file" 
            accept=".csv" 
            onChange={handleUserCSV}
            style={{
              width: '100%',
              padding: '15px',
              border: '2px dashed #ddd',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.8)',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#4facfe';
              e.target.style.background = 'rgba(79, 172, 254, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#ddd';
              e.target.style.background = 'rgba(255, 255, 255, 0.8)';
            }}
          />
        </div>

        {/* Add Course */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '30px',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          animation: 'fadeInUp 0.8s ease-out 0.6s both'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            background: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
            borderRadius: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '20px'
          }}>
            <span style={{ fontSize: '28px', color: '#333' }}>📚</span>
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '20px'
          }}>
            Add Course
          </h2>
          <form onSubmit={handleCourseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Course Title"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
              }}
            />
            <textarea
              placeholder="Description"
              value={courseDescription}
              onChange={(e) => setCourseDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box',
                minHeight: '80px',
                resize: 'vertical'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
              }}
            />
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '15px',
                border: '2px solid #e1e5e9',
                borderRadius: '12px',
                fontSize: '16px',
                outline: 'none',
                transition: 'all 0.3s ease',
                background: 'rgba(255, 255, 255, 0.8)',
                boxSizing: 'border-box'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#e1e5e9';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="">Select Teacher</option>
              {teachers.map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                background: 'linear-gradient(135deg, #11998e, #38ef7d)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(17, 153, 142, 0.3)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(17, 153, 142, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(17, 153, 142, 0.3)';
              }}
            >
              Add Course
            </button>
          </form>
        </div>
      </div>

      {/* Course CSV Upload */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '40px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeInUp 0.8s ease-out 0.8s both'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #ff9a9e, #fecfef)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px'
          }}>
            <span style={{ fontSize: '24px', color: '#333' }}>📋</span>
          </div>
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#333',
              margin: 0
            }}>
              Upload Courses (CSV)
            </h2>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
              Format: title, description, teacher_email
            </p>
          </div>
        </div>
        <input 
          type="file" 
          accept=".csv" 
          onChange={handleCourseCSV}
          style={{
            width: '100%',
            padding: '20px',
            border: '2px dashed #ddd',
            borderRadius: '15px',
            background: 'rgba(255, 255, 255, 0.8)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            fontSize: '16px'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#ff9a9e';
            e.target.style.background = 'rgba(255, 154, 158, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#ddd';
            e.target.style.background = 'rgba(255, 255, 255, 0.8)';
          }}
        />
      </div>

      {/* Enroll Student Section */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '40px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeInUp 0.8s ease-out 1s both'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px'
          }}>
            <span style={{ fontSize: '24px', color: 'white' }}>🎓</span>
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            Enroll Student in Course
          </h2>
        </div>
        <form onSubmit={handleEnrollStudent} style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          alignItems: 'end'
        }}>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            required
            style={{
              padding: '15px',
              border: '2px solid #e1e5e9',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s ease',
              background: 'rgba(255, 255, 255, 0.8)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">Select Student</option>
            {students.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
            ))}
          </select>

          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            required
            style={{
              padding: '15px',
              border: '2px solid #e1e5e9',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s ease',
              background: 'rgba(255, 255, 255, 0.8)'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e1e5e9';
              e.target.style.boxShadow = 'none';
            }}
          >
            <option value="">Select Course</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>

          <button
            type="submit"
            style={{
              padding: '15px 30px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-3px)';
              e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.3)';
            }}
          >
            Enroll Student
          </button>
        </form>
      </div>

      {/* Users List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        marginBottom: '40px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeInUp 0.8s ease-out 1.2s both'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #4facfe, #00f2fe)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px'
          }}>
            <span style={{ fontSize: '24px', color: 'white' }}>👥</span>
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            All Users
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)' }}>
                <th style={{
                  padding: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Name</th>
                <th style={{
                  padding: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Email</th>
                <th style={{
                  padding: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Role</th>
                <th style={{
                  padding: '20px',
                  color: 'white',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, index) => (
                <tr key={u.id} style={{
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}>
                  <td style={{ padding: '20px', fontSize: '16px', color: '#333' }}>{u.name}</td>
                  <td style={{ padding: '20px', fontSize: '16px', color: '#666' }}>{u.email}</td>
                  <td style={{ padding: '20px' }}>
                    <span style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: u.role === 'admin' ? 'linear-gradient(135deg, #ff6b6b, #ee5a24)' :
                                 u.role === 'teacher' ? 'linear-gradient(135deg, #4facfe, #00f2fe)' :
                                 'linear-gradient(135deg, #11998e, #38ef7d)',
                      color: 'white'
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => navigate(`/admin/edit-user/${u.id}`)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
                          color: '#333',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 5px 15px rgba(253, 203, 110, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 5px 15px rgba(255, 107, 107, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Courses List */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        animation: 'fadeInUp 0.8s ease-out 1.4s both'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '25px' }}>
          <div style={{
            width: '50px',
            height: '50px',
            background: 'linear-gradient(135deg, #ffecd2, #fcb69f)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '15px'
          }}>
            <span style={{ fontSize: '24px', color: '#333' }}>📚</span>
          </div>
          <h2 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#333',
            margin: 0
          }}>
            All Courses
          </h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            background: 'white',
            borderRadius: '15px',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
          }}>
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #ffecd2, #fcb69f)' }}>
                <th style={{
                  padding: '20px',
                  color: '#333',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Title</th>
                <th style={{
                  padding: '20px',
                  color: '#333',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Description</th>
                <th style={{
                  padding: '20px',
                  color: '#333',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Teacher</th>
                <th style={{
                  padding: '20px',
                  color: '#333',
                  fontWeight: 'bold',
                  textAlign: 'left',
                  fontSize: '16px'
                }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course, index) => (
                <tr key={course.id} style={{
                  borderBottom: '1px solid #f0f0f0',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 236, 210, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'white';
                }}>
                  <td style={{ padding: '20px', fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
                    {course.title}
                  </td>
                  <td style={{ padding: '20px', fontSize: '14px', color: '#666', maxWidth: '300px' }}>
                    {course.description}
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div>
                      <div style={{ fontSize: '16px', color: '#333', fontWeight: 'bold' }}>
                        {course.users?.name}
                      </div>
                      <div style={{ fontSize: '14px', color: '#666' }}>
                        {course.users?.email}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => navigate(`/admin/edit-course/${course.id}`)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #ffeaa7, #fdcb6e)',
                          color: '#333',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 5px 15px rgba(253, 203, 110, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCourse(course.id)}
                        style={{
                          padding: '8px 16px',
                          background: 'linear-gradient(135deg, #ff6b6b, #ee5a24)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          fontSize: '14px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 5px 15px rgba(255, 107, 107, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
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
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;