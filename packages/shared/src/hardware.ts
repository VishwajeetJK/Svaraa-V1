export const HardwareModels = ['SL1-A', 'SL1-F'] as const;
export type HardwareModel = (typeof HardwareModels)[number];

export const WearModes = ['chest', 'wrist', 'clip'] as const;
export type WearMode = (typeof WearModes)[number];

export const FoldStates = ['closed', 'clipped', 'open'] as const;
export type FoldState = (typeof FoldStates)[number];

export type ButtonMap = {
  single: 'talk' | 'ack';
  hold3s: 'sos';
  double: 'status' | 'record';
  triple: 'mic_mute' | 'status';
};

export type PendantCapabilities = {
  wearModeWritable: boolean;
  foldState: boolean;
  privacySlider: boolean;
  puckCharge: boolean;
  usbCharge: boolean;
  optionalWearSense: boolean;
};

export const CAPABILITIES_BY_MODEL: Record<HardwareModel, PendantCapabilities> = {
  'SL1-A': {
    wearModeWritable: true,
    foldState: false,
    privacySlider: false,
    puckCharge: true,
    usbCharge: false,
    optionalWearSense: true,
  },
  'SL1-F': {
    wearModeWritable: false,
    foldState: true,
    privacySlider: true,
    puckCharge: false,
    usbCharge: true,
    optionalWearSense: false,
  },
};

export const BUTTON_MAP_BY_MODEL: Record<HardwareModel, ButtonMap> = {
  'SL1-A': { single: 'talk', hold3s: 'sos', double: 'status', triple: 'mic_mute' },
  'SL1-F': { single: 'talk', hold3s: 'sos', double: 'record', triple: 'status' },
};

export function identifyHardware(input: {
  model?: string | null;
  capabilities?: Partial<PendantCapabilities> | null;
}): { model: HardwareModel; capabilities: PendantCapabilities; buttonMap: ButtonMap; confidence: 'model' | 'probe' | 'unknown' } {
  if (input.model === 'SL1-A' || input.model === 'SL1-F') {
    return {
      model: input.model,
      capabilities: CAPABILITIES_BY_MODEL[input.model],
      buttonMap: BUTTON_MAP_BY_MODEL[input.model],
      confidence: 'model',
    };
  }

  const c = input.capabilities ?? {};
  if (c.foldState || c.privacySlider || c.usbCharge) {
    return {
      model: 'SL1-F',
      capabilities: CAPABILITIES_BY_MODEL['SL1-F'],
      buttonMap: BUTTON_MAP_BY_MODEL['SL1-F'],
      confidence: 'probe',
    };
  }
  if (c.wearModeWritable || c.puckCharge) {
    return {
      model: 'SL1-A',
      capabilities: CAPABILITIES_BY_MODEL['SL1-A'],
      buttonMap: BUTTON_MAP_BY_MODEL['SL1-A'],
      confidence: 'probe',
    };
  }

  // Default accessory edition when unknown (safer coaching for puck)
  return {
    model: 'SL1-A',
    capabilities: CAPABILITIES_BY_MODEL['SL1-A'],
    buttonMap: BUTTON_MAP_BY_MODEL['SL1-A'],
    confidence: 'unknown',
  };
}

export function chargeCoachCopy(model: HardwareModel): string {
  return model === 'SL1-A'
    ? 'Place the pendant on the magnetic puck until you hear “Charging”.'
    : 'Plug in any USB-C cable until you hear “Charging”.';
}

export function otaCoachCopy(model: HardwareModel): string {
  return model === 'SL1-A'
    ? 'Firmware updates require the pendant on the puck with battery at least 50%.'
    : 'Firmware updates require USB-C plugged in with battery at least 50%.';
}

export function restartCoachCopy(model: HardwareModel): string {
  return model === 'SL1-A'
    ? 'Hold the gold dot for 10 seconds while the pendant is on the puck.'
    : 'Hold the gold dot for 10 seconds while USB-C is plugged in.';
}
