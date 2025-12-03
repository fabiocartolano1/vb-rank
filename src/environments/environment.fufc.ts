// Environnement FUFC
export const environment = {
  production: true,
  firebase: {
    apiKey: 'AIzaSyCGsb39fQM7qdaY_oTEQfw0ex-jJPAfv_U',
    authDomain: 'fufc-8c9fc.firebaseapp.com',
    projectId: 'fufc-8c9fc',
    storageBucket: 'fufc-8c9fc.firebasestorage.app',
    messagingSenderId: '702980907146',
    appId: '1:702980907146:web:9086aa0ab1ef3851be8d73',
    measurementId: 'G-J9ZRZTVZ92',
  },
  club: {
    name: 'Friends United FC',
    shortName: 'FUFC',
    logo: '/fufc.jpg',
    colors: {
      primary: '#1e40af', // Bleu
      secondary: '#3b82f6',
      accent: '#1e3a8a',
      background: '#f8f9fa',
      text: '#1a1a1a',
    },
    // Mots-clés pour identifier les équipes du club dans les données
    teamKeywords: ['fufc', 'FRIENDS UNITED FC', 'friends', 'friends united'],
  },
};
