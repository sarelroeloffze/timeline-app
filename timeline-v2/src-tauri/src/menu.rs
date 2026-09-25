use tauri::{Menu, MenuItem, Submenu, CustomMenuItem, WindowMenuEvent, Manager};

pub fn create_menu() -> Menu {
    // File menu
    let file_menu = Submenu::new(
        "File",
        Menu::new()
            .add_item(CustomMenuItem::new("new", "New Timeline").accelerator("CmdOrCtrl+N"))
            .add_item(CustomMenuItem::new("new_template", "New from Template..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("open", "Open / Load...").accelerator("CmdOrCtrl+O"))
            .add_item(CustomMenuItem::new("open_recent", "Open Recent..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("save", "Save").accelerator("CmdOrCtrl+S"))
            .add_item(CustomMenuItem::new("save_as", "Save As...").accelerator("CmdOrCtrl+Shift+S"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("import_csv", "Import CSV..."))
            .add_item(CustomMenuItem::new("import_gedcom", "Import GEDCOM (.ged)..."))
            .add_item(CustomMenuItem::new("import_sheets", "📊 Google Sheets Sync..."))
            .add_item(CustomMenuItem::new("import_wiki", "🌐 Wikipedia Import..."))
            .add_item(CustomMenuItem::new("extract", "✨ Extract from Text..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("export_json", "Export JSON..."))
            .add_item(CustomMenuItem::new("export_png", "Export to PNG..."))
            .add_item(CustomMenuItem::new("export_pdf", "Export to PDF..."))
            .add_item(CustomMenuItem::new("export_pptx", "Export to PowerPoint..."))
            .add_item(CustomMenuItem::new("export_ics", "📅 Export to Calendar (.ics)..."))
            .add_item(CustomMenuItem::new("export_narrative", "📖 Narrative Export..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("version_history", "🕐 Version History...").accelerator("CmdOrCtrl+Shift+H"))
            .add_item(CustomMenuItem::new("share", "🔗 Share..."))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Quit)
    );

    // Edit menu
    let edit_menu = Submenu::new(
        "Edit",
        Menu::new()
            .add_item(CustomMenuItem::new("undo", "Undo").accelerator("CmdOrCtrl+Z"))
            .add_item(CustomMenuItem::new("redo", "Redo").accelerator("CmdOrCtrl+Shift+Z"))
            .add_native_item(MenuItem::Separator)
            .add_native_item(MenuItem::Cut)
            .add_native_item(MenuItem::Copy)
            .add_native_item(MenuItem::Paste)
            .add_native_item(MenuItem::SelectAll)
    );

    // View menu
    let view_menu = Submenu::new(
        "View",
        Menu::new()
            .add_item(CustomMenuItem::new("view_horizontal", "⇔ Horizontal").accelerator("CmdOrCtrl+1"))
            .add_item(CustomMenuItem::new("view_vertical", "⇕ Vertical").accelerator("CmdOrCtrl+2"))
            .add_item(CustomMenuItem::new("view_data", "📊 Data").accelerator("CmdOrCtrl+3"))
            .add_item(CustomMenuItem::new("view_flow", "〰 Flow").accelerator("CmdOrCtrl+4"))
            .add_item(CustomMenuItem::new("view_thread", "🧵 Thread").accelerator("CmdOrCtrl+5"))
            .add_item(CustomMenuItem::new("view_map", "🗺 Map").accelerator("CmdOrCtrl+6"))
            .add_item(CustomMenuItem::new("view_report", "📋 Report").accelerator("CmdOrCtrl+7"))
            .add_item(CustomMenuItem::new("view_slides", "📽 Slides").accelerator("CmdOrCtrl+Shift+L"))
            .add_item(CustomMenuItem::new("view_canvas", "📐 Canvas").accelerator("CmdOrCtrl+8"))
            .add_item(CustomMenuItem::new("view_gantt", "📊 Gantt").accelerator("CmdOrCtrl+9"))
            .add_item(CustomMenuItem::new("view_tree", "🌳 Tree"))
            .add_item(CustomMenuItem::new("view_radial", "☀ Radial"))
            .add_item(CustomMenuItem::new("view_subway", "🚇 Subway"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("filters", "People & Filters..."))
            .add_item(CustomMenuItem::new("sidebar_search", "Search Panel"))
            .add_item(CustomMenuItem::new("sidebar_people", "People Panel"))
            .add_item(CustomMenuItem::new("sidebar_places", "Places Panel"))
            .add_item(CustomMenuItem::new("sidebar_arcs", "Arcs Panel"))
    );

    // Navigation menu
    let nav_menu = Submenu::new(
        "Navigation",
        Menu::new()
            .add_item(CustomMenuItem::new("fit_all", "Fit All").accelerator("CmdOrCtrl+0"))
            .add_item(CustomMenuItem::new("zoom_in", "Zoom In").accelerator("CmdOrCtrl+="))
            .add_item(CustomMenuItem::new("zoom_out", "Zoom Out").accelerator("CmdOrCtrl+-"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("goto", "Go To...").accelerator("CmdOrCtrl+G"))
    );

    // Item menu
    let item_menu = Submenu::new(
        "Item",
        Menu::new()
            .add_item(CustomMenuItem::new("add_person", "+ Person").accelerator("CmdOrCtrl+Shift+P"))
            .add_item(CustomMenuItem::new("add_event", "+ Event").accelerator("CmdOrCtrl+Shift+E"))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("manage_categories", "Manage Categories..."))
            .add_item(CustomMenuItem::new("manage_places", "Manage Places..."))
            .add_item(CustomMenuItem::new("manage_arcs", "Manage Story Arcs..."))
    );

    // Tools menu
    let tools_menu = Submenu::new(
        "Tools",
        Menu::new()
            .add_item(CustomMenuItem::new("markers", "🔖 Markers..."))
            .add_item(CustomMenuItem::new("eras", "🌈 Background Sections..."))
            .add_item(CustomMenuItem::new("background", "🎨 Background..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("api", "🔑 API & Webhooks..."))
            .add_native_item(MenuItem::Separator)
            .add_item(CustomMenuItem::new("settings", "⚙ Settings...").accelerator("CmdOrCtrl+,"))
            .add_item(CustomMenuItem::new("shortcuts", "⌨ Keyboard Shortcuts...").accelerator("CmdOrCtrl+/"))
    );

    // Help menu
    let help_menu = Submenu::new(
        "Help",
        Menu::new()
            .add_item(CustomMenuItem::new("help", "Help & Feature Guide").accelerator("F1"))
            .add_item(CustomMenuItem::new("about", "About Timeline"))
    );

    Menu::new()
        .add_submenu(file_menu)
        .add_submenu(edit_menu)
        .add_submenu(view_menu)
        .add_submenu(nav_menu)
        .add_submenu(item_menu)
        .add_submenu(tools_menu)
        .add_submenu(help_menu)
}

pub fn handle_menu_event(event: WindowMenuEvent) {
    let window = event.window();

    // Emit event to frontend
    let _ = window.emit("menu-action", event.menu_item_id());
}
