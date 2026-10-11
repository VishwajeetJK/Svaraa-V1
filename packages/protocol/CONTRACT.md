# Svaraa Lite BLE GATT contract (provisional)

Firmware and Gateway must agree on these UUIDs before real-device pairing ships. Source of truth: [`src/uuids.ts`](src/uuids.ts).

## Service

| Name | UUID |
|------|------|
| Svaraa Lite control | `6e400001-b5a3-f393-e0a9-e50e24dcca9e` |
| Device Information (DIS) | `0000180a-0000-1000-8000-00805f9b34fb` |

## Characteristics

| Char | UUID | Notes |
|------|------|--------|
| Model | `…0002` | UTF-8 `SL1-A` or `SL1-F` |
| Event notify | `…0003` | Pendant events |
| Wear mode | `…0004` | SL1-A R/W only |
| Fold state | `…0005` | SL1-F notify/read |
| Privacy slider | `…0006` | SL1-F read/notify |
| Schedule | `…0007` | Compact 64-slot snapshot |
| Clock | `…0008` | Set every connect |
| Battery ext | `…0009` | Percent + charging path |
| Pairing code | `…000a` | Numeric compare |

DIS Model Number should match control Model.

## Auto-identification

1. Scan filter: Svaraa service UUID or GAP name `Svaraa Lite*`.
2. Connect + read model.
3. Capability probe: wear-mode ⇒ Accessory; fold + privacy (+ USB charge) ⇒ Fold-over.
4. Persist `hardwareModel`, capabilities, button map on household pendant; do not re-ask unless factory reset.

## Security

LE Secure Connections + bonding. Recordings over L2CAP with resumable offsets. OTA: MCUmgr/MCUboot, charging + battery ≥ 50%, signed image.
