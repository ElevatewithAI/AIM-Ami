/* Public settings for the chat. These values are safe to publish.
   (Firebase web config and reCAPTCHA site keys are meant to be public. Your database is protected by firestore.rules and App Check.) */
window.AIM_CONFIG = {
  firebase: {
    apiKey: "AIzaSyAW7mQqKanbXGulPmqd2BUbgqBiuGm8hM8",
    authDomain: "aim-ami.firebaseapp.com",
    projectId: "aim-ami",
    storageBucket: "aim-ami.firebasestorage.app",
    messagingSenderId: "1082804419227",
    appId: "1:1082804419227:web:4731cfa90555ae983ca43e",
    measurementId: "G-8WKPZ26GHK"
  },
  // App Check (reCAPTCHA enterprise site key) keeps other sites from using your Gemini quota and database.
  appCheck: { provider: "enterprise", siteKey: "6LdvqCUuAAAAACiv-938_7m-270_-1wFRrgWr1yj", debug: false },
  adminEmail: "aim4ami@gmail.com",
  aiModel: "gemini-2.5-flash",
  liveAgentFormUrl: "https://formspree.io/f/mqpqqwbo",
  sdk: "12.15.0"
};
