export type PendantEventKind =
  | 'button_single'
  | 'button_double'
  | 'button_triple'
  | 'button_hold_sos'
  | 'fall_hard'
  | 'battery'
  | 'charging'
  | 'wear_mode_changed'
  | 'fold_state_changed'
  | 'privacy_slider'
  | 'came_loose'
  | 'mic_mute'
  | 'recording_started'
  | 'recording_stopped'
  | 'voice_frame'
  | 'status_spoken'
  | 'hw_test_tick'
  | 'hw_test_mic';

export type PendantEvent = {
  id: string;
  pendantId: string;
  kind: PendantEventKind;
  at: string;
  payload?: Record<string, unknown>;
};
