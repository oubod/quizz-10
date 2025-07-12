// supabase-client.js
const SUPABASE_URL = 'https://dpdxkooonpxyvwualqsm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZHhrb29vbnB4eXZ3dWFscXNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTY4MTgsImV4cCI6MjA2NzkzMjgxOH0.ge06j-mcYFGk19_KD5wrylz6LiyD61Diz6IYKB7tFsY';

// Use the global supabase object from the CDN
window.supabase = window.supabase || {};
window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
window.db = window.supabase;