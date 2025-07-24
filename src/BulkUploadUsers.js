// src/components/BulkUploadUsers.js

import React, { useState } from 'react';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htcvvwvvlixmatxqpvyj.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y3Z2d3Z2bGl4bWF0eHFwdnlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjgzMDc1MSwiZXhwIjoyMDY4NDA2NzUxfQ.YjJQn4yjvAzzWy3ibYvUJXjP1yPCFgEeNWTI5OFE6oo'; // Replace this securely in production
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BulkUploadUsers = () => {
  const [status, setStatus] = useState('');
  const [errorRows, setErrorRows] = useState([]);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const users = results.data;
        setStatus('Inserting into DB...');
        await processUsers(users);
      },
    });
  };

  const processUsers = async (users) => {
    const failed = [];

    // 1️⃣ Step 1: Bulk insert into users table WITHOUT ID
    const insertResult = await supabase.from('users').insert(
      users.map(({ name, email, role }) => ({ name, email, role }))
    );

    if (insertResult.error) {
      setStatus(`DB insert failed: ${insertResult.error.message}`);
      return;
    }

    setStatus('Users inserted into DB. Creating Auth users...');

    // 2️⃣ Step 2: Fetch users from DB (by email)
    const { data: dbUsers, error } = await supabase
      .from('users')
      .select('id, email')
      .in('email', users.map((u) => u.email));

    if (error) {
      setStatus(`Fetch from DB failed: ${error.message}`);
      return;
    }

    // 3️⃣ Step 3: Create Auth users and update DB with ID
    for (const user of users) {
      const dbUser = dbUsers.find((u) => u.email === user.email);
      if (!dbUser) continue;

      const { email, password } = user;

      const { data, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) {
        console.error(`Auth error for ${email}:`, authError.message);
        failed.push({ email, error: authError.message });
        continue;
      }

      const authId = data?.user?.id;

      // Update DB row with Auth ID
      const updateResult = await supabase
        .from('users')
        .update({ id: authId })
        .eq('email', email);

      if (updateResult.error) {
        console.error(`Failed to update ID for ${email}`);
        failed.push({ email, error: updateResult.error.message });
      }
    }

    if (failed.length > 0) {
      setStatus(`Upload complete with ${failed.length} failures.`);
      setErrorRows(failed);
    } else {
      setStatus('✅ All users uploaded and synced with Auth.');
    }
  };

  return (
    <div className="p-4 bg-white rounded shadow mt-4">
      <h2 className="text-lg font-semibold mb-2">Bulk Upload Users via CSV</h2>
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="mb-4"
      />
      <p className="text-blue-600">{status}</p>

      {errorRows.length > 0 && (
        <div className="mt-4 text-red-600">
          <h3 className="font-semibold">Failed Rows:</h3>
          <ul className="text-sm list-disc ml-6">
            {errorRows.map((row, i) => (
              <li key={i}>
                {row.email}: {row.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default BulkUploadUsers;
