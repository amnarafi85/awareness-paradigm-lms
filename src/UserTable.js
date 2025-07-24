// src/components/UserTable.js

import React, { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import EditUserModal from './EditUserModal';

const UserTable = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);

  // Fetch users from DB
  const fetchUsers = async () => {
    const { data, error } = await supabase.from('users').select('*');
    if (error) console.error('Error fetching users:', error);
    else setUsers(data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Delete user from DB & Auth
  const handleDelete = async (user) => {
    const confirm = window.confirm(`Are you sure you want to delete ${user.email}?`);
    if (!confirm) return;

    // 1. Remove from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(user.id);
    if (authError) {
      console.error('Auth delete error:', authError);
      return;
    }

    // 2. Remove from 'users' table
    const { error: dbError } = await supabase.from('users').delete().eq('id', user.id);
    if (dbError) {
      console.error('DB delete error:', dbError);
    } else {
      fetchUsers(); // refresh list
    }
  };

  return (
    <div className="mt-6">
      <h2 className="text-lg font-bold mb-2">All Users</h2>
      <table className="w-full border text-sm">
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Name</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Role</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="border p-2">{user.name}</td>
              <td className="border p-2">{user.email}</td>
              <td className="border p-2">{user.role}</td>
              <td className="border p-2">
                <button
                  className="text-blue-500 mr-2"
                  onClick={() => setEditingUser(user)}
                >
                  Edit
                </button>
                <button
                  className="text-red-500"
                  onClick={() => handleDelete(user)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => {
            setEditingUser(null);
            fetchUsers(); // refresh after update
          }}
        />
      )}
    </div>
  );
};

export default UserTable;
