#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::Emitter;
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_shortcuts(["alt+shift+c", "cmdorcontrol+shift+j"])
                .expect("failed to register global shortcuts")
                .with_handler(|app, _shortcut, event| {
                    use tauri::Emitter;
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state == ShortcutState::Pressed {
                        let _ = app.emit("quick-capture", ());
                        #[cfg(desktop)]
                        {
                            use tauri::Manager;
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::Manager;
                use tauri::tray::{TrayIconBuilder, TrayIconEvent};
                use tauri::WindowEvent;

                let app_handle = app.handle();
                if let Some(main_window) = app_handle.get_webview_window("main") {
                    main_window.clone().on_window_event(move |event| {
                        if let WindowEvent::CloseRequested { api, .. } = event {
                            api.prevent_close();
                            let _ = main_window.hide();
                        }
                    });
                }

                TrayIconBuilder::new()
                    .on_tray_icon_event(move |tray, event| {
                        if let TrayIconEvent::Click { .. } = event {
                            let _ = tray.app_handle().emit("quick-capture", ());
                            if let Some(window) = tray.app_handle().get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    })
                    .icon(
                        app_handle
                            .default_window_icon()
                            .cloned()
                            .expect("missing default window icon"),
                    )
                    .show_menu_on_left_click(false)
                    .build(app)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
