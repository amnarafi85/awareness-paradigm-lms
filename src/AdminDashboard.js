import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import Select from 'react-select';
import Papa from 'papaparse';
import './admin.css';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

function generateRandomPassword(length = 10) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'student' });
  const [newCourse, setNewCourse] = useState({ title: '', description: '', teacher_ids: [] });
  const [enrollments, setEnrollments] = useState({ course_id: '', student_id: '' });
  const [credentials, setCredentials] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchCourses();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*');
    setUsers(data);
  };

  const fetchCourses = async () => {
    const { data } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        description,
        course_teachers (
          teacher_id,
          users ( name )
        )
      `)
      .order('title', { ascending: true });
    setCourses(data || []);
  };

  const createUser = async () => {
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .eq('email', newUser.email);

    if (existingUsers && existingUsers.length > 0) {
      alert('User with this email already exists.');
      return;
    }

    const password = generateRandomPassword();
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: newUser.email,
      password,
      email_confirm: true,
      user_metadata: { full_name: newUser.name, role: newUser.role },
    });
    if (authError) {
      alert('Auth creation failed: ' + authError.message);
      return;
    }

    const userData = {
      id: authUser.user.id,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      plaintext_password: password,
      is_blocked: false,
      blocked_until: null,
    };
    const { error: dbError } = await supabase.from('users').insert(userData);
    if (dbError) {
      alert('Database insertion failed: ' + dbError.message);
      return;
    }

    setCredentials({ email: newUser.email, password });
    fetchUsers();
  };

  const handleCsvUpload = (e) => {
    setCsvFile(e.target.files[0]);
  };

  const processCsv = async () => {
    if (!csvFile) return alert('Please upload a CSV file');
    Papa.parse(csvFile, {
      header: true,
      complete: async (results) => {
        for (const row of results.data) {
          const { name, email, role } = row;
          const { data: existing } = await supabase
            .from('users')
            .select('id')
            .eq('email', email);
          if (existing && existing.length > 0) continue;

          const password = generateRandomPassword();
          const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name: name, role },
          });
          if (authError || !authUser) continue;

          await supabase.from('users').insert({
            id: authUser.user.id,
            name,
            email,
            role,
            plaintext_password: password,
            is_blocked: false,
            blocked_until: null,
          });
        }
        fetchUsers();
        alert('CSV processed successfully. Users created.');
      },
    });
  };

  const createCourse = async () => {
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .eq('title', newCourse.title);

    if (existingCourses && existingCourses.length > 0) {
      alert('Course with this title already exists.');
      return;
    }

    const { data: insertedCourse, error: courseError } = await supabase
      .from('courses')
      .insert({ title: newCourse.title, description: newCourse.description })
      .select()
      .single();
    if (courseError) {
      alert(courseError.message);
      return;
    }

    const teacherRows = newCourse.teacher_ids.map((teacher_id) => ({
      course_id: insertedCourse.id,
      teacher_id,
    }));
    const { error: teacherLinkError } = await supabase
      .from('course_teachers')
      .insert(teacherRows);
    if (teacherLinkError) {
      alert('Course created but assigning teachers failed: ' + teacherLinkError.message);
    }
    fetchCourses();
  };

  const enrollStudent = async () => {
    const { data: existing } = await supabase
      .from('course_enrollments')
      .select('id')
      .eq('student_id', enrollments.student_id)
      .eq('course_id', enrollments.course_id);

    if (existing && existing.length > 0) {
      alert('This student is already enrolled in this course.');
      return;
    }

    const { error } = await supabase.from('course_enrollments').insert(enrollments);
    if (!error) alert('Student Enrolled Successfully');
    else alert(error.message);
  };

  const toggleBlockUser = async (id, isBlocked, blockedUntil) => {
    if (isBlocked) {
      const confirmUnblock = window.confirm("Do you want to unblock this user manually?");
      if (!confirmUnblock) return;

      const { error: dbError } = await supabase
        .from('users')
        .update({ is_blocked: false, blocked_until: null })
        .eq('id', id);
      if (dbError) return alert(dbError.message);

      await supabase.auth.admin.updateUserById(id, { banned: false });
    } else {
      const duration = window.prompt("Enter block duration in days (1-60):", "15");
      const days = parseInt(duration, 10);
      if (isNaN(days) || days < 1 || days > 60) return alert("Invalid duration. Use a number between 1 and 60.");

      const until = new Date(Date.now() + days * 86400000).toISOString();
      const { error: dbError } = await supabase
        .from('users')
        .update({ is_blocked: true, blocked_until: until })
        .eq('id', id);
      if (dbError) return alert(dbError.message);

      await supabase.auth.admin.updateUserById(id, { banned: true });
    }
    fetchUsers();
  };

  const deleteUser = async (id) => {
    if (window.confirm('Delete user?')) {
      await supabase.from('users').delete().eq('id', id);
      await supabase.auth.admin.deleteUser(id);
      fetchUsers();
    }
  };

  const deleteCourse = async (id) => {
    if (window.confirm('Delete course?')) {
      await supabase.from('courses').delete().eq('id', id);
      fetchCourses();
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h1>Admin Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{ padding:'8px 12px', background:'#e53e3e', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
          Logout
        </button>
      </div>

      <section>
        <h2>Create User</h2>
        <input placeholder="Name" onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
        <input placeholder="Email" onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
        <select onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
          <option value="student">Student</option>
          <option value="teacher">Teacher</option>
          <option value="admin">Admin</option>
        </select>
        <button onClick={createUser}>Create User</button>
        {credentials && (
          <div>
            <p>Credentials:</p>
            <p>Email: {credentials.email}</p>
            <p>Password: {credentials.password}</p>
          </div>
        )}
      </section>

      <section>
        <h2>Bulk Upload Users via CSV</h2>
        <input type="file" accept=".csv" onChange={handleCsvUpload} />
        <button onClick={processCsv}>Upload CSV</button>
      </section>

      <section>
        <h2>Create Course</h2>
        <input placeholder="Title" onChange={e => setNewCourse({ ...newCourse, title: e.target.value })} />
        <input placeholder="Description" onChange={e => setNewCourse({ ...newCourse, description: e.target.value })} />
        <Select
          isMulti
          options={users.filter(u => u.role === 'teacher').map(t => ({ value: t.id, label: t.name }))}
          onChange={opts => setNewCourse({ ...newCourse, teacher_ids: opts.map(o => o.value) })}
          placeholder="Select teacher(s)..."
        />
        <button onClick={createCourse}>Create Course</button>
      </section>

      <section>
        <h2>Enroll Student</h2>
        <select onChange={e => setEnrollments({ ...enrollments, student_id: e.target.value })}>
          <option value="">Select Student</option>
          {users.filter(u => u.role === 'student').map(s => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <select onChange={e => setEnrollments({ ...enrollments, course_id: e.target.value })}>
          <option value="">Select Course</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <button onClick={enrollStudent}>Enroll</button>
      </section>

      <section>
        <h2>All Users</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Blocked</th>
              <th>Blocked Until</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{u.is_blocked ? 'Yes' : 'No'}</td>
                <td>{u.blocked_until ? new Date(u.blocked_until).toLocaleDateString() : '-'}</td>
                <td>{u.plaintext_password}</td>
                <td>
                  <button onClick={() => toggleBlockUser(u.id, u.is_blocked, u.blocked_until)}>
                    {u.is_blocked ? 'Unblock/Extend' : 'Block'}
                  </button>
                  <button onClick={() => deleteUser(u.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>All Courses</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Description</th>
              <th>Teacher(s)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id}>
                <td>{c.title}</td>
                <td>{c.description}</td>
                <td>
                  {(c.course_teachers || [])
                    .map(ct => ct.users?.name)
                    .filter(Boolean)
                    .join(', ') || 'N/A'}
                </td>
                <td><button onClick={() => deleteCourse(c.id)}>Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminDashboard;
