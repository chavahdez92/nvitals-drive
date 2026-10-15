# Avisos de terceros

NVitals Drive se distribuye bajo `MIT OR Apache-2.0` (ver `LICENSE-MIT` y `LICENSE-APACHE`).
Este archivo lista el software de terceros que se compila dentro de la app. Se genera con
`scripts/third-party-notices.mjs`; no lo edites a mano.

## Programas externos (no se incluyen en la app)

La app ejecuta estos programas como procesos aparte si están instalados en el equipo. No se enlazan
ni se distribuyen con ella.

| Programa | Uso | Licencia | Código fuente |
|---|---|---|---|
| smartmontools (`smartctl`) | Lectura de datos SMART | GPL-2.0-or-later | https://github.com/smartmontools/smartmontools |
| fio | Benchmark de lectura y escritura | GPL-2.0 | https://github.com/axboe/fio |

## Dependencias de npm (interfaz) — 7

| Paquete | Licencia |
|---|---|
| [@tauri-apps/api](https://github.com/tauri-apps/tauri#readme) | Apache-2.0 OR MIT |
| [@tauri-apps/plugin-dialog](https://github.com/tauri-apps/plugins-workspace#readme) | MIT OR Apache-2.0 |
| [@tauri-apps/plugin-notification](https://github.com/tauri-apps/plugins-workspace#readme) | MIT OR Apache-2.0 |
| [@tauri-apps/plugin-opener](https://github.com/tauri-apps/plugins-workspace#readme) | MIT OR Apache-2.0 |
| [react](https://react.dev/) | MIT |
| [react-dom](https://react.dev/) | MIT |
| [scheduler](https://react.dev/) | MIT |

## Crates de Rust (núcleo) — 482

Incluye las dependencias de todas las plataformas (macOS, Windows y Linux).

| Paquete | Licencia |
|---|---|
| [adler2](https://github.com/oyvindln/adler2) | 0BSD OR MIT OR Apache-2.0 |
| [aes](https://github.com/RustCrypto/block-ciphers) | MIT OR Apache-2.0 |
| [aho-corasick](https://github.com/BurntSushi/aho-corasick) | Unlicense OR MIT |
| [alloc-no-stdlib](https://github.com/dropbox/rust-alloc-no-stdlib) | BSD-3-Clause |
| [alloc-stdlib](https://github.com/dropbox/rust-alloc-no-stdlib) | BSD-3-Clause |
| [android_log-sys](https://github.com/rust-mobile/android_log-sys-rs) | MIT OR Apache-2.0 |
| [android_logger](https://github.com/rust-mobile/android_logger-rs) | MIT OR Apache-2.0 |
| [android_system_properties](https://github.com/nical/android_system_properties) | MIT OR Apache-2.0 |
| [anyhow](https://github.com/dtolnay/anyhow) | MIT OR Apache-2.0 |
| [async-broadcast](https://github.com/smol-rs/async-broadcast) | MIT OR Apache-2.0 |
| [async-channel](https://github.com/smol-rs/async-channel) | Apache-2.0 OR MIT |
| [async-executor](https://github.com/smol-rs/async-executor) | Apache-2.0 OR MIT |
| [async-io](https://github.com/smol-rs/async-io) | Apache-2.0 OR MIT |
| [async-lock](https://github.com/smol-rs/async-lock) | Apache-2.0 OR MIT |
| [async-process](https://github.com/smol-rs/async-process) | Apache-2.0 OR MIT |
| [async-recursion](https://github.com/dcchut/async-recursion) | MIT OR Apache-2.0 |
| [async-signal](https://github.com/smol-rs/async-signal) | Apache-2.0 OR MIT |
| [async-task](https://github.com/smol-rs/async-task) | Apache-2.0 OR MIT |
| [async-trait](https://github.com/dtolnay/async-trait) | MIT OR Apache-2.0 |
| [atk](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [atk-sys](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [atomic-waker](https://github.com/smol-rs/atomic-waker) | Apache-2.0 OR MIT |
| [autocfg](https://github.com/cuviper/autocfg) | Apache-2.0 OR MIT |
| [base64](https://github.com/marshallpierce/rust-base64) | MIT OR Apache-2.0 |
| [bit-set](https://github.com/contain-rs/bit-set) | Apache-2.0 OR MIT |
| [bit-vec](https://github.com/contain-rs/bit-vec) | Apache-2.0 OR MIT |
| [bitflags](https://github.com/bitflags/bitflags) | MIT/Apache-2.0 |
| [bitflags](https://github.com/bitflags/bitflags) | MIT OR Apache-2.0 |
| [block-buffer](https://github.com/RustCrypto/utils) | MIT OR Apache-2.0 |
| [block-padding](https://github.com/RustCrypto/utils) | MIT OR Apache-2.0 |
| [block2](https://github.com/madsmtm/objc2) | MIT |
| [blocking](https://github.com/smol-rs/blocking) | Apache-2.0 OR MIT |
| [brotli](https://github.com/dropbox/rust-brotli) | BSD-3-Clause AND MIT |
| [brotli-decompressor](https://github.com/dropbox/rust-brotli-decompressor) | BSD-3-Clause/MIT |
| [bs58](https://github.com/Nullus157/bs58-rs) | MIT/Apache-2.0 |
| [bumpalo](https://github.com/fitzgen/bumpalo) | MIT OR Apache-2.0 |
| [bytemuck](https://github.com/Lokathor/bytemuck) | Zlib OR Apache-2.0 OR MIT |
| [byteorder](https://github.com/BurntSushi/byteorder) | Unlicense OR MIT |
| [bytes](https://github.com/tokio-rs/bytes) | MIT |
| [cairo-rs](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [cairo-sys-rs](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [camino](https://github.com/camino-rs/camino) | MIT OR Apache-2.0 |
| [cargo_metadata](https://github.com/oli-obk/cargo_metadata) | MIT |
| [cargo_toml](https://gitlab.com/lib.rs/cargo_toml) | Apache-2.0 OR MIT |
| [cargo-platform](https://github.com/rust-lang/cargo) | MIT OR Apache-2.0 |
| [cbc](https://github.com/RustCrypto/block-modes) | MIT OR Apache-2.0 |
| [cc](https://github.com/rust-lang/cc-rs) | MIT OR Apache-2.0 |
| [cesu8](https://github.com/emk/cesu8-rs) | Apache-2.0/MIT |
| [cfb](https://github.com/mdsteele/rust-cfb) | MIT |
| [cfg-expr](https://github.com/EmbarkStudios/cfg-expr) | MIT OR Apache-2.0 |
| [cfg-if](https://github.com/rust-lang/cfg-if) | MIT OR Apache-2.0 |
| [chacha20](https://github.com/RustCrypto/stream-ciphers) | MIT OR Apache-2.0 |
| [chrono](https://github.com/chronotope/chrono) | MIT OR Apache-2.0 |
| [cipher](https://github.com/RustCrypto/traits) | MIT OR Apache-2.0 |
| [combine](https://github.com/Marwes/combine) | MIT |
| [concurrent-queue](https://github.com/smol-rs/concurrent-queue) | Apache-2.0 OR MIT |
| [cookie](https://github.com/SergioBenitez/cookie-rs) | MIT OR Apache-2.0 |
| [core_detect](https://github.com/thomcc/core_detect) | MIT/Apache-2.0 |
| [core-foundation](https://github.com/servo/core-foundation-rs) | MIT OR Apache-2.0 |
| [core-foundation-sys](https://github.com/servo/core-foundation-rs) | MIT OR Apache-2.0 |
| [core-graphics](https://github.com/servo/core-foundation-rs) | MIT OR Apache-2.0 |
| [core-graphics-types](https://github.com/servo/core-foundation-rs) | MIT OR Apache-2.0 |
| [cpufeatures](https://github.com/RustCrypto/utils) | MIT OR Apache-2.0 |
| [crc32fast](https://github.com/srijs/rust-crc32fast) | MIT OR Apache-2.0 |
| [crossbeam-channel](https://github.com/crossbeam-rs/crossbeam) | MIT OR Apache-2.0 |
| [crossbeam-deque](https://github.com/crossbeam-rs/crossbeam) | MIT OR Apache-2.0 |
| [crossbeam-epoch](https://github.com/crossbeam-rs/crossbeam) | MIT OR Apache-2.0 |
| [crossbeam-utils](https://github.com/crossbeam-rs/crossbeam) | MIT OR Apache-2.0 |
| [crypto-common](https://github.com/RustCrypto/traits) | MIT OR Apache-2.0 |
| [cssparser](https://github.com/servo/rust-cssparser) | MPL-2.0 |
| [cssparser-macros](https://github.com/servo/rust-cssparser) | MPL-2.0 |
| [ctor](https://github.com/mmastrac/linktime) | Apache-2.0 OR MIT |
| [darling](https://github.com/TedDriggs/darling) | MIT |
| [darling_core](https://github.com/TedDriggs/darling) | MIT |
| [darling_macro](https://github.com/TedDriggs/darling) | MIT |
| [dbus](https://github.com/diwic/dbus-rs) | Apache-2.0/MIT |
| [defmt](https://github.com/knurling-rs/defmt) | MIT OR Apache-2.0 |
| [defmt-macros](https://github.com/knurling-rs/defmt) | MIT OR Apache-2.0 |
| [defmt-parser](https://github.com/knurling-rs/defmt) | MIT OR Apache-2.0 |
| [deranged](https://github.com/jhpratt/deranged) | MIT OR Apache-2.0 |
| [derive_more](https://github.com/JelteF/derive_more) | MIT |
| [derive_more-impl](https://github.com/JelteF/derive_more) | MIT |
| [digest](https://github.com/RustCrypto/traits) | MIT OR Apache-2.0 |
| [dirs](https://codeberg.org/dirs/dirs-rs) | MIT OR Apache-2.0 |
| [dirs-sys](https://github.com/dirs-dev/dirs-sys-rs) | MIT OR Apache-2.0 |
| [dispatch2](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [displaydoc](https://github.com/yaahc/displaydoc) | MIT OR Apache-2.0 |
| [dlopen2](https://github.com/OpenByteDev/dlopen2) | MIT |
| [dlopen2_derive](https://github.com/OpenByteDev/dlopen2) | MIT |
| [dom_query](https://github.com/niklak/dom_query) | MIT |
| [dpi](https://github.com/rust-windowing/winit) | Apache-2.0 AND MIT |
| [dtoa](https://github.com/dtolnay/dtoa) | MIT OR Apache-2.0 |
| [dtoa-short](https://github.com/upsuper/dtoa-short) | MPL-2.0 |
| [dunce](https://gitlab.com/kornelski/dunce) | CC0-1.0 OR MIT-0 OR Apache-2.0 |
| [dyn-clone](https://github.com/dtolnay/dyn-clone) | MIT OR Apache-2.0 |
| [ecb](https://github.com/magic-akari/ecb) | MIT |
| [either](https://github.com/rayon-rs/either) | MIT OR Apache-2.0 |
| [embed_plist](https://github.com/nvzqz/embed-plist-rs) | MIT OR Apache-2.0 |
| [embed-resource](https://github.com/nabijaczleweli/rust-embed-resource) | MIT |
| [encoding_rs](https://github.com/hsivonen/encoding_rs) | (Apache-2.0 OR MIT) AND BSD-3-Clause |
| [endi](https://github.com/zeenix/endi) | MIT |
| [enumflags2](https://github.com/meithecatte/enumflags2) | MIT OR Apache-2.0 |
| [enumflags2_derive](https://github.com/meithecatte/enumflags2) | MIT OR Apache-2.0 |
| [env_filter](https://github.com/rust-cli/env_logger) | MIT OR Apache-2.0 |
| [equivalent](https://github.com/indexmap-rs/equivalent) | Apache-2.0 OR MIT |
| [erased-serde](https://github.com/dtolnay/erased-serde) | MIT OR Apache-2.0 |
| [errno](https://github.com/lambda-fairy/rust-errno) | MIT OR Apache-2.0 |
| [event-listener](https://github.com/smol-rs/event-listener) | Apache-2.0 OR MIT |
| [event-listener-strategy](https://github.com/smol-rs/event-listener-strategy) | Apache-2.0 OR MIT |
| [fallible-iterator](https://github.com/sfackler/rust-fallible-iterator) | MIT/Apache-2.0 |
| [fallible-streaming-iterator](https://github.com/sfackler/fallible-streaming-iterator) | MIT/Apache-2.0 |
| [fastrand](https://github.com/smol-rs/fastrand) | Apache-2.0 OR MIT |
| [fdeflate](https://github.com/image-rs/fdeflate) | MIT OR Apache-2.0 |
| [fern](https://github.com/daboross/fern) | MIT |
| [field-offset](https://github.com/Diggsey/rust-field-offset) | MIT OR Apache-2.0 |
| [find-msvc-tools](https://github.com/rust-lang/cc-rs) | MIT OR Apache-2.0 |
| [flate2](https://github.com/rust-lang/flate2-rs) | MIT OR Apache-2.0 |
| [fnv](https://github.com/servo/rust-fnv) | Apache-2.0 / MIT |
| [foldhash](https://github.com/orlp/foldhash) | Zlib |
| [foreign-types](https://github.com/sfackler/foreign-types) | MIT/Apache-2.0 |
| [foreign-types-macros](https://github.com/sfackler/foreign-types) | MIT/Apache-2.0 |
| [foreign-types-shared](https://github.com/sfackler/foreign-types) | MIT/Apache-2.0 |
| [form_urlencoded](https://github.com/servo/rust-url) | MIT OR Apache-2.0 |
| [futures-channel](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-core](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-executor](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-io](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-lite](https://github.com/smol-rs/futures-lite) | Apache-2.0 OR MIT |
| [futures-macro](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-sink](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-task](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [futures-util](https://github.com/rust-lang/futures-rs) | MIT OR Apache-2.0 |
| [gdk](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [gdk-pixbuf](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [gdk-pixbuf-sys](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [gdk-sys](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [gdkwayland-sys](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [gdkx11](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [gdkx11-sys](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [generic-array](https://github.com/fizyk20/generic-array.git) | MIT |
| [getrandom](https://github.com/rust-random/getrandom) | MIT OR Apache-2.0 |
| [gio](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [gio-sys](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [glib](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [glib-macros](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [glib-sys](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [glob](https://github.com/rust-lang/glob) | MIT OR Apache-2.0 |
| [gobject-sys](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [gtk](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [gtk-sys](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [gtk3-macros](https://github.com/gtk-rs/gtk3-rs) | MIT |
| [hashbrown](https://github.com/rust-lang/hashbrown) | MIT OR Apache-2.0 |
| [hashlink](https://github.com/djc/hashlink) | MIT OR Apache-2.0 |
| [heck](https://github.com/withoutboats/heck) | MIT OR Apache-2.0 |
| [hermit-abi](https://github.com/hermit-os/hermit-rs) | MIT OR Apache-2.0 |
| [hex](https://github.com/KokaKiwi/rust-hex) | MIT OR Apache-2.0 |
| [html5ever](https://github.com/servo/html5ever) | MIT OR Apache-2.0 |
| [http](https://github.com/hyperium/http) | MIT OR Apache-2.0 |
| [http-body](https://github.com/hyperium/http-body) | MIT |
| [http-body-util](https://github.com/hyperium/http-body) | MIT |
| [httparse](https://github.com/seanmonstar/httparse) | MIT OR Apache-2.0 |
| [hyper](https://github.com/hyperium/hyper) | MIT |
| [hyper-util](https://github.com/hyperium/hyper-util) | MIT |
| [iana-time-zone](https://github.com/strawlab/iana-time-zone) | MIT OR Apache-2.0 |
| [iana-time-zone-haiku](https://github.com/strawlab/iana-time-zone) | MIT OR Apache-2.0 |
| [ico](https://github.com/mdsteele/rust-ico) | MIT |
| [icu_collections](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [icu_locale_core](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [icu_normalizer](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [icu_normalizer_data](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [icu_properties](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [icu_properties_data](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [icu_provider](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [ident_case](https://github.com/TedDriggs/ident_case) | MIT/Apache-2.0 |
| [idna](https://github.com/servo/rust-url/) | MIT OR Apache-2.0 |
| [idna_adapter](https://github.com/hsivonen/idna_adapter) | Apache-2.0 OR MIT |
| [indexmap](https://github.com/indexmap-rs/indexmap) | Apache-2.0 OR MIT |
| [infer](https://github.com/bojand/infer) | MIT |
| [inout](https://github.com/RustCrypto/utils) | MIT OR Apache-2.0 |
| [ipnet](https://github.com/krisprice/ipnet) | MIT OR Apache-2.0 |
| [is-docker](https://github.com/TheLarkInn/is-docker) | MIT |
| [is-wsl](https://github.com/TheLarkInn/is-wsl) | MIT |
| [itoa](https://github.com/dtolnay/itoa) | MIT OR Apache-2.0 |
| [javascriptcore-rs](https://github.com/tauri-apps/javascriptcore-rs) | MIT |
| [javascriptcore-rs-sys](https://github.com/tauri-apps/javascriptcore-rs) | MIT |
| [jiff](https://github.com/BurntSushi/jiff) | Unlicense OR MIT |
| [jiff-core](https://github.com/BurntSushi/jiff) | Unlicense OR MIT |
| [jiff-static](https://github.com/BurntSushi/jiff) | Unlicense OR MIT |
| [jiff-tzdb](https://github.com/BurntSushi/jiff) | Unlicense OR MIT |
| [jiff-tzdb-platform](https://github.com/BurntSushi/jiff) | Unlicense OR MIT |
| [jni](https://github.com/jni-rs/jni-rs) | MIT/Apache-2.0 |
| [jni-sys](https://github.com/jni-rs/jni-sys) | MIT OR Apache-2.0 |
| [jni-sys-macros](https://github.com/jni-rs/jni-sys) | MIT OR Apache-2.0 |
| [js-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/js-sys) | MIT OR Apache-2.0 |
| [json-patch](https://github.com/idubrov/json-patch) | MIT/Apache-2.0 |
| [jsonptr](https://github.com/chanced/jsonptr) | MIT OR Apache-2.0 |
| [keyboard-types](https://github.com/rust-windowing/keyboard-types) | MIT OR Apache-2.0 |
| libappindicator | Apache-2.0 OR MIT |
| libappindicator-sys | Apache-2.0 OR MIT |
| [libc](https://github.com/rust-lang/libc) | MIT OR Apache-2.0 |
| [libdbus-sys](https://github.com/diwic/dbus-rs) | Apache-2.0/MIT |
| [libloading](https://github.com/nagisa/rust_libloading/) | ISC |
| [libredox](https://gitlab.redox-os.org/redox-os/libredox.git) | MIT |
| [libsqlite3-sys](https://github.com/rusqlite/rusqlite) | MIT |
| [linux-raw-sys](https://github.com/sunfishcode/linux-raw-sys) | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| [litemap](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [lock_api](https://github.com/Amanieu/parking_lot) | MIT OR Apache-2.0 |
| [log](https://github.com/rust-lang/log) | MIT OR Apache-2.0 |
| [lopdf](https://github.com/J-F-Liu/lopdf.git) | MIT |
| [mac-notification-sys](https://github.com/h4llow3En/mac-notification-sys) | MIT/Apache-2.0 |
| [markup5ever](https://github.com/servo/html5ever) | MIT OR Apache-2.0 |
| [md-5](https://github.com/RustCrypto/hashes) | MIT OR Apache-2.0 |
| [memchr](https://github.com/BurntSushi/memchr) | Unlicense OR MIT |
| [memoffset](https://github.com/Gilnaa/memoffset) | MIT |
| [mime](https://github.com/hyperium/mime) | MIT OR Apache-2.0 |
| [miniz_oxide](https://github.com/Frommi/miniz_oxide/tree/master/miniz_oxide) | MIT OR Zlib OR Apache-2.0 |
| [mio](https://github.com/tokio-rs/mio) | MIT |
| [muda](https://github.com/tauri-apps/muda) | Apache-2.0 OR MIT |
| [multiversion_no_op](https://github.com/hsivonen/multiversion_no_op) | Apache-2.0 OR MIT |
| [ndk](https://github.com/rust-mobile/ndk) | MIT OR Apache-2.0 |
| [ndk-context](https://github.com/rust-windowing/android-ndk-rs) | MIT OR Apache-2.0 |
| [ndk-sys](https://github.com/rust-mobile/ndk) | MIT OR Apache-2.0 |
| [new_debug_unreachable](https://github.com/mbrubeck/rust-debug-unreachable) | MIT |
| [nom](https://github.com/rust-bakery/nom) | MIT |
| [notify-rust](https://github.com/hoodie/notify-rust) | MIT OR Apache-2.0 |
| [num_enum](https://github.com/illicitonion/num_enum) | BSD-3-Clause OR MIT OR Apache-2.0 |
| [num_enum_derive](https://github.com/illicitonion/num_enum) | BSD-3-Clause OR MIT OR Apache-2.0 |
| [num_threads](https://github.com/jhpratt/num_threads) | MIT OR Apache-2.0 |
| [num-conv](https://github.com/jhpratt/num-conv) | MIT OR Apache-2.0 |
| [num-traits](https://github.com/rust-num/num-traits) | MIT OR Apache-2.0 |
| [objc2](https://github.com/madsmtm/objc2) | MIT |
| [objc2-app-kit](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-cloud-kit](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-data](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-foundation](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-graphics](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-image](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-location](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-text](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-core-video](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-encode](https://github.com/madsmtm/objc2) | MIT |
| [objc2-exception-helper](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-foundation](https://github.com/madsmtm/objc2) | MIT |
| [objc2-io-surface](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-javascript-core](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-quartz-core](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-security](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-ui-kit](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-user-notifications](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [objc2-web-kit](https://github.com/madsmtm/objc2) | Zlib OR Apache-2.0 OR MIT |
| [once_cell](https://github.com/matklad/once_cell) | MIT OR Apache-2.0 |
| [open](https://github.com/Byron/open-rs) | MIT |
| [option-ext](https://github.com/soc/option-ext.git) | MPL-2.0 |
| [ordered-stream](https://github.com/danieldg/ordered-stream) | MIT OR Apache-2.0 |
| [pango](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [pango-sys](https://github.com/gtk-rs/gtk-rs-core) | MIT |
| [parking](https://github.com/smol-rs/parking) | Apache-2.0 OR MIT |
| [parking_lot](https://github.com/Amanieu/parking_lot) | MIT OR Apache-2.0 |
| [parking_lot_core](https://github.com/Amanieu/parking_lot) | MIT OR Apache-2.0 |
| [percent-encoding](https://github.com/servo/rust-url/) | MIT OR Apache-2.0 |
| [phf](https://github.com/rust-phf/rust-phf) | MIT |
| [phf_codegen](https://github.com/rust-phf/rust-phf) | MIT |
| [phf_generator](https://github.com/rust-phf/rust-phf) | MIT |
| [phf_macros](https://github.com/rust-phf/rust-phf) | MIT |
| [phf_shared](https://github.com/rust-phf/rust-phf) | MIT |
| [pin-project-lite](https://github.com/taiki-e/pin-project-lite) | Apache-2.0 OR MIT |
| [piper](https://github.com/smol-rs/piper) | MIT OR Apache-2.0 |
| [pkg-config](https://github.com/rust-lang/pkg-config-rs) | MIT OR Apache-2.0 |
| [plist](https://github.com/ebarnard/rust-plist/) | MIT |
| [png](https://github.com/image-rs/image-png) | MIT OR Apache-2.0 |
| [polling](https://github.com/smol-rs/polling) | Apache-2.0 OR MIT |
| [portable-atomic](https://github.com/taiki-e/portable-atomic) | Apache-2.0 OR MIT |
| [portable-atomic-util](https://github.com/taiki-e/portable-atomic-util) | Apache-2.0 OR MIT |
| [potential_utf](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [powerfmt](https://github.com/jhpratt/powerfmt) | MIT OR Apache-2.0 |
| [ppv-lite86](https://github.com/cryptocorrosion/cryptocorrosion) | MIT OR Apache-2.0 |
| [precomputed-hash](https://github.com/emilio/precomputed-hash) | MIT |
| [proc-macro-crate](https://github.com/bkchr/proc-macro-crate) | MIT OR Apache-2.0 |
| [proc-macro-error](https://gitlab.com/CreepySkeleton/proc-macro-error) | MIT OR Apache-2.0 |
| [proc-macro-error-attr](https://gitlab.com/CreepySkeleton/proc-macro-error) | MIT OR Apache-2.0 |
| [proc-macro2](https://github.com/dtolnay/proc-macro2) | MIT OR Apache-2.0 |
| [quick-xml](https://github.com/tafia/quick-xml) | MIT |
| [quote](https://github.com/dtolnay/quote) | MIT OR Apache-2.0 |
| [r-efi](https://github.com/r-efi/r-efi) | MIT OR Apache-2.0 OR LGPL-2.1-or-later |
| [rand](https://github.com/rust-random/rand) | MIT OR Apache-2.0 |
| [rand_chacha](https://github.com/rust-random/rand) | MIT OR Apache-2.0 |
| [rand_core](https://github.com/rust-random/rand) | MIT OR Apache-2.0 |
| [rangemap](https://github.com/jeffparsons/rangemap) | MIT/Apache-2.0 |
| [raw-window-handle](https://github.com/rust-windowing/raw-window-handle) | MIT OR Apache-2.0 OR Zlib |
| [rayon](https://github.com/rayon-rs/rayon) | MIT OR Apache-2.0 |
| [rayon-core](https://github.com/rayon-rs/rayon) | MIT OR Apache-2.0 |
| [redox_syscall](https://gitlab.redox-os.org/redox-os/syscall) | MIT |
| [redox_users](https://gitlab.redox-os.org/redox-os/users) | MIT |
| [ref-cast](https://github.com/dtolnay/ref-cast) | MIT OR Apache-2.0 |
| [ref-cast-impl](https://github.com/dtolnay/ref-cast) | MIT OR Apache-2.0 |
| [regex](https://github.com/rust-lang/regex) | MIT OR Apache-2.0 |
| [regex-automata](https://github.com/rust-lang/regex) | MIT OR Apache-2.0 |
| [regex-syntax](https://github.com/rust-lang/regex) | MIT OR Apache-2.0 |
| [reqwest](https://github.com/seanmonstar/reqwest) | MIT OR Apache-2.0 |
| [rfd](https://github.com/PolyMeilex/rfd) | MIT |
| rsqlite-vfs | MIT |
| [rusqlite](https://github.com/rusqlite/rusqlite) | MIT |
| [rustc_version](https://github.com/djc/rustc-version-rs) | MIT OR Apache-2.0 |
| [rustc-hash](https://github.com/rust-lang/rustc-hash) | Apache-2.0 OR MIT |
| [rustix](https://github.com/bytecodealliance/rustix) | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| [rustversion](https://github.com/dtolnay/rustversion) | MIT OR Apache-2.0 |
| [same-file](https://github.com/BurntSushi/same-file) | Unlicense/MIT |
| [schemars](https://github.com/GREsau/schemars) | MIT |
| [schemars_derive](https://github.com/GREsau/schemars) | MIT |
| [scopeguard](https://github.com/bluss/scopeguard) | MIT OR Apache-2.0 |
| [selectors](https://github.com/servo/stylo) | MPL-2.0 |
| [semver](https://github.com/dtolnay/semver) | MIT OR Apache-2.0 |
| [serde](https://github.com/serde-rs/serde) | MIT OR Apache-2.0 |
| [serde_core](https://github.com/serde-rs/serde) | MIT OR Apache-2.0 |
| [serde_derive](https://github.com/serde-rs/serde) | MIT OR Apache-2.0 |
| [serde_derive_internals](https://github.com/serde-rs/serde) | MIT OR Apache-2.0 |
| [serde_json](https://github.com/serde-rs/json) | MIT OR Apache-2.0 |
| [serde_repr](https://github.com/dtolnay/serde-repr) | MIT OR Apache-2.0 |
| [serde_spanned](https://github.com/toml-rs/toml) | MIT OR Apache-2.0 |
| [serde_with](https://github.com/jonasbb/serde_with/) | MIT OR Apache-2.0 |
| [serde_with_macros](https://github.com/jonasbb/serde_with/) | MIT OR Apache-2.0 |
| [serde-untagged](https://github.com/dtolnay/serde-untagged) | MIT OR Apache-2.0 |
| [serialize-to-javascript](https://github.com/chippers/serialize-to-javascript) | MIT OR Apache-2.0 |
| [serialize-to-javascript-impl](https://github.com/chippers/serialize-to-javascript) | MIT OR Apache-2.0 |
| [servo_arc](https://github.com/servo/stylo) | MIT OR Apache-2.0 |
| [sha2](https://github.com/RustCrypto/hashes) | MIT OR Apache-2.0 |
| [shlex](https://github.com/comex/rust-shlex) | MIT OR Apache-2.0 |
| [signal-hook-registry](https://github.com/vorner/signal-hook) | MIT OR Apache-2.0 |
| [simd-adler32](https://github.com/mcountryman/simd-adler32) | MIT |
| [simdutf8](https://github.com/rusticstuff/simdutf8) | MIT OR Apache-2.0 |
| [siphasher](https://github.com/jedisct1/rust-siphash) | MIT OR Apache-2.0 |
| [slab](https://github.com/tokio-rs/slab) | MIT |
| [smallvec](https://github.com/servo/rust-smallvec) | MIT OR Apache-2.0 |
| [socket2](https://github.com/rust-lang/socket2) | MIT OR Apache-2.0 |
| [softbuffer](https://github.com/rust-windowing/softbuffer) | MIT OR Apache-2.0 |
| [soup3](https://gitlab.gnome.org/World/Rust/soup3-rs) | MIT |
| [soup3-sys](https://gitlab.gnome.org/World/Rust/soup3-rs) | MIT |
| [sqlite-wasm-rs](https://github.com/Spxg/sqlite-wasm-rs) | MIT |
| [stable_deref_trait](https://github.com/storyyeller/stable_deref_trait) | MIT OR Apache-2.0 |
| [static_vcruntime](https://github.com/ChrisDenton/static_vcruntime) | MIT OR Apache-2.0 OR Zlib |
| [string_cache](https://github.com/servo/string-cache) | MIT OR Apache-2.0 |
| [string_cache_codegen](https://github.com/servo/string-cache) | MIT OR Apache-2.0 |
| [stringprep](https://github.com/sfackler/rust-stringprep) | MIT/Apache-2.0 |
| [strsim](https://github.com/rapidfuzz/strsim-rs) | MIT |
| [swift-rs](https://github.com/Brendonovich/swift-rs) | MIT OR Apache-2.0 |
| [syn](https://github.com/dtolnay/syn) | MIT OR Apache-2.0 |
| [sync_wrapper](https://github.com/Actyx/sync_wrapper) | Apache-2.0 |
| [synstructure](https://github.com/mystor/synstructure) | MIT |
| [system-deps](https://github.com/gdesmott/system-deps) | MIT OR Apache-2.0 |
| [tao](https://github.com/tauri-apps/tao) | Apache-2.0 |
| [tao-macros](https://github.com/tauri-apps/tao) | MIT OR Apache-2.0 |
| [target-lexicon](https://github.com/bytecodealliance/target-lexicon) | Apache-2.0 WITH LLVM-exception |
| [tauri](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-build](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-codegen](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-macros](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-plugin](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-plugin-dialog](https://github.com/tauri-apps/plugins-workspace) | Apache-2.0 OR MIT |
| [tauri-plugin-fs](https://github.com/tauri-apps/plugins-workspace) | Apache-2.0 OR MIT |
| [tauri-plugin-log](https://github.com/tauri-apps/plugins-workspace) | Apache-2.0 OR MIT |
| [tauri-plugin-notification](https://github.com/tauri-apps/plugins-workspace) | Apache-2.0 OR MIT |
| [tauri-plugin-opener](https://github.com/tauri-apps/plugins-workspace) | Apache-2.0 OR MIT |
| [tauri-runtime](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-runtime-wry](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-utils](https://github.com/tauri-apps/tauri) | Apache-2.0 OR MIT |
| [tauri-winres](https://github.com/tauri-apps/winres) | MIT |
| [tauri-winrt-notification](https://github.com/tauri-apps/winrt-notification) | MIT OR Apache-2.0 |
| [tempfile](https://github.com/Stebalien/tempfile) | MIT OR Apache-2.0 |
| [tendril](https://github.com/servo/html5ever) | MIT OR Apache-2.0 |
| [thiserror](https://github.com/dtolnay/thiserror) | MIT OR Apache-2.0 |
| [thiserror-impl](https://github.com/dtolnay/thiserror) | MIT OR Apache-2.0 |
| [time](https://github.com/time-rs/time) | MIT OR Apache-2.0 |
| [time-core](https://github.com/time-rs/time) | MIT OR Apache-2.0 |
| [time-macros](https://github.com/time-rs/time) | MIT OR Apache-2.0 |
| [tinystr](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [tinyvec](https://github.com/Lokathor/tinyvec) | Zlib OR Apache-2.0 OR MIT |
| [tokio](https://github.com/tokio-rs/tokio) | MIT |
| [tokio-macros](https://github.com/tokio-rs/tokio) | MIT |
| [tokio-util](https://github.com/tokio-rs/tokio) | MIT |
| [toml](https://github.com/toml-rs/toml) | MIT OR Apache-2.0 |
| [toml_datetime](https://github.com/toml-rs/toml) | MIT OR Apache-2.0 |
| [toml_edit](https://github.com/toml-rs/toml) | MIT OR Apache-2.0 |
| [toml_parser](https://github.com/toml-rs/toml) | MIT OR Apache-2.0 |
| [toml_writer](https://github.com/toml-rs/toml) | MIT OR Apache-2.0 |
| [tower](https://github.com/tower-rs/tower) | MIT |
| [tower-http](https://github.com/tower-rs/tower-http) | MIT |
| [tower-layer](https://github.com/tower-rs/tower) | MIT |
| [tower-service](https://github.com/tower-rs/tower) | MIT |
| [tracing](https://github.com/tokio-rs/tracing) | MIT |
| [tracing-attributes](https://github.com/tokio-rs/tracing) | MIT |
| [tracing-core](https://github.com/tokio-rs/tracing) | MIT |
| [tray-icon](https://github.com/tauri-apps/tray-icon) | MIT OR Apache-2.0 |
| [try-lock](https://github.com/seanmonstar/try-lock) | MIT |
| [ttf-parser](https://github.com/harfbuzz/ttf-parser) | MIT OR Apache-2.0 |
| [typeid](https://github.com/dtolnay/typeid) | MIT OR Apache-2.0 |
| [typenum](https://github.com/paholg/typenum) | MIT OR Apache-2.0 |
| [uds_windows](https://github.com/haraldh/rust_uds_windows) | MIT |
| [unicode-bidi](https://github.com/servo/unicode-bidi) | MIT OR Apache-2.0 |
| [unicode-ident](https://github.com/dtolnay/unicode-ident) | (MIT OR Apache-2.0) AND Unicode-3.0 |
| [unicode-normalization](https://github.com/unicode-rs/unicode-normalization) | MIT OR Apache-2.0 |
| [unicode-properties](https://github.com/unicode-rs/unicode-properties) | MIT/Apache-2.0 |
| [unicode-segmentation](https://github.com/unicode-rs/unicode-segmentation) | MIT OR Apache-2.0 |
| [url](https://github.com/servo/rust-url) | MIT OR Apache-2.0 |
| [urlpattern](https://github.com/denoland/rust-urlpattern) | MIT |
| [utf8_iter](https://github.com/hsivonen/utf8_iter) | Apache-2.0 OR MIT |
| [uuid](https://github.com/uuid-rs/uuid) | Apache-2.0 OR MIT |
| [vcpkg](https://github.com/mcgoo/vcpkg-rs) | MIT/Apache-2.0 |
| [version_check](https://github.com/SergioBenitez/version_check) | MIT/Apache-2.0 |
| [version-compare](https://gitlab.com/timvisee/version-compare) | MIT |
| [vswhom](https://github.com/nabijaczleweli/vswhom.rs) | MIT |
| [vswhom-sys](https://github.com/nabijaczleweli/vswhom-sys.rs) | MIT |
| [walkdir](https://github.com/BurntSushi/walkdir) | Unlicense/MIT |
| [want](https://github.com/seanmonstar/want) | MIT |
| [wasi](https://github.com/bytecodealliance/wasi) | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| [wasip2](https://github.com/bytecodealliance/wasi-rs) | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| [wasm-bindgen](https://github.com/wasm-bindgen/wasm-bindgen) | MIT OR Apache-2.0 |
| [wasm-bindgen-futures](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/futures) | MIT OR Apache-2.0 |
| [wasm-bindgen-macro](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/macro) | MIT OR Apache-2.0 |
| [wasm-bindgen-macro-support](https://github.com/wasm-bindgen/wasm-bindgen/tree/main/crates/macro-support) | MIT OR Apache-2.0 |
| [wasm-bindgen-shared](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/shared) | MIT OR Apache-2.0 |
| [wasm-streams](https://github.com/MattiasBuelens/wasm-streams/) | MIT OR Apache-2.0 |
| [web_atoms](https://github.com/servo/html5ever) | MIT OR Apache-2.0 |
| [web-sys](https://github.com/wasm-bindgen/wasm-bindgen/tree/master/crates/web-sys) | MIT OR Apache-2.0 |
| [web-time](https://github.com/daxpedda/web-time) | MIT OR Apache-2.0 |
| [webkit2gtk](https://github.com/tauri-apps/webkit2gtk-rs) | MIT |
| [webkit2gtk-sys](https://github.com/tauri-apps/webkit2gtk-rs) | MIT |
| [webview2-com](https://github.com/wravery/webview2-rs) | MIT |
| [webview2-com-macros](https://github.com/wravery/webview2-rs) | MIT |
| [webview2-com-sys](https://github.com/wravery/webview2-rs) | MIT |
| [weezl](https://github.com/image-rs/weezl) | MIT OR Apache-2.0 |
| [winapi](https://github.com/retep998/winapi-rs) | MIT/Apache-2.0 |
| [winapi-i686-pc-windows-gnu](https://github.com/retep998/winapi-rs) | MIT/Apache-2.0 |
| [winapi-util](https://github.com/BurntSushi/winapi-util) | Unlicense OR MIT |
| [winapi-x86_64-pc-windows-gnu](https://github.com/retep998/winapi-rs) | MIT/Apache-2.0 |
| [window-vibrancy](https://github.com/tauri-apps/tauri-plugin-vibrancy) | Apache-2.0 OR MIT |
| [windows](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_aarch64_gnullvm](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_aarch64_msvc](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_i686_gnu](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_i686_gnullvm](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_i686_msvc](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_x86_64_gnu](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_x86_64_gnullvm](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows_x86_64_msvc](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-collections](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-core](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-future](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-implement](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-interface](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-link](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-numerics](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-result](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-strings](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-sys](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-targets](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-threading](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [windows-version](https://github.com/microsoft/windows-rs) | MIT OR Apache-2.0 |
| [winnow](https://github.com/winnow-rs/winnow) | MIT |
| [winreg](https://github.com/gentoo90/winreg-rs) | MIT |
| [wit-bindgen](https://github.com/bytecodealliance/wit-bindgen) | Apache-2.0 WITH LLVM-exception OR Apache-2.0 OR MIT |
| [writeable](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [wry](https://github.com/tauri-apps/wry) | Apache-2.0 OR MIT |
| [x11](https://github.com/AltF02/x11-rs.git) | MIT |
| [x11-dl](https://github.com/AltF02/x11-rs.git) | MIT |
| [yoke](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [yoke-derive](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [zbus](https://github.com/z-galaxy/zbus/) | MIT |
| [zbus_macros](https://github.com/z-galaxy/zbus/) | MIT |
| [zbus_names](https://github.com/z-galaxy/zbus/) | MIT |
| [zcheapstr](https://github.com/z-galaxy/zcheapstr/) | MIT |
| [zerocopy](https://github.com/google/zerocopy) | BSD-2-Clause OR Apache-2.0 OR MIT |
| [zerocopy-derive](https://github.com/google/zerocopy) | BSD-2-Clause OR Apache-2.0 OR MIT |
| [zerofrom](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [zerofrom-derive](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [zerotrie](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [zerovec](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [zerovec-derive](https://github.com/unicode-org/icu4x) | Unicode-3.0 |
| [zlib-rs](https://github.com/trifectatechfoundation/zlib-rs) | Zlib |
| [zmij](https://github.com/dtolnay/zmij) | MIT |
| [zvariant](https://github.com/z-galaxy/zbus/) | MIT |
| [zvariant_derive](https://github.com/z-galaxy/zbus/) | MIT |
| [zvariant_utils](https://github.com/z-galaxy/zbus/) | MIT |
