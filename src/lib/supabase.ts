import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://rrzhmbqesbrggzwckfql.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImE5NjZhMGViLWM0Y2ItNDNlYS1hNWIwLWU2YWMxOTVkOTM5YSJ9.eyJwcm9qZWN0SWQiOiJycnpobWJxZXNicmdnendja2ZxbCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzgyMDQ2NTY0LCJleHAiOjIwOTc0MDY1NjQsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.vf2kM5_1iTv4WpEATr8P2M94pCaTiUGGIavur1Y3_mA';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };