import { Pressable, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import { TacticalMission } from "@/lib/tactical-progress";

type Props = {
  missions: TacticalMission[];
  onMissionPress: (mission: TacticalMission) => void;
  /** ID da missão prioritária da mentoria (fica destacada) */
  focusMissionId?: string;
  /** Tema prioritário da mentoria (fallback de destaque) */
  focusTopic?: string;
};

export function TacticalMap({ missions, onMissionPress, focusMissionId, focusTopic }: Props) {
  // Prioriza a missão da mentoria no topo da lista visível
  const ordered = [...missions].sort((a, b) => {
    const aFocus = a.id === focusMissionId || a.topic === focusTopic ? 1 : 0;
    const bFocus = b.id === focusMissionId || b.topic === focusTopic ? 1 : 0;
    if (aFocus !== bFocus) return bFocus - aFocus;
    // Depois: active > completed > locked
    const statusOrder = { active: 0, completed: 1, locked: 2 };
    return statusOrder[a.status] - statusOrder[b.status];
  });

  const visible = ordered.slice(0, 6);
  const completedCount = missions.filter((m) => m.status === "completed").length;
  const totalCount = missions.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.sectionLabel}>
        <Text style={styles.sectionLabelText}>MAPA DE MISSÕES</Text>
      </View>
      <View style={styles.mapContent}>
        {/* Barra de progresso do mapa */}
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>PERCURSO</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${Math.max(4, progressPercent)}%` }]} />
          </View>
          <Text style={styles.progressValue}>{progressPercent}%</Text>
        </View>

        {visible.map((mission, index) => {
          const isFocus = mission.id === focusMissionId || mission.topic === focusTopic;
          return (
            <View key={mission.id}>
              {index > 0 && <View style={[styles.road, index % 2 ? styles.roadRight : styles.roadLeft]} />}
              <Pressable
                disabled={mission.status === "locked" || !mission.lesson}
                onPress={() => onMissionPress(mission)}
                style={({ pressed }) => [
                  styles.mission,
                  index % 2 ? styles.missionRight : styles.missionLeft,
                  isFocus && styles.missionFocus,
                  pressed && mission.status !== "locked" && styles.pressed,
                ]}
              >
                <MissionMarker status={mission.status} isFocus={isFocus} />
                <View style={[styles.missionCopy, mission.status === "locked" && styles.missionCopyLocked]}>
                  <Text style={[styles.missionSubject, mission.status === "locked" && styles.textLocked]}>
                    {mission.subjectTitle}
                    {isFocus ? " · FOCO DO DIA" : ""}
                  </Text>
                  <Text style={[styles.missionTopic, mission.status === "locked" && styles.textLocked]} numberOfLines={2}>
                    {mission.topic}
                  </Text>
                  {mission.status === "active" && (
                    <View style={styles.startChip}>
                      <MaterialIcons name="play-arrow" size={13} color="#FFFFFF" />
                      <Text style={styles.startChipText}>COMEÇAR LIÇÃO</Text>
                    </View>
                  )}
                  {mission.status === "completed" && <Text style={styles.completedText}>✓ CONCLUÍDO</Text>}
                  {isFocus && mission.status === "locked" && (
                    <Text style={styles.focusLockedText}>Próximo alvo da mentoria</Text>
                  )}
                </View>
              </Pressable>
            </View>
          );
        })}
        {missions.length > visible.length && (
          <Text style={styles.more}>+ {missions.length - visible.length} temas no seu percurso</Text>
        )}
      </View>
    </View>
  );
}

function MissionMarker({ status, isFocus }: { status: TacticalMission["status"]; isFocus?: boolean }) {
  if (status === "completed") {
    return (
      <View style={[styles.marker, styles.markerCompleted]}>
        <MaterialIcons name="check" size={27} color="#FFFFFF" />
      </View>
    );
  }
  if (status === "active" || isFocus) {
    return (
      <View style={[styles.marker, styles.markerActive, isFocus && styles.markerFocus]}>
        <MaterialIcons name="play-arrow" size={31} color="#FFFFFF" />
      </View>
    );
  }
  return (
    <View style={[styles.marker, styles.markerLocked]}>
      <MaterialIcons name="lock" size={23} color="#FFFFFF" />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    overflow: "hidden",
    minHeight: 455,
    borderRadius: 22,
    backgroundColor: "#EEF2D9",
    borderWidth: 1,
    borderColor: "#DCE5BA",
  },
  sectionLabel: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2ECD0",
    borderRightWidth: 1,
    borderColor: "#D2DDBB",
  },
  sectionLabelText: {
    color: "#214B2B",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.7,
    transform: [{ rotate: "-90deg" }],
    width: 185,
    textAlign: "center",
  },
  mapContent: { flex: 1, paddingVertical: 14, paddingHorizontal: 14 },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D5E0B8",
  },
  progressLabel: { color: "#2A4D30", fontSize: 9, fontWeight: "900", letterSpacing: 0.5 },
  progressTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D4DEC0",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: "#1F8A3A",
  },
  progressValue: { color: "#1A5C2A", fontSize: 12, fontWeight: "900", minWidth: 32, textAlign: "right" },
  road: {
    position: "absolute",
    top: -25,
    width: 84,
    height: 51,
    borderColor: "#607E41",
    borderWidth: 9,
    borderTopWidth: 0,
    borderRadius: 28,
    opacity: 0.73,
  },
  roadLeft: { left: 38, borderLeftWidth: 0 },
  roadRight: { right: 38, borderRightWidth: 0 },
  mission: {
    minHeight: 63,
    flexDirection: "row",
    alignItems: "center",
    width: "86%",
    zIndex: 1,
    borderRadius: 14,
    paddingVertical: 4,
  },
  missionLeft: { alignSelf: "flex-start" },
  missionRight: { alignSelf: "flex-end", flexDirection: "row-reverse" },
  missionFocus: {
    backgroundColor: "rgba(30, 140, 55, 0.12)",
    borderWidth: 1.5,
    borderColor: "#1F8A3A",
  },
  marker: {
    width: 57,
    height: 57,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "#FFFFFF",
    shadowColor: "#1A2E18",
    shadowOpacity: 0.22,
    shadowRadius: 4,
    elevation: 4,
  },
  markerCompleted: { backgroundColor: "#2FA542" },
  markerActive: {
    width: 67,
    height: 67,
    borderRadius: 34,
    backgroundColor: "#138536",
    borderColor: "#CEFF88",
  },
  markerFocus: {
    borderColor: "#FFD54F",
    borderWidth: 5,
  },
  markerLocked: { backgroundColor: "#A3A8A5" },
  missionCopy: { flex: 1, paddingHorizontal: 10 },
  missionCopyLocked: { opacity: 0.84 },
  missionSubject: {
    color: "#183B22",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  missionTopic: {
    color: "#102A43",
    fontSize: 14,
    lineHeight: 17,
    fontWeight: "900",
    marginTop: 1,
  },
  textLocked: { color: "#4B5351" },
  startChip: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#16823A",
    borderRadius: 9,
    paddingVertical: 4,
    paddingHorizontal: 7,
    marginTop: 5,
  },
  startChipText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontWeight: "900",
    letterSpacing: 0.25,
  },
  completedText: { color: "#187835", fontSize: 9, fontWeight: "900", marginTop: 4 },
  focusLockedText: { color: "#B8860B", fontSize: 9, fontWeight: "800", marginTop: 3 },
  more: {
    color: "#53735A",
    textAlign: "center",
    fontWeight: "800",
    fontSize: 11,
    marginTop: 12,
  },
  pressed: { opacity: 0.72, transform: [{ scale: 0.98 }] },
});
