//! Autoprueba visual de la app real (solo desarrollo):
//! `HDI_UI_SNAPSHOT_DIR=/ruta HDI_UI_ROUTES="#/devices,#/device/disk0/overview" ./healthdiskinfo`
//! espera a que termine la verificación del entorno, recorre las rutas y guarda una
//! captura PNG del WebView por ruta (WKWebView.takeSnapshot, sin permisos de pantalla).

use std::time::Duration;
use tauri::{AppHandle, Manager};

pub fn spawn(app: &AppHandle) {
    let Ok(dir) = std::env::var("HDI_UI_SNAPSHOT_DIR") else { return };
    let routes = std::env::var("HDI_UI_ROUTES").unwrap_or_else(|_| "#/devices".into());
    let wait: u64 = std::env::var("HDI_UI_WAIT").ok().and_then(|v| v.parse().ok()).unwrap_or(9);
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let _ = std::fs::create_dir_all(&dir);
        tokio::time::sleep(Duration::from_secs(wait)).await;
        let Some(win) = app.get_webview_window("main") else { return };
        for (i, route) in routes.split(',').enumerate() {
            if route.starts_with('#') {
                let _ = win.eval(format!("location.hash = {:?}", route));
            } else if let Some(js) = route.strip_prefix("js:") {
                let _ = win.eval(js);
            }
            tokio::time::sleep(Duration::from_millis(1800)).await;
            let slug: String = route.replace(['#', '/', ':', ' ', '(', ')', '\'', '"', '.', '='], "_").chars().take(60).collect();
            let name = format!("{dir}/{i:02}{slug}.png");
            let (tx, rx) = tokio::sync::oneshot::channel::<Result<(), String>>();
            let path = name.clone();
            let _ = win.with_webview(move |pw| unsafe { macos::snapshot(pw.inner(), path, tx) });
            match tokio::time::timeout(Duration::from_secs(10), rx).await {
                Ok(Ok(Ok(()))) => log::info!("captura: {name}"),
                other => log::error!("captura falló {name}: {other:?}"),
            }
        }
        app.exit(0);
    });
}

#[cfg(target_os = "macos")]
mod macos {
    use block2::RcBlock;
    use objc2_app_kit::{NSBitmapImageFileType, NSBitmapImageRep, NSImage};
    use objc2_foundation::{NSDictionary, NSError};
    use objc2_web_kit::WKWebView;
    use std::sync::Mutex;

    pub unsafe fn snapshot(webview: *mut std::ffi::c_void, path: String, tx: tokio::sync::oneshot::Sender<Result<(), String>>) {
        let wk: &WKWebView = &*(webview as *const WKWebView);
        let tx = Mutex::new(Some(tx));
        let block = RcBlock::new(move |img: *mut NSImage, err: *mut NSError| {
            let r = (|| {
                if img.is_null() {
                    return Err(if err.is_null() { "sin imagen".to_string() } else { (*err).localizedDescription().to_string() });
                }
                let tiff = (*img).TIFFRepresentation().ok_or("sin TIFF")?;
                let rep = NSBitmapImageRep::imageRepWithData(&tiff).ok_or("sin bitmap")?;
                let png = rep.representationUsingType_properties(NSBitmapImageFileType::PNG, &NSDictionary::new()).ok_or("sin PNG")?;
                std::fs::write(&path, png.to_vec()).map_err(|e| e.to_string())
            })();
            if let Some(tx) = tx.lock().unwrap().take() {
                let _ = tx.send(r);
            }
        });
        wk.takeSnapshotWithConfiguration_completionHandler(None, &block);
    }
}

#[cfg(not(target_os = "macos"))]
mod macos {
    pub unsafe fn snapshot(_: *mut std::ffi::c_void, _: String, tx: tokio::sync::oneshot::Sender<Result<(), String>>) {
        let _ = tx.send(Err("solo macOS".into()));
    }
}
