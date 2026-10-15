# NVitals Drive

<img src="branding/nvitals/Logo de nvitals.svg" alt="NVitals Drive" height="48">

English · **[Español](README.md)**

An open-source desktop app that checks the health of NVMe SSDs. It reads SMART data with [smartmontools](https://github.com/smartmontools/smartmontools) (`smartctl`) and turns it into a clear verdict: remaining life, temperature, errors, power-on hours and link speed.

> **Status:** works on **macOS** (Apple Silicon). **Windows and Linux** support is in progress; see the plan in [`docs/OPEN_SOURCE_PLAN.md`](docs/OPEN_SOURCE_PLAN.md) (Spanish). If you have a PC with an NVMe drive and want to help test, read [CONTRIBUTING.md](CONTRIBUTING.md).
>
> The user interface is currently in **Spanish (es-MX)**. An English UI is planned after the cross-platform release.

## Features

- **Devices:** internal and external drives, with hot-plug detection.
- **SMART health:** verdict, remaining life, available spare, media errors, unsafe shutdowns and critical warnings, explained in plain language.
- **Live temperature** chart with CSV export.
- **Connection chain:** PCIe link, Thunderbolt/USB4 tunnel and USB bridge, so you can tell whether the enclosure limits speed.
- **Tests:** read-only surface scan and a read/write benchmark powered by [fio](https://github.com/axboe/fio).
- **Reports** as PDF, HTML and JSON, with history and comparison between checks.
- **Drive records** by serial number for repair shops and labs, including multi-drive reports.
- **smartctl console** limited to a closed list of read-only operations.

## Platform support

| | macOS | Windows | Linux |
|---|---|---|---|
| Status | ✅ Stable (macOS 14+, Apple Silicon) | 🚧 In progress | 🚧 In progress |
| Internal NVMe SMART | ✅ No privileges needed | Planned, no admin needed | Planned, one authorization per session |
| SMART through USB enclosures | ❌ Not possible on macOS | Planned | Planned |
| Thunderbolt / USB4 enclosures | ✅ | Planned | Planned |

## Install (macOS)

1. Install smartmontools: `brew install smartmontools` (optional, for the benchmark: `brew install fio`).
2. Download the `.dmg` from the [Releases page](https://github.com/chavahdez92/nvitals-drive/releases), or build from source (below).

## Privacy and safety

- **Everything stays local.** No telemetry, no accounts, no network access.
- **Read-only.** The app never writes to the drives it inspects: no formatting, firmware, `--set` or any operation that modifies a drive. The only exception is the benchmark, which writes a temporary file (`.hdi-bench.tmp`) on a volume you choose and always deletes it.
- **No shell.** smartctl runs with vector arguments, from a closed allowlist of operations, against validated disk identifiers.
- The surface scan needs administrator privileges and asks for them every time.

To report a vulnerability, follow [SECURITY.md](SECURITY.md).

> **Disclaimer:** NVitals Drive is a diagnostic tool. It helps you spot problems but cannot guarantee the integrity of your data. Always keep backups. The software is provided "as is", without warranty (see the licenses).

## Build from source

Requirements: Node 22.12+ with pnpm (`corepack enable`), stable Rust ([rustup](https://rustup.rs)) and smartmontools.

```bash
pnpm install
pnpm dev          # native app with real data (Tauri + Vite)
pnpm dev:web      # mock-data prototype in the browser (http://localhost:1420, ⇧D = scenarios)
pnpm build        # builds src-tauri/target/release/bundle/macos/NVitals Drive.app
pnpm check        # TypeScript + domain tests (vitest) + core tests (cargo test)
```

## Contributing

Contributions are welcome: bug reports, hardware reports, translations and code. Read [CONTRIBUTING.md](CONTRIBUTING.md) and the [code of conduct](CODE_OF_CONDUCT.md). Issues and pull requests in English or Spanish are both fine.

## License

Licensed under either of **MIT** or **Apache-2.0**, at your option ([LICENSE-MIT](LICENSE-MIT), [LICENSE-APACHE](LICENSE-APACHE)). Dependencies are listed in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

smartmontools and fio are external GPL-2.0 programs. The app runs them as separate processes and does not ship them.

The "NVitals Drive" name and logo have their own usage rules: see [TRADEMARK.md](TRADEMARK.md).
