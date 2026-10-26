// Web config for the arcade's Firebase project (vela-arcade, under
// sammygoldencars@gmail.com), used by rooms.js for online play. On localhost
// rooms.js ignores it and talks to the emulator instead.
// A web apiKey is a public identifier, not a secret. Access control lives in
// firestore.rules at the repo root (`firebase deploy --only firestore:rules`).
export const firebaseConfig = {
  apiKey: 'AIzaSyC07Vtlz8-YhJRGtgdGBNh8lL3OFfrhVek',
  authDomain: 'vela-arcade.firebaseapp.com',
  projectId: 'vela-arcade',
  storageBucket: 'vela-arcade.firebasestorage.app',
  messagingSenderId: '645378295778',
  appId: '1:645378295778:web:efdec96f9c90efb7f05bbb',
}
