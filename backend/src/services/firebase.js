// COMMENTED OUT FOR LOCAL TESTING - Uncomment when deploying to production
/*
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let storage = null;
let bucket = null;

// Initialize Firebase Admin
export function initializeFirebase() {
  try {
    if (admin.apps.length > 0) {
      // Already initialized
      return;
    }

    // Check if service account key exists
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
      join(__dirname, '../../firebase-service-account.json');

    let serviceAccount;
    try {
      serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'));
    } catch (error) {
      console.warn('Firebase service account not found. Using local file storage.');
      return;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET
    });

    storage = admin.storage();
    bucket = storage.bucket();

    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.error('Firebase initialization failed:', error.message);
    console.warn('Falling back to local file storage');
  }
}
*/

/*
**
 * Upload file to Firebase Storage
 * @param {string} filePath - Local file path
 * @param {string} destination - Destination path in Firebase
 * @returns {Promise<string>} - Public URL of uploaded file
 *
export async function uploadToFirebase(filePath, destination) {
  if (!bucket) {
    throw new Error('Firebase not initialized. Using local storage.');
  }

  try {
    const options = {
      destination,
      metadata: {
        cacheControl: 'public, max-age=31536000',
      }
    };

    await bucket.upload(filePath, options);

    // Make file publicly accessible
    const file = bucket.file(destination);
    await file.makePublic();

    // Get public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destination}`;

    console.log(`✅ Uploaded to Firebase: ${destination}`);
    return publicUrl;
  } catch (error) {
    console.error('Firebase upload failed:', error);
    throw error;
  }
}

**
 * Delete file from Firebase Storage
 *
export async function deleteFromFirebase(filePath) {
  if (!bucket) {
    return;
  }

  try {
    await bucket.file(filePath).delete();
    console.log(`✅ Deleted from Firebase: ${filePath}`);
  } catch (error) {
    console.error('Firebase delete failed:', error);
  }
}

**
 * Get signed URL for private files
 *
export async function getSignedUrl(filePath, expiresIn = 3600000) {
  if (!bucket) {
    throw new Error('Firebase not initialized');
  }

  const file = bucket.file(filePath);
  const [url] = await file.getSignedUrl({
    action: 'read',
    expires: Date.now() + expiresIn
  });

  return url;
}

**
 * Check if Firebase is available
 *
export function isFirebaseAvailable() {
  return bucket !== null;
}

export default {
  initializeFirebase,
  uploadToFirebase,
  deleteFromFirebase,
  getSignedUrl,
  isFirebaseAvailable
};
*/

// MOCK EXPORTS FOR LOCAL TESTING
export function initializeFirebase() {
  console.log('⚠️ Firebase disabled for local testing - using local file storage');
}

export async function uploadToFirebase() {
  throw new Error('Firebase not available - using local storage');
}

export async function deleteFromFirebase() {
  console.log('⚠️ Firebase not available');
}

export async function getSignedUrl() {
  throw new Error('Firebase not available');
}

export function isFirebaseAvailable() {
  return false;
}

export default {
  initializeFirebase,
  uploadToFirebase,
  deleteFromFirebase,
  getSignedUrl,
  isFirebaseAvailable
};
