const SUPABASE_URL = 'https://wuzhthtdabccinwsfxwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1emh0aHRkYWJjY2lud3NmeHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTA1MTgsImV4cCI6MjA2NzkyNjUxOH0.ZXRXuFp_BbQYKV_NAw8BpsPT3ydMpXAPV8iIG_rEzas';

// Initialize the Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);