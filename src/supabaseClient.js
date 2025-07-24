import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://htcvvwvvlixmatxqpvyj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Y3Z2d3Z2bGl4bWF0eHFwdnlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI4MzA3NTEsImV4cCI6MjA2ODQwNjc1MX0.CDN_-Z8LPZ5m-q279KPMlzHRCbUA31Dhx65oB6DZ1l0';

export const supabase = createClient(supabaseUrl, supabaseKey);
