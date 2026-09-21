import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { router, useLocalSearchParams } from "expo-router";

import { DuoduoMascot } from "@/components/duoduo-mascot";
import { PrimaryButton } from "@/components/primary-button";
import { ScreenContainer } from "@/components/screen-container";
import {
  formatBRL,
  paywallCopy,
  PRO_FEATURES,
  PRICING,
  type PaywallReason,
} from "@/lib/subscription";
import { useSubscription } from "@/lib/subscription-store";
import { haptic } from "@/lib/haptics";

export default function PaywallScreen() {
  const params = useLocalSearchParams<{ reason?: string }>();
  const reason = (params.reason as PaywallReason) || "generic";
  const copy = paywallCopy(reason);
  const { activateProMock, isPro } = useSubscription();

  const firstPrice = formatBRL(PRICING.firstMonthCents);
  const normalPrice = formatBRL(PRICING.proMonthlyCents);

  const handleSubscribe = () => {
    haptic.success();
    // Mock até integrar Play Billing / RevenueCat
    activateProMock();
    router.back();
  };

  if (isPro) {
    return (
      <ScreenContainer className="px-5">
        <View style={styles.center}>
          <DuoduoMascot size={72} />
          <Text style={styles.title}>Você já é Pro</Text>
          <Text style={styles.body}>Aproveite estudo ilimitado e todos os recursos táticos.</Text>
          <PrimaryButton label="Voltar" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer edges={["top", "bottom", "left", "right"]} className="px-5">
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <MaterialIcons name="close" size={26} color="#31513A" />
        </Pressable>
        <Text style={styles.topTitle}>Dino Pro</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <DuoduoMascot size={72} />
          <Text style={styles.title}>{copy.title}</Text>
          <Text style={styles.body}>{copy.body}</Text>
        </View>

        <View style={styles.priceCard}>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {PRICING.firstMonthDiscountPercent}% OFF no 1º mês
            </Text>
          </View>
          <Text style={styles.priceMain}>{firstPrice}</Text>
          <Text style={styles.priceSub}>
            depois {normalPrice}/mês · cancele quando quiser
          </Text>
        </View>

        <Text style={styles.featuresTitle}>Tudo que libera no Pro</Text>
        <View style={styles.features}>
          {PRO_FEATURES.map((feature) => (
            <View key={feature} style={styles.featureRow}>
              <MaterialIcons name="check-circle" size={20} color="#1F8A3A" />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.legal}>
          Pagamento real será ativado na publicação na Play Store. Por enquanto este botão simula a
          assinatura Pro neste aparelho para você testar a experiência.
        </Text>
      </ScrollView>

      <View style={styles.dock}>
        <PrimaryButton label={`Assinar por ${firstPrice}`} onPress={handleSubscribe} />
        <Pressable onPress={() => router.back()} style={styles.later}>
          <Text style={styles.laterText}>Continuar no plano gratuito</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    marginBottom: 8,
  },
  topTitle: { color: "#1A3A24", fontSize: 16, fontWeight: "900" },
  content: { paddingBottom: 16 },
  hero: { alignItems: "center", marginBottom: 18 },
  title: {
    color: "#102A43",
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 30,
  },
  body: {
    color: "#4A6354",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 8,
  },
  priceCard: {
    backgroundColor: "#EAF6E8",
    borderRadius: 18,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#B6DFB8",
    marginBottom: 20,
  },
  discountBadge: {
    backgroundColor: "#1F8A3A",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  discountText: { color: "#FFFFFF", fontSize: 12, fontWeight: "900" },
  priceMain: { color: "#0F3D1C", fontSize: 36, fontWeight: "900" },
  priceSub: { color: "#3A6B45", fontSize: 13, fontWeight: "700", marginTop: 4 },
  featuresTitle: {
    color: "#102A43",
    fontSize: 15,
    fontWeight: "900",
    marginBottom: 10,
  },
  features: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureText: { flex: 1, color: "#243B53", fontSize: 14, fontWeight: "700" },
  legal: { color: "#7A8B7E", fontSize: 11, lineHeight: 16, textAlign: "center" },
  dock: { gap: 8, paddingTop: 10, paddingBottom: 6 },
  later: { alignItems: "center", paddingVertical: 10 },
  laterText: { color: "#5A7160", fontSize: 14, fontWeight: "800" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 20 },
});
