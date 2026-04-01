use serde::Serialize;

#[derive(Clone, Serialize)]
struct OAuthCallbackPayload {
    code: Option<String>,
    state: Option<String>,
    error: Option<String>,
}

#[derive(Serialize)]
struct OAuthStartResponse {
    auth_url: String,
    redirect_uri: String,
}

#[tauri::command]
async fn start_google_oauth(app: tauri::AppHandle, auth_url: String) -> Result<OAuthStartResponse, String> {
    use std::net::TcpListener;
    use std::thread;
    use tauri::Emitter;
    use tiny_http::{Response, Server};
    use url::Url;

    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    drop(listener);

    let redirect_uri = format!("http://127.0.0.1:{port}/oauth/google/callback");
    let auth_url = auth_url.replace("__REDIRECT_URI__", &urlencoding::encode(&redirect_uri));
    let app_handle = app.clone();

    thread::spawn(move || {
        let server = match Server::http(format!("127.0.0.1:{port}")) {
            Ok(server) => server,
            Err(_) => return,
        };

        if let Ok(request) = server.recv() {
            let parsed = Url::parse(&format!("http://localhost{}", request.url())).ok();
            let mut code = None;
            let mut state = None;
            let mut error = None;

            if let Some(url) = parsed {
                for (key, value) in url.query_pairs() {
                    match key.as_ref() {
                        "code" => code = Some(value.into_owned()),
                        "state" => state = Some(value.into_owned()),
                        "error" => error = Some(value.into_owned()),
                        _ => {}
                    }
                }
            }

            let body = if error.is_some() {
                "authorization failed. you can close this window."
            } else {
                "authorization complete. you can close this window and return to slowlife."
            };

            let _ = request.respond(Response::from_string(body));
            let _ = app_handle.emit(
                "google-oauth-callback",
                OAuthCallbackPayload { code, state, error },
            );
        }
    });

    Ok(OAuthStartResponse { auth_url, redirect_uri })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri::Emitter;
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_google_oauth])
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
