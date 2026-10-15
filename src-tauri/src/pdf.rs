//! Exportación a PDF (plan §9.2).
//!
//! Una ventana oculta carga la plantilla del reporte (report.html, la misma de la vista
//! previa) en modo captura (`capture=1`): se aplican las reglas de impresión del
//! prototipo —cada `.page` mide exactamente una hoja, sin márgenes ni separación—.
//! `createPDF` genera una sola página alta (en px CSS) con texto vectorial y aquí se
//! pagina en hojas Carta/A4 a tamaño físico (96 px CSS = 72 pt).

use std::path::{Path, PathBuf};
use std::time::Duration;
use tauri::{AppHandle, Manager, WebviewUrl, WebviewWindowBuilder};

use crate::error::{AppError, AppResult};

/// Tamaño de la hoja: (ancho, alto) en px CSS (96/in) y en puntos PostScript (72/in).
pub fn paper_size(paper: &str) -> ((f32, f32), (f32, f32)) {
    if paper == "a4" {
        ((793.7008, 1122.5197), (595.2756, 841.8898))
    } else {
        ((816.0, 1056.0), (612.0, 792.0))
    }
}

/// Geometría de la plantilla maquetada, informada por report.html (px CSS).
#[derive(Debug, Clone, serde::Deserialize)]
pub struct Geometry {
    pub nonce: String,
    pub pages: Vec<[f32; 4]>,
}

/// Une las hojas capturadas por separado (un PDF de una página por hoja) en un solo
/// documento Carta/A4. Cada hoja se escala de forma UNIFORME al papel (sin deformarla)
/// y se dibuja como Form XObject, así el texto sigue siendo vectorial.
pub fn compose_sheets(pieces: &[Vec<u8>], paper: &str) -> AppResult<Vec<u8>> {
    use lopdf::{dictionary, Document, Object, Stream};
    let err = |e: lopdf::Error| AppError::Other(format!("PDF: {e}"));
    let (_, (pt_w, pt_h)) = paper_size(paper);
    let mut out = Document::with_version("1.5");
    let pages_id = out.new_object_id();
    let mut kids = Vec::new();
    for bytes in pieces {
        let mut d = Document::load_mem(bytes).map_err(err)?;
        d.renumber_objects_with(out.max_id + 1);
        out.max_id = d.max_id;
        let pid = *d.get_pages().values().next().ok_or_else(|| AppError::Other("hoja vacía".into()))?;
        let page = d.get_object(pid).and_then(Object::as_dict).map_err(err)?.clone();
        let mb = page.get(b"MediaBox").and_then(Object::as_array).map_err(err)?.clone();
        let num = |o: &Object| o.as_float().or_else(|_| o.as_i64().map(|v| v as f32)).unwrap_or(0.0);
        let (x0, y0, x1, y1) = (num(&mb[0]), num(&mb[1]), num(&mb[2]), num(&mb[3]));
        let resources = page.get(b"Resources").cloned().unwrap_or_else(|_| Object::Dictionary(dictionary! {}));
        let content = d.get_page_content(pid);
        if content.is_empty() {
            return Err(AppError::Other("PDF: hoja sin contenido".into()));
        }
        out.objects.extend(d.objects);
        let form = out.add_object(Stream::new(
            dictionary! {
                "Type" => "XObject", "Subtype" => "Form",
                "BBox" => vec![Object::Real(x0), Object::Real(y0), Object::Real(x1), Object::Real(y1)],
                "Resources" => resources,
            },
            content,
        ));
        let (w, h) = (x1 - x0, y1 - y0);
        let s = (pt_w / w).min(pt_h / h);
        let tx = (pt_w - w * s) / 2.0 - x0 * s;
        let ty = pt_h - h * s - y0 * s;
        let ops = format!("q {s} 0 0 {s} {tx} {ty} cm /HdiPage Do Q");
        let cid = out.add_object(Stream::new(dictionary! {}, ops.into_bytes()));
        kids.push(Object::Reference(out.add_object(dictionary! {
            "Type" => "Page", "Parent" => pages_id, "Contents" => cid,
            "MediaBox" => vec![0.into(), 0.into(), Object::Real(pt_w), Object::Real(pt_h)],
            "Resources" => dictionary! { "XObject" => dictionary! { "HdiPage" => form } },
        })));
    }
    if kids.is_empty() {
        return Err(AppError::Other("la plantilla no tiene hojas".into()));
    }
    let n = kids.len() as i64;
    out.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => kids, "Count" => n }));
    let catalog = out.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
    out.trailer.set("Root", catalog);
    out.prune_objects();
    out.compress();
    let mut buf = Vec::new();
    out.save_to(&mut buf).map_err(|e| AppError::Other(format!("PDF: {e}")))?;
    Ok(buf)
}

/// Carga `report.html#<hash>` en una ventana oculta y guarda el PDF en `dest`.
pub async fn print_report(app: &AppHandle, dest: &Path, hash: &str, paper: &str) -> AppResult<()> {
    use tauri::Listener;
    let nonce = std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).map(|d| d.as_nanos()).unwrap_or(0).to_string();
    let label = format!("print-{nonce}");
    let (tx, rx) = tokio::sync::oneshot::channel::<Geometry>();
    let tx = std::sync::Mutex::new(Some(tx));
    let want = nonce.clone();
    let listener = app.listen("report-ready", move |ev| {
        if let Ok(geo) = serde_json::from_str::<Geometry>(ev.payload()) {
            if geo.nonce == want {
                if let Some(tx) = tx.lock().unwrap().take() {
                    let _ = tx.send(geo);
                }
            }
        }
    });
    let url = WebviewUrl::App(PathBuf::from(format!("report.html#{hash}&capture=1&nonce={nonce}")));
    let win = WebviewWindowBuilder::new(app, &label, url)
        .title("Reporte")
        .visible(false)
        .inner_size(1100.0, 1400.0)
        .build()
        .map_err(|e| AppError::Other(format!("no se pudo abrir la ventana de impresión: {e}")))?;

    let result = async {
        let geo = tokio::time::timeout(Duration::from_secs(20), rx)
            .await
            .map_err(|_| AppError::Timeout("maquetación de la plantilla del reporte".into()))?
            .map_err(|_| AppError::Other("la plantilla no respondió".into()))?;
        // Una captura por hoja, con el rectángulo exacto de cada .page (coordenadas de página).
        let mut pieces = Vec::with_capacity(geo.pages.len());
        for [x, y, w, h] in geo.pages.clone() {
            let (done_tx, done_rx) = tokio::sync::oneshot::channel::<Result<Vec<u8>, String>>();
            win.with_webview(move |pw| unsafe { macos::create_pdf(pw.inner(), (x, y, w, h), done_tx) })
                .map_err(|e| AppError::Other(e.to_string()))?;
            let bytes = tokio::time::timeout(Duration::from_secs(30), done_rx)
                .await
                .map_err(|_| AppError::Timeout("generación del PDF".into()))?
                .map_err(|_| AppError::Other("WebKit no respondió".into()))?
                .map_err(AppError::Other)?;
            pieces.push(bytes);
        }
        if let Ok(raw) = std::env::var("HDI_PDF_RAW") {
            let _ = std::fs::write(raw, &pieces[0]);
        }
        log::info!("PDF: {} hojas capturadas · geometría {:?}", pieces.len(), geo.pages);
        let pdf = compose_sheets(&pieces, paper)?;
        tokio::fs::write(dest, pdf).await?;
        Ok::<(), AppError>(())
    }
    .await;
    app.unlisten(listener);
    let _ = win.close();
    result
}

#[tauri::command]
pub async fn export_pdf(app: AppHandle, file_name: String, hash: String, paper: String) -> AppResult<Option<String>> {
    let Some(dest) = crate::commands::pick_save_path(&app, &file_name, "pdf") else { return Ok(None) };
    print_report(&app, &dest, &hash, &paper).await?;
    Ok(Some(dest.display().to_string()))
}

/// Autoprueba sin interfaz (spike de la Fase 0):
/// `HDI_PDF_SELFTEST=/ruta/salida.pdf [HDI_PDF_PAPER=a4] [HDI_PDF_KIND=quick|batch] ./healthdiskinfo`
/// imprime el reporte de ejemplo del disco disk5 (o, con `batch`, el reporte de varios
/// discos guardado en la plantilla, o el de ejemplo) y cierra la app.
pub fn selftest(app: &AppHandle) {
    let Ok(dest) = std::env::var("HDI_PDF_SELFTEST") else { return };
    let app = app.clone();
    tauri::async_runtime::spawn(async move {
        let paper = std::env::var("HDI_PDF_PAPER").unwrap_or_else(|_| "letter".into());
        let kind = match std::env::var("HDI_PDF_KIND").as_deref() {
            Ok("quick") => "quick",
            Ok("batch") => "batch",
            _ => "full",
        };
        let disk = std::env::var("HDI_PDF_DISK").ok().filter(|d| crate::smartctl::valid_disk_id(d)).unwrap_or_else(|| "disk5".into());
        let hash = format!("disk={disk}&paper={paper}&kind={kind}");
        match print_report(&app, Path::new(&dest), &hash, &paper).await {
            Ok(()) => log::info!("PDF selftest OK: {dest}"),
            Err(e) => log::error!("PDF selftest falló: {e}"),
        }
        if let Some(w) = app.get_webview_window("main") {
            let _ = w.close();
        }
        app.exit(0);
    });
}

#[cfg(target_os = "macos")]
mod macos {
    use block2::RcBlock;
    use objc2_core_foundation::{CGPoint, CGRect, CGSize};
    use objc2_foundation::{NSData, NSError};
    use objc2_web_kit::{WKPDFConfiguration, WKWebView};
    use std::sync::Mutex;

    pub unsafe fn create_pdf(
        webview: *mut std::ffi::c_void,
        rect: (f32, f32, f32, f32),
        tx: tokio::sync::oneshot::Sender<Result<Vec<u8>, String>>,
    ) {
        let wk: &WKWebView = &*(webview as *const WKWebView);
        let mtm = objc2::MainThreadMarker::new_unchecked();
        let conf = WKPDFConfiguration::new(mtm);
        let (x, y, w, h) = rect;
        conf.setRect(CGRect::new(CGPoint::new(x as f64, y as f64), CGSize::new(w as f64, h as f64)));
        let tx = Mutex::new(Some(tx));
        let block = RcBlock::new(move |data: *mut NSData, err: *mut NSError| {
            let r = if !data.is_null() {
                Ok((*data).to_vec())
            } else if !err.is_null() {
                Err((*err).localizedDescription().to_string())
            } else {
                Err("createPDF sin datos".to_string())
            };
            if let Some(tx) = tx.lock().unwrap().take() {
                let _ = tx.send(r);
            }
        });
        wk.createPDFWithConfiguration_completionHandler(Some(&conf), &block);
    }
}

#[cfg(not(target_os = "macos"))]
mod macos {
    pub unsafe fn create_pdf(_: *mut std::ffi::c_void, _: (f32, f32, f32, f32), tx: tokio::sync::oneshot::Sender<Result<Vec<u8>, String>>) {
        let _ = tx.send(Err("exportación PDF solo disponible en macOS".into()));
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn one_page_pdf(w: f32, h: f32) -> Vec<u8> {
        use lopdf::content::{Content, Operation};
        use lopdf::{dictionary, Document, Object, Stream};
        let mut doc = Document::with_version("1.5");
        let pages_id = doc.new_object_id();
        let content =
            Content { operations: vec![Operation::new("re", vec![0.into(), 0.into(), 10.into(), 10.into()]), Operation::new("f", vec![])] };
        let content_id = doc.add_object(Stream::new(dictionary! {}, content.encode().unwrap()));
        let page_id = doc.add_object(dictionary! {
            "Type" => "Page", "Parent" => pages_id, "Contents" => content_id,
            "MediaBox" => vec![0.into(), 0.into(), Object::Real(w), Object::Real(h)],
        });
        doc.objects.insert(pages_id, Object::Dictionary(dictionary! { "Type" => "Pages", "Kids" => vec![page_id.into()], "Count" => 1 }));
        let catalog = doc.add_object(dictionary! { "Type" => "Catalog", "Pages" => pages_id });
        doc.trailer.set("Root", catalog);
        let mut bytes = Vec::new();
        doc.save_to(&mut bytes).unwrap();
        bytes
    }

    #[test]
    fn composes_sheets_into_letter_pages() {
        use lopdf::{Document, Object};
        let pieces = vec![one_page_pdf(816.0, 1056.0), one_page_pdf(612.0, 792.0), one_page_pdf(700.0, 900.0)];
        let out = compose_sheets(&pieces, "letter").unwrap();
        let doc = Document::load_mem(&out).unwrap();
        let pages = doc.get_pages();
        assert_eq!(pages.len(), 3);
        for id in pages.values() {
            let mb = doc.get_object(*id).unwrap().as_dict().unwrap().get(b"MediaBox").unwrap().as_array().unwrap().clone();
            let v: Vec<f32> = mb.iter().map(|o: &Object| o.as_float().or_else(|_| o.as_i64().map(|x| x as f32)).unwrap()).collect();
            assert_eq!((v[2], v[3]), (612.0, 792.0));
        }
    }
}
