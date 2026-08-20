use serde::Serialize;
use tiny_http::Header;

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

fn oauth_page_html(title: &str, badge: &str, message: &str, detail: Option<&str>, is_error: bool) -> String {
    let accent = if is_error { "#c46a6a" } else { "#c4956a" };
    let detail_html = detail
        .map(|value| {
            format!(
                r#"<div class="detail">{}</div>"#,
                value
                    .replace('&', "&amp;")
                    .replace('<', "&lt;")
                    .replace('>', "&gt;")
            )
        })
        .unwrap_or_default();

    format!(
        r#"<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <style>
      :root {{
        --bg: #111110;
        --bg-card: #1a1a18;
        --border: #2a2a27;
        --text: #e8e4df;
        --text-dim: #5a5650;
        --accent: {accent};
      }}

      * {{ box-sizing: border-box; }}

      body {{
        margin: 0;
        min-height: 100vh;
        display: grid;
        place-items: center;
        background: var(--bg);
        color: var(--text);
        font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, monospace;
        line-height: 1.5;
        padding: 20px;
      }}

      .card {{
        width: min(560px, 100%);
        background: var(--bg-card);
        border: 1px solid var(--border);
        padding: 24px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.35);
      }}

      .brand {{
        font-size: 0.68rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-dim);
        margin-bottom: 10px;
      }}

      .badge {{
        display: inline-block;
        font-size: 0.62rem;
        border: 1px solid var(--accent);
        color: var(--accent);
        padding: 3px 8px;
        margin-bottom: 14px;
      }}

      h1 {{
        margin: 0 0 10px;
        font-size: 1.1rem;
        font-weight: 600;
      }}

      p {{
        margin: 0;
        color: var(--text);
        font-size: 0.8rem;
      }}

      .hint {{
        margin-top: 14px;
        color: var(--text-dim);
        font-size: 0.68rem;
      }}

      .detail {{
        margin-top: 12px;
        padding: 10px 12px;
        border: 1px solid var(--border);
        color: var(--text-dim);
        font-size: 0.68rem;
        white-space: pre-wrap;
        word-break: break-word;
      }}
    </style>
  </head>
  <body>
    <main class="card">
      <div class="brand">slowlife</div>
      <div class="badge">{badge}</div>
      <h1>{title}</h1>
      <p>{message}</p>
      {detail_html}
      <p class="hint">you can close this tab and return to slowlife.</p>
    </main>
  </body>
</html>"#,
        title = title,
        badge = badge,
        message = message,
        accent = accent,
        detail_html = detail_html,
    )
}

fn oauth_success_html() -> String {
    oauth_page_html(
        "Authorization Complete",
        "google calendar connected",
        "authorization is complete. return to slowlife to choose calendars and finish syncing.",
        None,
        false,
    )
}

fn oauth_error_html(error: Option<&str>) -> String {
    oauth_page_html(
        "Authorization Failed",
        "google calendar failed",
        "authorization did not complete successfully. return to slowlife and try again.",
        error,
        true,
    )
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

            let body = if let Some(error_value) = error.as_deref() {
                oauth_error_html(Some(error_value))
            } else {
                oauth_success_html()
            };

            let response = Response::from_string(body).with_header(
                Header::from_bytes(&b"Content-Type"[..], &b"text/html; charset=utf-8"[..])
                    .expect("failed to create oauth html content-type header"),
            );

            let _ = request.respond(response);
            let _ = app_handle.emit(
                "google-oauth-callback",
                OAuthCallbackPayload { code, state, error },
            );
        }
    });

    Ok(OAuthStartResponse { auth_url, redirect_uri })
}

/// Shortcuts are registered at runtime instead of through the plugin builder so a
/// rejected combination cannot take the whole app down. On Linux the X11 grab fails
/// when another application already owns the combination, and Wayland sessions can
/// refuse it outright.
#[cfg(desktop)]
const GLOBAL_SHORTCUTS: [&str; 2] = ["alt+shift+c", "cmdorcontrol+shift+j"];

#[cfg(desktop)]
fn reveal_main_window(app: &tauri::AppHandle) {
    use tauri::Manager;

    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
    }
}

#[cfg(desktop)]
fn register_global_shortcuts(app: &tauri::AppHandle) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;

    for shortcut in GLOBAL_SHORTCUTS {
        if let Err(error) = app.global_shortcut().register(shortcut) {
            eprintln!("slowlife: global shortcut {shortcut} unavailable: {error}");
        }
    }
}

#[cfg(desktop)]
fn setup_close_to_tray(window: tauri::WebviewWindow) {
    use tauri::WindowEvent;

    window.clone().on_window_event(move |event| {
        // reference: https://github.com/tauri-apps/tauri/issues/10580#issuecomment-2816902942
        if let WindowEvent::CloseRequested { api, .. } = event {
            api.prevent_close();

            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;

                if matches!(window.is_fullscreen(), Ok(true)) {
                    let app_handle = window.app_handle().clone();
                    let window_label = window.label().to_string();

                    let _ = window.set_fullscreen(false);

                    tauri::async_runtime::spawn(async move {
                        std::thread::sleep(std::time::Duration::from_millis(700));
                        if let Some(win) = app_handle.get_webview_window(&window_label) {
                            let _ = win.hide();
                        }
                    });

                    return;
                }
            }

            let _ = window.hide();
        }
    });
}

#[cfg(desktop)]
fn setup_tray(app: &tauri::AppHandle) -> tauri::Result<()> {
    use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
    use tauri::tray::{TrayIconBuilder, TrayIconEvent};
    use tauri::Emitter;

    // Linux tray implementations report clicks inconsistently, so every tray action
    // is reachable from the menu as well.
    let open_item = MenuItem::with_id(app, "open", "Open slowlife", true, None::<&str>)?;
    let capture_item = MenuItem::with_id(app, "quick-capture", "Quick capture", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit slowlife", true, None::<&str>)?;
    let menu = Menu::with_items(
        app,
        &[
            &open_item,
            &capture_item,
            &PredefinedMenuItem::separator(app)?,
            &quit_item,
        ],
    )?;

    TrayIconBuilder::new()
        .menu(&menu)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "open" => reveal_main_window(app),
            "quick-capture" => {
                let _ = app.emit("quick-capture", ());
                reveal_main_window(app);
            }
            "quit" => app.exit(0),
            _ => {}
        })
        .on_tray_icon_event(move |tray, event| {
            if let TrayIconEvent::Click { .. } = event {
                let app = tray.app_handle();
                let _ = app.emit("quick-capture", ());
                reveal_main_window(app);
            }
        })
        .icon(
            app.default_window_icon()
                .cloned()
                .expect("missing default window icon"),
        )
        .show_menu_on_left_click(false)
        .build(app)?;

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![start_google_oauth])
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    use tauri::Emitter;
                    use tauri_plugin_global_shortcut::ShortcutState;
                    if event.state == ShortcutState::Pressed {
                        let _ = app.emit("quick-capture", ());
                        #[cfg(desktop)]
                        reveal_main_window(app);
                    }
                })
                .build(),
        )
        .setup(|app| {
            #[cfg(desktop)]
            {
                use tauri::Manager;

                let app_handle = app.handle();

                register_global_shortcuts(app_handle);

                if let Some(main_window) = app_handle.get_webview_window("main") {
                    setup_close_to_tray(main_window);
                }

                setup_tray(app_handle)?;
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
