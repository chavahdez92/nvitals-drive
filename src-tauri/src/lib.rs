mod bench;
mod commands;
mod devices;
mod error;
mod inventory;
mod pdf;
mod scan;
pub mod scan_helper;
mod smartctl;
mod store;
#[cfg(debug_assertions)]
mod uitest;
mod watcher;

use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_log::Builder::default().level(log::LevelFilter::Info).build())
        .setup(|app| {
            let db_path = app.path().app_data_dir()?.join("healthdiskinfo.db");
            // Solo en desarrollo: otra base de datos, para probar sin tocar la real.
            #[cfg(debug_assertions)]
            let db_path = std::env::var_os("HDI_DB_PATH").map(std::path::PathBuf::from).unwrap_or(db_path);
            let conn = store::open(&db_path).map_err(|e| e.to_string())?;
            app.manage(scan::ScanState::default());
            app.manage(bench::BenchState::default());
            app.manage(commands::AppState {
                smartctl: Mutex::new(None),
                configured_path: Mutex::new(None),
                known: Mutex::new(Default::default()),
                locks: Mutex::new(Default::default()),
                db: Mutex::new(conn),
            });
            watcher::spawn(app.handle().clone());
            pdf::selftest(app.handle());
            #[cfg(debug_assertions)]
            uitest::spawn(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::env_check,
            commands::list_disks,
            commands::read_disk,
            commands::read_profiler,
            commands::read_temps,
            commands::smartctl_run,
            commands::smartctl_scan,
            commands::selftest_start,
            commands::eject_disk,
            commands::history_add,
            commands::history_all,
            commands::history_clear,
            commands::reports_list,
            commands::reports_add,
            commands::reports_delete,
            commands::save_text_file,
            commands::reveal_in_finder,
            commands::settings_get,
            commands::settings_set,
            pdf::export_pdf,
            commands::ui_log,
            scan::scan_start,
            scan::scan_cancel,
            scan::auth_info,
            scan::open_privacy_settings,
            bench::bench_info,
            bench::bench_run,
            bench::bench_cancel,
            inventory::inventory_list,
            inventory::inventory_get,
            inventory::inventory_latest,
            inventory::inventory_add,
            inventory::inventory_update,
            inventory::inventory_delete,
            inventory::inventory_export_pdf,
            inventory::inventory_save_file,
            inventory::inventory_reveal,
            inventory::inventory_root,
            inventory::inventory_pick_root,
        ])
        .build(tauri::generate_context!())
        .expect("error al iniciar NVitals Drive")
        .run(|app, event| {
            // Si la app se cierra durante un benchmark, fio se detiene y su archivo temporal se borra.
            if let tauri::RunEvent::Exit = event {
                if let Some(b) = app.try_state::<bench::BenchState>() {
                    b.cleanup();
                }
            }
        });
}
