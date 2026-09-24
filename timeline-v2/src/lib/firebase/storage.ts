import {
  ref,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';
import { storage } from './config';

/**
 * Upload image file to Firebase Storage
 */
export async function uploadImage(
  file: File,
  path: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const storageRef = ref(storage, path);

  // Upload file
  const snapshot = await uploadBytes(storageRef, file, {
    contentType: file.type,
  });

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Upload base64 image to Firebase Storage
 */
export async function uploadBase64Image(
  base64Data: string,
  path: string
): Promise<string> {
  const storageRef = ref(storage, path);

  // Upload base64 string
  const snapshot = await uploadString(storageRef, base64Data, 'data_url');

  // Get download URL
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
}

/**
 * Upload person photo
 */
export async function uploadPersonPhoto(
  timelineId: string,
  personId: string,
  file: File | string // File object or base64 string
): Promise<string> {
  const path = `timelines/${timelineId}/people/${personId}.jpg`;

  if (typeof file === 'string') {
    // Base64 string
    return uploadBase64Image(file, path);
  } else {
    // File object
    return uploadImage(file, path);
  }
}

/**
 * Upload event image
 */
export async function uploadEventImage(
  timelineId: string,
  eventId: string,
  file: File | string,
  index: number = 0
): Promise<string> {
  const path = `timelines/${timelineId}/events/${eventId}_${index}.jpg`;

  if (typeof file === 'string') {
    return uploadBase64Image(file, path);
  } else {
    return uploadImage(file, path);
  }
}

/**
 * Upload canvas image
 */
export async function uploadCanvasImage(
  timelineId: string,
  imageId: string,
  file: File | string
): Promise<string> {
  const path = `timelines/${timelineId}/canvas/${imageId}.jpg`;

  if (typeof file === 'string') {
    return uploadBase64Image(file, path);
  } else {
    return uploadImage(file, path);
  }
}

/**
 * Upload background image
 */
export async function uploadBackgroundImage(
  timelineId: string,
  file: File | string
): Promise<string> {
  const path = `timelines/${timelineId}/backgrounds/main.jpg`;

  if (typeof file === 'string') {
    return uploadBase64Image(file, path);
  } else {
    return uploadImage(file, path);
  }
}

/**
 * Upload era background image
 */
export async function uploadEraBackground(
  timelineId: string,
  eraId: string,
  file: File | string
): Promise<string> {
  const path = `timelines/${timelineId}/backgrounds/${eraId}.jpg`;

  if (typeof file === 'string') {
    return uploadBase64Image(file, path);
  } else {
    return uploadImage(file, path);
  }
}

/**
 * Delete image from Firebase Storage
 */
export async function deleteImage(url: string): Promise<void> {
  try {
    const storageRef = ref(storage, url);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - image might already be deleted
  }
}

/**
 * Delete all images for a timeline
 */
export async function deleteTimelineImages(timelineId: string): Promise<void> {
  const timelineRef = ref(storage, `timelines/${timelineId}`);

  try {
    // List all files
    const listResult = await listAll(timelineRef);

    // Delete all files
    await Promise.all(
      listResult.items.map((itemRef) => deleteObject(itemRef))
    );

    // Recursively delete folders
    await Promise.all(
      listResult.prefixes.map((folderRef) => deleteAllInFolder(folderRef.fullPath))
    );
  } catch (error) {
    console.error('Error deleting timeline images:', error);
  }
}

/**
 * Delete all files in a folder (recursive)
 */
async function deleteAllInFolder(path: string): Promise<void> {
  const folderRef = ref(storage, path);
  const listResult = await listAll(folderRef);

  await Promise.all(
    listResult.items.map((itemRef) => deleteObject(itemRef))
  );

  await Promise.all(
    listResult.prefixes.map((folderRef) => deleteAllInFolder(folderRef.fullPath))
  );
}

/**
 * Get download URL from storage path
 */
export async function getImageURL(path: string): Promise<string> {
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

/**
 * Check if image exists
 */
export async function imageExists(path: string): Promise<boolean> {
  try {
    const storageRef = ref(storage, path);
    await getDownloadURL(storageRef);
    return true;
  } catch (error) {
    return false;
  }
}
