// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    // Modo helper de escaneo (solo lectura), lanzado como root por la propia app.
    let args: Vec<String> = std::env::args().collect();
    if args.get(1).map(String::as_str) == Some("--hdi-scan") {
        std::process::exit(healthdiskinfo_lib::scan_helper::main(&args[2..]));
    }
    healthdiskinfo_lib::run();
}
