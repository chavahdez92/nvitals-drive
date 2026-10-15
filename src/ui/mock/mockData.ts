// Generado por scripts/sync-design.mjs desde prototype-design/js/mock-data.js — no editar.
/* eslint-disable */
// @ts-nocheck
export const HDI_MOCK: any = (function () {
  var DU = 512000; // bytes per NVMe data unit
  function units(tb) { return Math.round(tb * 1e12 / DU); }

  var disks = [
    {
      id: 'disk4', model: 'Samsung SSD 990 PRO 2TB', short: '990 PRO 2TB', vendor: 'Samsung',
      capacityTB: 2.0, bytes: 2000398934016, blocks: 3907029168, lbaSize: 512,
      conn: 'thunderbolt', connLabel: 'Thunderbolt 5', link: 'PCIe Gen4 ×4 · 16 GT/s', linkShort: 'PCIe Gen4 ×4',
      bridge: 'Gabinete Thunderbolt 5 (Intel JHL9480)', internal: false,
      verdict: 'optimal', life: 98, used: 2,
      writtenTB: 31.64, writtenText: '31.64 TB', readTB: 24.68, readText: '24.68 TB',
      duWritten: 61802245, duRead: 48211923, hostWrites: 901234567, hostReads: 512349871, busy: 1432,
      hours: 2164, cycles: 318, unsafe: 27,
      spare: 100, spareTh: 10, mediaErr: 0, errLog: 0, critWarn: 0,
      temp: 41, sensors: [41, 52], warnT: 82, critT: 85, estThresholds: false, warnTime: 0, critTime: 0,
      fw: '4B2QJXD7', nvme: '2.0', serial: 'S7DNNJ0W412871K', pciVendor: 'Samsung · 0x144D', oui: '0x002538',
      namespaces: 1, ctrlId: 1, exit: 0,
      ioservice: 'IOService:/AppleARMPE/arm-io@10F00000/AppleT603xIO/apcie-ge@A0000/IOPCI2PCIBridge@0/pci-bridge0@0/IOPP/pci144d,a80c@0/IONVMeController/IONVMeBlockStorageDevice/IOBlockStorageDriver/Samsung SSD 990 PRO 2TB Media',
      sentence: 'Excelente estado: 98 % de vida útil restante y sin errores de medios. 31.64 TB escritos en 2,164 h de uso.',
      since: { ago: 'hace 12 días', text: '+0.8 TB escritos · +26 h · sin errores nuevos' },
      selftests: [
        { type: 'Corta', result: 'Completada sin errores', hours: 1998, lba: '—', ok: true },
        { type: 'Extendida', result: 'Completada sin errores', hours: 1420, lba: '—', ok: true },
        { type: 'Corta', result: 'Completada sin errores', hours: 612, lba: '—', ok: true }
      ],
      errors: [],
      powerStates: [
        ['PS0', '9.39 W', 'Operativo', '0 µs', '0 µs'], ['PS1', '9.39 W', 'Operativo', '0 µs', '200 µs'],
        ['PS2', '9.39 W', 'Operativo', '0 µs', '1,000 µs'], ['PS3', '0.0400 W', 'Inactivo', '2,000 µs', '1,200 µs'],
        ['PS4', '0.0050 W', 'Inactivo', '500 µs', '9,500 µs']
      ],
      lbaFormats: [['0', '512 B', '0', 'Mejor · en uso'], ['1', '4,096 B', '0', 'Mejor']],
      optAdmin: { selftest: true, format: true, fwdl: true, security: true, nsmgmt: false, devicetest: true, virt: false },
      optNvm: { dsm: true, wz: true, compare: true, verify: true, timestamp: true, reservations: false }
    },
    {
      id: 'disk6', model: 'WD_BLACK SN850X 1TB', short: 'SN850X 1TB', vendor: 'Western Digital',
      capacityTB: 1.0, bytes: 1000204886016, blocks: 1953525168, lbaSize: 512,
      conn: 'usb4', connLabel: 'USB4 40 Gb/s', link: 'PCIe Gen4 ×4 · 16 GT/s', linkShort: 'PCIe Gen4 ×4',
      bridge: 'ASMedia ASM2464PD (USB4)', internal: false,
      verdict: 'good', life: 58, used: 42,
      writtenTB: 312.4, writtenText: '312.4 TB', readTB: 287.9, readText: '287.9 TB',
      duWritten: units(312.4), duRead: units(287.9), hostWrites: 4122904117, hostReads: 3781204488, busy: 18422,
      hours: 9870, cycles: 1412, unsafe: 211,
      spare: 100, spareTh: 10, mediaErr: 0, errLog: 0, critWarn: 0,
      temp: 67, sensors: [67, 71], warnT: 84, critT: 88, estThresholds: false, warnTime: 38, critTime: 0,
      fw: '620361WD', nvme: '1.4', serial: '23145Q801274', pciVendor: 'Sandisk · 0x15B7', oui: '0x001B44',
      namespaces: 1, ctrlId: 8215, exit: 0,
      ioservice: 'IOService:/AppleARMPE/arm-io@10F00000/AppleT603xIO/usb-drd1@2280000/AppleT6030USB4/IOPCI2PCIBridge@1/pci15b7,5030@0/IONVMeController/IONVMeBlockStorageDevice/WD_BLACK SN850X 1TB Media',
      sentence: 'Buen estado con desgaste moderado: 58 % de vida útil restante.',
      since: { ago: 'hace 30 días', text: '+6.1 TB escritos · +212 h · sin errores nuevos' },
      selftests: [{ type: 'Corta', result: 'Completada sin errores', hours: 9120, lba: '—', ok: true }],
      errors: [],
      powerStates: [['PS0', '8.25 W', 'Operativo', '0 µs', '0 µs'], ['PS1', '3.50 W', 'Operativo', '0 µs', '0 µs'], ['PS2', '2.60 W', 'Operativo', '0 µs', '0 µs'], ['PS3', '0.0250 W', 'Inactivo', '5,000 µs', '10,000 µs'], ['PS4', '0.0050 W', 'Inactivo', '3,900 µs', '45,700 µs']],
      lbaFormats: [['0', '512 B', '0', 'Buena · en uso'], ['1', '4,096 B', '0', 'Mejor']],
      optAdmin: { selftest: true, format: true, fwdl: true, security: true, nsmgmt: false, devicetest: true, virt: false },
      optNvm: { dsm: true, wz: true, compare: true, verify: false, timestamp: true, reservations: false }
    },
    {
      id: 'disk8', model: 'Kingston KC3000 1TB', short: 'KC3000 1TB', vendor: 'Kingston',
      capacityTB: 1.0, bytes: 1024209543168, blocks: 2000409264, lbaSize: 512,
      conn: 'thunderbolt', connLabel: 'Thunderbolt 4', link: 'PCIe Gen3 ×4 · 8 GT/s', linkShort: 'PCIe Gen3 ×4',
      bridge: 'Gabinete Thunderbolt 4 (Intel JHL7440)', internal: false,
      verdict: 'warning', life: 12, used: 88,
      writtenTB: 704.2, writtenText: '704.2 TB', readTB: 512.6, readText: '512.6 TB',
      duWritten: units(704.2), duRead: units(512.6), hostWrites: 9203114520, hostReads: 6612088301, busy: 30211,
      hours: 14322, cycles: 2036, unsafe: 64,
      spare: 97, spareTh: 10, mediaErr: 3, errLog: 3, critWarn: 0,
      temp: 52, sensors: [52, 58], warnT: 84, critT: 89, estThresholds: false, warnTime: 4, critTime: 0,
      fw: 'EIFK31.6', nvme: '1.4', serial: '50026B7686B3C1D2', pciVendor: 'Kingston · 0x2646', oui: '0x0026B7',
      namespaces: 1, ctrlId: 1, exit: 64,
      ioservice: 'IOService:/AppleARMPE/arm-io@10F00000/AppleT603xIO/apcie-ge@B0000/IOPCI2PCIBridge@0/pci2646,5013@0/IONVMeController/IONVMeBlockStorageDevice/KINGSTON SKC3000S1024G Media',
      sentence: 'Requiere atención: 3 errores de medios y 12 % de vida útil restante. Planifica su reemplazo y respalda tus datos.',
      since: { ago: 'hace 21 días', text: '+9.4 TB escritos · +168 h · +1 error de medios' },
      selftests: [{ type: 'Corta', result: 'Completada sin errores', hours: 13980, lba: '—', ok: true }],
      errors: [
        ['0', '3', '2', '0x0071', '0x0281 · Error de lectura no recuperado', '812,300,544', '1'],
        ['1', '2', '4', '0x1043', '0x0281 · Error de lectura no recuperado', '812,300,552', '1'],
        ['2', '1', '1', '0x00A9', '0x0281 · Error de lectura no recuperado', '1,440,027,136', '1']
      ],
      powerStates: [['PS0', '8.80 W', 'Operativo', '0 µs', '0 µs'], ['PS1', '7.10 W', 'Operativo', '0 µs', '0 µs'], ['PS2', '5.20 W', 'Operativo', '0 µs', '0 µs'], ['PS3', '0.0620 W', 'Inactivo', '2,500 µs', '7,500 µs'], ['PS4', '0.0040 W', 'Inactivo', '10,000 µs', '40,000 µs']],
      lbaFormats: [['0', '512 B', '0', 'Mejor · en uso']],
      optAdmin: { selftest: true, format: true, fwdl: true, security: true, nsmgmt: false, devicetest: false, virt: false },
      optNvm: { dsm: true, wz: true, compare: true, verify: false, timestamp: true, reservations: false }
    },
    {
      id: 'disk5', model: 'SK hynix Platinum P41 2TB', short: 'Platinum P41 2TB', vendor: 'SK hynix',
      capacityTB: 2.0, bytes: 2000398934016, blocks: 3907029168, lbaSize: 512,
      conn: 'thunderbolt', connLabel: 'Thunderbolt 3', link: 'PCIe Gen3 ×4 · 8 GT/s', linkShort: 'PCIe Gen3 ×4',
      bridge: 'Gabinete Thunderbolt 3 (Intel JHL6340)', internal: false,
      verdict: 'critical', life: 9, used: 91,
      writtenTB: 1352, writtenText: '1,352 TB', readTB: 1108, readText: '1,108 TB',
      duWritten: units(1352), duRead: units(1108), hostWrites: 17712004561, hostReads: 14330872104, busy: 51980,
      hours: 21870, cycles: 3904, unsafe: 142,
      spare: 4, spareTh: 10, mediaErr: 37, errLog: 1284, critWarn: 5,
      temp: 49, sensors: [49, 55], warnT: 83, critT: 86, estThresholds: false, warnTime: 112, critTime: 6,
      fw: '51060A20', nvme: '1.4', serial: 'SSB8N18231030854K', pciVendor: 'SK hynix · 0x1C5C', oui: '0xACE42E',
      namespaces: 1, ctrlId: 1, exit: 72,
      ioservice: 'IOService:/AppleARMPE/arm-io@10F00000/AppleT603xIO/apcie-ge@C0000/IOPCI2PCIBridge@0/pci1c5c,1959@0/IONVMeController/IONVMeBlockStorageDevice/SHPP41-2000GM Media',
      sentence: 'Estado crítico: el repuesto (4 %) está por debajo del umbral (10 %) y hay 37 errores de medios. Respalda tus datos lo antes posible.',
      since: { ago: 'hace 9 días', text: '+3.2 TB escritos · +96 h · +5 errores de medios' },
      selftests: [
        { type: 'Extendida', result: 'Falló: error de lectura', hours: 21602, lba: '1,204,518,912', ok: false },
        { type: 'Corta', result: 'Completada sin errores', hours: 20870, lba: '—', ok: true }
      ],
      errors: [
        ['0', '1284', '3', '0x0012', '0x0281 · Error de lectura no recuperado', '1,204,518,912', '1'],
        ['1', '1283', '1', '0x0077', '0x0281 · Error de lectura no recuperado', '1,204,519,040', '1'],
        ['2', '1282', '5', '0x0104', '0x0281 · Error de lectura no recuperado', '2,881,337,600', '1'],
        ['3', '1281', '2', '0x0031', '0x4004 · Campo no válido en el comando', '—', '0'],
        ['4', '1280', '6', '0x0199', '0x0281 · Error de lectura no recuperado', '3,002,114,048', '1']
      ],
      powerStates: [['PS0', '7.00 W', 'Operativo', '0 µs', '0 µs'], ['PS1', '6.00 W', 'Operativo', '0 µs', '0 µs'], ['PS2', '5.00 W', 'Operativo', '0 µs', '0 µs'], ['PS3', '0.0500 W', 'Inactivo', '1,000 µs', '1,000 µs'], ['PS4', '0.0050 W', 'Inactivo', '1,000 µs', '9,000 µs']],
      lbaFormats: [['0', '512 B', '0', 'Mejor · en uso'], ['1', '4,096 B', '0', 'Mejor']],
      optAdmin: { selftest: true, format: true, fwdl: true, security: true, nsmgmt: false, devicetest: true, virt: false },
      optNvm: { dsm: true, wz: true, compare: true, verify: true, timestamp: true, reservations: false }
    },
    {
      id: 'disk7', model: 'Crucial P3 Plus 4TB', short: 'P3 Plus 4TB', vendor: 'Crucial',
      capacityTB: 4.0, bytes: 4000787030016, blocks: 7814037168, lbaSize: 512,
      conn: 'usb', connLabel: 'USB 3.2 Gen 2', link: '10 Gb/s', linkShort: '10 Gb/s',
      bridge: 'Puente USB Realtek RTL9210B', internal: false,
      verdict: 'nodata', nodata: true, exit: 2,
      reason: 'Puente USB Realtek RTL9210B: macOS no permite leer SMART por USB.',
      sentence: 'No se pueden leer datos SMART por USB en macOS. Conecta el disco con un gabinete Thunderbolt o USB4.',
      ioservice: 'IOService:/AppleARMPE/arm-io@10F00000/AppleT603xIO/usb-drd0@2280000/AppleT6030USBXHCI@00000000/RTL9210B-CG@01100000/IOUSBMassStorageDriverNub/IOSCSIPeripheralDeviceType00/Realtek RTL9210B NVMe Media'
    },
    {
      id: 'disk0', model: 'APPLE SSD AP1024Z', short: 'Macintosh HD', vendor: 'Apple',
      capacityTB: 1.0, bytes: 1000555581440, blocks: 244276265, lbaSize: 4096,
      conn: 'internal', connLabel: 'Interno', link: 'Apple Fabric', linkShort: 'Apple Fabric',
      bridge: null, internal: true, bootDisk: true,
      verdict: 'optimal', life: 99, used: 1,
      writtenTB: 7.83, writtenText: '7.83 TB', readTB: 4.85, readText: '4.85 TB',
      duWritten: units(7.83), duRead: units(4.85), hostWrites: 112044190, hostReads: 98331022, busy: 0,
      hours: 228, cycles: 139, unsafe: 9,
      spare: 100, spareTh: 99, mediaErr: 0, errLog: null, critWarn: 0,
      temp: 37, sensors: [37], warnT: 70, critT: 80, estThresholds: true, warnTime: 0, critTime: 0,
      fw: '1033.100', nvme: '<1.2', serial: '7fb04e4b76d0f918', pciVendor: 'Apple · 0x106B', oui: '0x000000',
      namespaces: 1, ctrlId: 0, exit: 4, errLogUnavailable: true, selftestUnsupported: true,
      ioservice: 'IOService:/AppleARMPE/arm-io@10F00000/AppleT603xIO/ans@8E400000/AppleASCWrapV6/iop-ans-nub/RTBuddy(ANS2)/RTBuddyService/AppleANS3NVMeController/NS_01@1/IOBlockStorageDriver/APPLE SSD AP1024Z Media',
      sentence: 'Excelente estado: 99 % de vida útil restante y sin errores de medios. 7.83 TB escritos en 228 h de uso.',
      since: { ago: 'hace 5 días', text: '+0.1 TB escritos · +9 h · sin errores nuevos' },
      selftests: [], errors: [],
      powerStates: [['PS0', '— W', 'Operativo', '0 µs', '0 µs']],
      lbaFormats: [['0', '4,096 B', '0', 'Mejor · en uso']],
      optAdmin: { selftest: false, format: true, fwdl: false, security: false, nsmgmt: false, devicetest: false, virt: false },
      optNvm: { dsm: true, wz: false, compare: false, verify: false, timestamp: false, reservations: false }
    }
  ];

  var exitBits = [
    { bit: 1, label: 'Error de línea de comandos' },
    { bit: 2, label: 'No se pudo abrir el dispositivo' },
    { bit: 4, label: 'Lectura parcial: un comando falló' },
    { bit: 8, label: 'SMART: disco fallando' },
    { bit: 16, label: 'Umbral superado previamente' },
    { bit: 32, label: 'Atributo cerca del umbral' },
    { bit: 64, label: 'El log de errores tiene registros' },
    { bit: 128, label: 'El log de autopruebas tiene errores' }
  ];

  var scans = {
    disk4: { kind: 'full', durationSim: 698, durationText: '11 min 38 s', avg: 2870, min: 2410, max: 3050, maxTemp: 58, errors: 0, zones: [], result: 'passed',
      before: { read: '24.68 TB', hostReads: '512,349,871', temp: '41 °C', media: '0', errLog: '0', spare: '100 %', hours: '2,164 h' },
      after: { read: '26.68 TB', hostReads: '516,256,900', temp: '58 °C', media: '0', errLog: '0', spare: '100 %', hours: '2,164 h' } },
    disk5: { kind: 'full', durationSim: 1132, durationText: '18 min 52 s', avg: 1742, min: 38, max: 2960, maxTemp: 61, errors: 12, result: 'errors',
      zones: [
        [0.0612, '239,118,080', '239,120,127'], [0.1147, '448,121,856', '448,123,903'], [0.1522, '594,640,896', '594,642,943'],
        [0.2081, '812,300,544', '812,302,591'], [0.3083, '1,204,518,912', '1,204,520,959'], [0.3091, '1,207,631,872', '1,207,633,919'],
        [0.4276, '1,670,645,760', '1,670,647,807'], [0.5519, '2,156,289,024', '2,156,291,071'], [0.6015, '2,350,139,392', '2,350,141,439'],
        [0.7375, '2,881,337,600', '2,881,339,647'], [0.7684, '3,002,114,048', '3,002,116,095'], [0.9127, '3,565,944,832', '3,565,946,879']
      ],
      before: { read: '1,108 TB', hostReads: '14,330,872,104', temp: '49 °C', media: '37', errLog: '1,284', spare: '4 %', hours: '21,870 h' },
      after: { read: '1,110 TB', hostReads: '14,334,779,133', temp: '61 °C', media: '49', errLog: '1,296', spare: '4 %', hours: '21,870 h' } }
  };

  var smartctl = { path: '/opt/homebrew/bin/smartctl', version: '7.5', platform: 'Darwin 27.0.0 arm64', build: '2025-04-30 r5714' };

  var json4 = {
    smartctl: { version: [7, 5], platform_info: 'Darwin 27.0.0 arm64', exit_status: 0 },
    device: { name: 'disk4', type: 'nvme', protocol: 'NVMe' },
    model_name: 'Samsung SSD 990 PRO 2TB',
    serial_number: 'S7DNNJ0W••••••',
    firmware_version: '4B2QJXD7',
    nvme_pci_vendor: { id: 5197, subsystem_id: 5197 },
    nvme_version: { string: '2.0', value: 131072 },
    user_capacity: { blocks: 3907029168, bytes: 2000398934016 },
    smart_status: { passed: true, nvme: { value: 0 } },
    nvme_smart_health_information_log: {
      critical_warning: 0, temperature: 41, available_spare: 100, available_spare_threshold: 10, percentage_used: 2,
      data_units_read: 48211923, data_units_written: 61802245, host_reads: 512349871, host_writes: 901234567,
      controller_busy_time: 1432, power_cycles: 318, power_on_hours: 2164, unsafe_shutdowns: 27, media_errors: 0,
      num_err_log_entries: 0, warning_temp_time: 0, critical_comp_time: 0, temperature_sensors: [41, 52]
    },
    temperature: { current: 41 },
    spare_available: { current_percent: 100, threshold_percent: 10 },
    endurance_used: { current_percent: 2 },
    power_on_time: { hours: 2164 },
    power_cycle_count: 318
  };

  var text4 = [
    'smartctl 7.5 2025-04-30 r5714 [Darwin 27.0.0 arm64] (local build)',
    'Copyright (C) 2002-25, Bruce Allen, Christian Franke, www.smartmontools.org',
    '',
    '=== START OF INFORMATION SECTION ===',
    'Model Number:                       Samsung SSD 990 PRO 2TB',
    'Serial Number:                      S7DNNJ0W••••••',
    'Firmware Version:                   4B2QJXD7',
    'PCI Vendor/Subsystem ID:            0x144d',
    'IEEE OUI Identifier:                0x002538',
    'Total NVM Capacity:                 2,000,398,934,016 [2.00 TB]',
    'Unallocated NVM Capacity:           0',
    'Controller ID:                      1',
    'NVMe Version:                       2.0',
    'Number of Namespaces:               1',
    'Namespace 1 Size/Capacity:          2,000,398,934,016 [2.00 TB]',
    'Namespace 1 Formatted LBA Size:     512',
    'Local Time is:                      Thu Sep 24 10:42:18 2026 CST',
    '',
    '=== START OF SMART DATA SECTION ===',
    'SMART overall-health self-assessment test result: PASSED',
    '',
    'SMART/Health Information (NVMe Log 0x02)',
    'Critical Warning:                   0x00',
    'Temperature:                        41 Celsius',
    'Available Spare:                    100%',
    'Available Spare Threshold:          10%',
    'Percentage Used:                    2%',
    'Data Units Read:                    48,211,923 [24.6 TB]',
    'Data Units Written:                 61,802,245 [31.6 TB]',
    'Host Read Commands:                 512,349,871',
    'Host Write Commands:                901,234,567',
    'Controller Busy Time:               1,432',
    'Power Cycles:                       318',
    'Power On Hours:                     2,164',
    'Unsafe Shutdowns:                   27',
    'Media and Data Integrity Errors:    0',
    'Error Information Log Entries:      0',
    'Warning  Comp. Temperature Time:    0',
    'Critical Comp. Temperature Time:    0',
    'Temperature Sensor 1:               41 Celsius',
    'Temperature Sensor 2:               52 Celsius',
    '',
    'Error Information (NVMe Log 0x01, 16 of 64 entries)',
    'No Errors Logged',
    '',
    'Self-test Log (NVMe Log 0x06)',
    'Self-test status: No self-test in progress',
    'Num  Test_Description  Status                       Power_on_Hours  Failing_LBA  NSID Seg SCT Code',
    ' 0   Short             Completed without error                1998            -     -   -   -    -',
    ' 1   Extended          Completed without error                1420            -     -   -   -    -',
    ' 2   Short             Completed without error                 612            -     -   -   -    -'
  ].join('\n');

  /* Generated reports (Reportes list). */
  var reports = [
    { id: 'HDI-20260924-0142', disk: 'disk4', date: '24 sep 2026, 10:58', verdict: 'optimal', format: 'PDF', pages: 4, client: 'Inventario · lote 38', file: 'HDI-20260924-0142 Samsung 990 PRO.pdf' },
    { id: 'HDI-20260923-0139', disk: 'disk5', date: '23 sep 2026, 17:21', verdict: 'critical', format: 'PDF', pages: 4, client: 'Garantía · caso 5512', file: 'HDI-20260923-0139 SK hynix P41.pdf' },
    { id: 'HDI-20260918-0131', disk: 'disk8', date: '18 sep 2026, 12:04', verdict: 'warning', format: 'HTML', pages: 4, client: 'Cliente: M. Ortega', file: 'HDI-20260918-0131 Kingston KC3000.html' },
    { id: 'HDI-20260825-0117', disk: 'disk6', date: '25 ago 2026, 09:40', verdict: 'good', format: 'JSON', pages: 0, client: 'Compra segunda mano', file: 'HDI-20260825-0117 WD SN850X.json' }
  ];

  /* History snapshots. The last snapshot always equals the current mock values;
     the previous one matches `since` (the "Desde la última revisión" copy). */
  var hist = {
    disk4: [['10 jun 2026', 99, 24.10, 1620, 0, 49, 27], ['15 jul 2026', 99, 27.32, 1884, 0, 52, 27], ['20 ago 2026', 98, 29.95, 2051, 0, 55, 27], ['12 sep 2026', 98, 30.84, 2138, 0, 58, 27], ['24 sep 2026', 98, 31.64, 2164, 0, 52, 27]],
    disk6: [['12 may 2026', 61, 291.3, 9118, 0, 71, 204], ['30 jun 2026', 60, 299.8, 9401, 0, 73, 206], ['25 ago 2026', 59, 306.3, 9658, 0, 74, 209], ['24 sep 2026', 58, 312.4, 9870, 0, 71, 211]],
    disk8: [['2 jun 2026', 15, 681.0, 13790, 1, 60, 61], ['20 jul 2026', 14, 689.4, 13972, 1, 62, 62], ['3 sep 2026', 13, 694.8, 14154, 2, 61, 63], ['24 sep 2026', 12, 704.2, 14322, 3, 58, 64]],
    disk5: [['18 jun 2026', 12, 1336.4, 21480, 21, 63, 139], ['28 jul 2026', 11, 1342.2, 21622, 26, 64, 140], ['29 ago 2026', 10, 1345.9, 21704, 29, 62, 141], ['15 sep 2026', 9, 1348.8, 21774, 32, 61, 141], ['24 sep 2026', 9, 1352.0, 21870, 37, 55, 142]],
    disk0: [['1 ago 2026', 100, 6.21, 142, 0, 41, 7], ['2 sep 2026', 99, 7.29, 188, 0, 43, 8], ['19 sep 2026', 99, 7.73, 219, 0, 40, 9], ['24 sep 2026', 99, 7.83, 228, 0, 38, 9]],
    disk7: [['24 sep 2026', null, null, null, null, null, null]],
    past1: [['3 mar 2026', 94, 88.2, 5210, 0, 57, 44], ['14 abr 2026', 93, 91.6, 5402, 0, 59, 45]]
  };
  var pastDisks = [
    { id: 'past1', model: 'Samsung SSD 980 1TB', short: '980 1TB', serial: 'S649NF0R713309X', verdict: 'optimal', life: 93, connLabel: 'Thunderbolt 3', lastSeen: '14 abr 2026', disconnected: true }
  ];

  return { disks: disks, exitBits: exitBits, scans: scans, smartctl: smartctl, json4: json4, text4: text4, DU: DU, reports: reports, hist: hist, pastDisks: pastDisks, appVersion: '1.0 (26)' };
})();
