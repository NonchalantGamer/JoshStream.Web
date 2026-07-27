/* JoshStream Web - Production Backend Configuration (Firebase & Supabase)
 * 
 * Instructions:
 * 1. Go to https://console.firebase.google.com/
 * 2. Create a new Firebase Project (or select existing)
 * 3. Go to Project Settings > General > Your Apps > Web App (</>)
 * 4. Copy your firebaseConfig object and paste your credentials below!
 */

window.FIREBASE_CONFIG = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "joshstream-web-demo.firebaseapp.com",
  projectId: "joshstream-web-demo",
  storageBucket: "joshstream-web-demo.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_FIREBASE_APP_ID"
};

/* Supabase Configuration Option (Alternative)
 * 1. Go to https://supabase.com/
 * 2. Create a new project -> Project Settings -> API
 * 3. Copy URL and anon key below.
 */
window.SUPABASE_CONFIG = {
  url: "https://YOUR_SUPABASE_PROJECT_REF.supabase.co",
  anonKey: "YOUR_SUPABASE_ANON_KEY"
};
