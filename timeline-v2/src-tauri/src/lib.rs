mod menu;
mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_shell::init())
    .menu(menu::create_menu())
    .on_menu_event(menu::handle_menu_event)
    .invoke_handler(tauri::generate_handler![
      commands::open_file_dialog,
      commands::save_file_dialog,
      commands::select_directory,
      commands::read_text_file,
      commands::write_text_file,
      commands::read_binary_file,
      commands::write_binary_file,
      commands::file_exists,
      commands::create_directory,
      commands::delete_file,
      commands::list_directory,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
