export type SoundPreset = "dino" | "discreet" | "silent" | "custom";

export type CustomSound = {
  uri: string;
  name: string;
  durationSeconds: number;
};

export type SoundPreference = {
  preset: SoundPreset;
  customSound?: CustomSound;
};

export const MIN_CUSTOM_SOUND_SECONDS = 1;
export const MAX_CUSTOM_SOUND_SECONDS = 2;

export function isCustomSoundDurationAllowed(durationSeconds: number) {
  return Number.isFinite(durationSeconds)
    && durationSeconds >= MIN_CUSTOM_SOUND_SECONDS
    && durationSeconds <= MAX_CUSTOM_SOUND_SECONDS;
}
