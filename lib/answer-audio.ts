import { setAudioModeAsync, useAudioPlayer } from "expo-audio";
import { useEffect } from "react";

import { SoundPreference } from "@/lib/sound-rules";

const successSound = require("@/assets/sounds/success.wav");
const errorSound = require("@/assets/sounds/error.wav");

export function useAnswerAudio(preference: SoundPreference) {
  const successPlayer = useAudioPlayer(successSound);
  const errorPlayer = useAudioPlayer(errorSound);
  const customPlayer = useAudioPlayer(preference.customSound?.uri ? { uri: preference.customSound.uri } : successSound);

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => undefined);
  }, []);

  const playAnswer = (correct: boolean) => {
    if (preference.preset === "silent") return;
    try {
      const player = preference.preset === "custom" && preference.customSound
        ? customPlayer
        : correct ? successPlayer : errorPlayer;
      player.volume = preference.preset === "discreet" ? 0.32 : 0.68;
      player.seekTo(0);
      player.play();
    } catch {
      // O feedback de áudio é complementar; a resposta não deve ser bloqueada por ele.
    }
  };

  return { playAnswer };
}
