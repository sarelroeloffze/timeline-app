use tauri::Manager;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
pub async fn open_file_dialog(
    app: tauri::AppHandle,
    filters: Option<Vec<(String, Vec<String>)>>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

    let file_dialog = app.dialog().file();

    // Add filters if provided
    let file_dialog = if let Some(f) = filters {
        let mut dialog = file_dialog;
        for (name, extensions) in f {
            dialog = dialog.add_filter(&name, &extensions.iter().map(|s| s.as_str()).collect::<Vec<_>>());
        }
        dialog
    } else {
        file_dialog
    };

    // Show dialog and get result
    let result = file_dialog.blocking_pick_file();

    match result {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn save_file_dialog(
    app: tauri::AppHandle,
    default_name: Option<String>,
    filters: Option<Vec<(String, Vec<String>)>>,
) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let mut file_dialog = app.dialog().file();

    // Set default filename if provided
    if let Some(name) = default_name {
        file_dialog = file_dialog.set_file_name(&name);
    }

    // Add filters if provided
    if let Some(f) = filters {
        for (name, extensions) in f {
            file_dialog = file_dialog.add_filter(&name, &extensions.iter().map(|s| s.as_str()).collect::<Vec<_>>());
        }
    }

    // Show save dialog
    let result = file_dialog.blocking_save_file();

    match result {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn select_directory(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;

    let result = app.dialog().file().blocking_pick_folder();

    match result {
        Some(path) => Ok(Some(path.to_string_lossy().to_string())),
        None => Ok(None),
    }
}

#[tauri::command]
pub async fn read_text_file(path: String) -> Result<String, String> {
    fs::read_to_string(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_text_file(path: String, contents: String) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn read_binary_file(path: String) -> Result<Vec<u8>, String> {
    fs::read(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn write_binary_file(path: String, contents: Vec<u8>) -> Result<(), String> {
    fs::write(&path, contents).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn file_exists(path: String) -> Result<bool, String> {
    Ok(PathBuf::from(&path).exists())
}

#[tauri::command]
pub async fn create_directory(path: String) -> Result<(), String> {
    fs::create_dir_all(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn delete_file(path: String) -> Result<(), String> {
    fs::remove_file(&path).map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn list_directory(path: String) -> Result<Vec<String>, String> {
    let entries = fs::read_dir(&path).map_err(|e| e.to_string())?;

    let mut files = Vec::new();
    for entry in entries {
        if let Ok(entry) = entry {
            files.push(entry.path().to_string_lossy().to_string());
        }
    }

    Ok(files)
}
