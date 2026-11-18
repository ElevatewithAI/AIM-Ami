/* Public settings for the chat. These values are safe to publish.
   Paste your Firebase web app config below (Firebase console > Project settings > Your apps > Web app). */
window.AIM_CONFIG = {
  firebase: {
    apiKey: "PASTE_API_KEY",
    authDomain: "PASTE_PROJECT_ID.firebaseapp.com",
    projectId: "PASTE_PROJECT_ID",
    storageBucket: "PASTE_PROJECT_ID.firebasestorage.app",
    messagingSenderId: "PASTE_SENDER_ID",
    appId: "PASTE_APP_ID"
  },
  // App Check protects your Gemini quota and database from other sites.
  // Create a reCAPTCHA v3 key at google.com/recaptcha/admin and paste the SITE key here.
  appCheck: { provider: "v3", siteKey: "", debug: false },
  adminEmail: "aim4ami@gmail.com",
  aiModel: "gemini-2.5-flash",
  liveAgentFormUrl: "https://formspree.io/f/mqpqqwbo",
  sdk: "12.15.0"
};
