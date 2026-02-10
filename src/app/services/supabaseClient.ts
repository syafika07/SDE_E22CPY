import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uonphwbbgemsvqzrdcwp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVvbnBod2JiZ2Vtc3ZxenJkY3dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAzMjE1NDgsImV4cCI6MjA3NTg5NzU0OH0.iQpx0rLiw7qJ3gstPTU8fcIb_fHF-YqGZbbyB0wCE4k';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: sessionStorage,
  }
});
