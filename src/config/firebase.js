// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyC6-O6BnUXGzwXwcRM_wRYwGUNFuRpT7NI",
  authDomain: "calculadora-free-pro.firebaseapp.com",
  projectId: "calculadora-free-pro",
  storageBucket: "calculadora-free-pro.firebasestorage.app",
  messagingSenderId: "313485499345",
  appId: "1:313485499345:web:05a2db4142512691129ef0"
};

// Initialize Firebase
function initializeFirebase() {
  try {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
    return {
      db: firebase.firestore(),
      auth: firebase.auth(),
      isConnected: true
    };
  } catch (error) {
    console.warn('Firebase indisponível. Rodando local.', error);
    return {
      db: null,
      auth: null,
      isConnected: false
    };
  }
}

// Export for use in other modules
window.FirebaseService = {
  initializeFirebase,
  firebaseConfig
};