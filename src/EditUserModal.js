// src/components/EditUserModal.js

import React, { useState } from 'react';
import { supabase } from './supabaseClient';

const EditUserModal = ({ user, onClose }) => {
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);
    const { error } = await supabase
      .from('users')
      .update({ name, role })
      .eq('id', user.id);

    setLoading(false);
    if (error) {
      alert('Error updating user');
      console.error(error);
    } else {
      onClose(); // close modal + refresh list
    }
  };

  return (
    <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow w-80">
        <h3 className="text-lg font-semibold mb-4">Edit User</h3>

        <label className="block mb-2 text-sm">Name</label>
        <input
          className="w-full p-2 border mb-4"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <label className="block mb-2 text-sm">Role</label>
        <select
          className="w-full p-2 border mb-4"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="admin">admin</option>
          <option value="teacher">teacher</option>
          <option value="student">student</option>
        </select>

        <div className="flex justify-between">
          <button
            className="bg-gray-200 px-4 py-2 rounded"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            className="bg-blue-500 text-white px-4 py-2 rounded"
            onClick={handleUpdate}
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditUserModal;
