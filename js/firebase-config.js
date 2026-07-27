/* JoshStream Web - Supabase Backend Configuration */

window.SUPABASE_CONFIG = {
  url: "https://jkxcehfcwktovanaeicg.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpreGNlaGZjd2t0b3ZhbmFlaWNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxNDY1MDMsImV4cCI6MjEwMDcyMjUwM30.emirGQqaCWJ1EU-09NYtRHKhMU9vXIdL6NhZ1z7CbZ0"
};

// Initialize the global Supabase client immediately
window.supabaseClient = supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);
