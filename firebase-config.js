const firebaseConfig = {
  apiKey: "AIzaSyAtRFzu4qEJC6HPsaHp2SEJ5kA-M8i4l_M",
  authDomain: "smart-house-a262a.firebaseapp.com",
  databaseURL: "https://smart-house-a262a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-house-a262a",
  storageBucket: "smart-house-a262a.firebasestorage.app",
  messagingSenderId: "867931716105",
  appId: "1:867931716105:web:b3bdf70a021de7170b96d8",
  measurementId: "G-DZZ6B3XSWH"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

// Dùng var hoặc window.rtdb để biến rtdb có phạm vi toàn cục (Global Scope)
var rtdb = firebase.database();
console.log("Firebase Realtime Database đã sẵn sàng!");