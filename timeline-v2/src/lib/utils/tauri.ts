/**
 * Tauri filesystem and dialog utilities
 * Provides a consistent API for file operations in desktop mode
 */

type FileFilter = {
  name: string;
  extensions: string[];
};

/**
 * Check if running in Tauri (desktop) mode
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Open a file picker dialog
 * @param filters - Optional file type filters (e.g., [{name: "Images", extensions: ["png", "jpg"]}])
 * @returns Selected file path or null if cancelled
 */
export async function openFileDialog(filters?: FileFilter[]): Promise<string | null> {
  if (!isTauri()) return null;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string | null>('open_file_dialog', { filters });
  } catch (error) {
    console.error('Error opening file dialog:', error);
    return null;
  }
}

/**
 * Open a save file dialog
 * @param defaultName - Default filename
 * @param filters - Optional file type filters
 * @returns Selected save path or null if cancelled
 */
export async function saveFileDialog(defaultName?: string, filters?: FileFilter[]): Promise<string | null> {
  if (!isTauri()) return null;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string | null>('save_file_dialog', { defaultName, filters });
  } catch (error) {
    console.error('Error opening save dialog:', error);
    return null;
  }
}

/**
 * Open a directory picker dialog
 * @returns Selected directory path or null if cancelled
 */
export async function selectDirectory(): Promise<string | null> {
  if (!isTauri()) return null;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string | null>('select_directory');
  } catch (error) {
    console.error('Error opening directory dialog:', error);
    return null;
  }
}

/**
 * Read a text file from the filesystem
 * @param path - Absolute file path
 * @returns File contents as string
 */
export async function readTextFile(path: string): Promise<string | null> {
  if (!isTauri()) return null;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string>('read_text_file', { path });
  } catch (error) {
    console.error('Error reading text file:', error);
    return null;
  }
}

/**
 * Write a text file to the filesystem
 * @param path - Absolute file path
 * @param contents - Text contents to write
 * @returns true if successful
 */
export async function writeTextFile(path: string, contents: string): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_text_file', { path, contents });
    return true;
  } catch (error) {
    console.error('Error writing text file:', error);
    return false;
  }
}

/**
 * Read a binary file from the filesystem
 * @param path - Absolute file path
 * @returns File contents as Uint8Array
 */
export async function readBinaryFile(path: string): Promise<Uint8Array | null> {
  if (!isTauri()) return null;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    const data = await invoke<number[]>('read_binary_file', { path });
    return new Uint8Array(data);
  } catch (error) {
    console.error('Error reading binary file:', error);
    return null;
  }
}

/**
 * Write a binary file to the filesystem
 * @param path - Absolute file path
 * @param contents - Binary contents to write
 * @returns true if successful
 */
export async function writeBinaryFile(path: string, contents: Uint8Array): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('write_binary_file', { path, contents: Array.from(contents) });
    return true;
  } catch (error) {
    console.error('Error writing binary file:', error);
    return false;
  }
}

/**
 * Check if a file exists
 * @param path - Absolute file path
 * @returns true if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<boolean>('file_exists', { path });
  } catch (error) {
    console.error('Error checking file existence:', error);
    return false;
  }
}

/**
 * Create a directory (and all parent directories)
 * @param path - Absolute directory path
 * @returns true if successful
 */
export async function createDirectory(path: string): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('create_directory', { path });
    return true;
  } catch (error) {
    console.error('Error creating directory:', error);
    return false;
  }
}

/**
 * Delete a file
 * @param path - Absolute file path
 * @returns true if successful
 */
export async function deleteFile(path: string): Promise<boolean> {
  if (!isTauri()) return false;

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    await invoke('delete_file', { path });
    return true;
  } catch (error) {
    console.error('Error deleting file:', error);
    return false;
  }
}

/**
 * List all files in a directory
 * @param path - Absolute directory path
 * @returns Array of file paths
 */
export async function listDirectory(path: string): Promise<string[]> {
  if (!isTauri()) return [];

  try {
    const { invoke } = await import('@tauri-apps/api/core');
    return await invoke<string[]>('list_directory', { path });
  } catch (error) {
    console.error('Error listing directory:', error);
    return [];
  }
}
