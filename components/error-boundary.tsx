import React, { Component, ErrorInfo, ReactNode } from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { PrimaryButton } from "./primary-button";

type Props = {
  children: ReactNode;
  fallbackTitle?: string;
};

type State = {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
};

/**
 * Global Error Boundary – prevents white screen of death.
 * Shows a friendly recovery UI instead of crashing silently.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error);
    console.error("[ErrorBoundary] Component stack:", errorInfo.componentStack);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const title = this.props.fallbackTitle ?? "Algo deu errado";
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>🦖</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>
            O Dino encontrou um obstáculo inesperado. Tente novamente.
          </Text>

          {__DEV__ && this.state.error && (
            <ScrollView style={styles.errorBox}>
              <Text style={styles.errorText}>{this.state.error.toString()}</Text>
              {this.state.errorInfo?.componentStack && (
                <Text style={styles.stackText}>{this.state.errorInfo.componentStack}</Text>
              )}
            </ScrollView>
          )}

          <PrimaryButton label="Tentar novamente" onPress={this.handleRetry} />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F8F3",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  errorBox: {
    maxHeight: 180,
    width: "100%",
    backgroundColor: "#FFF0F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 13,
    color: "#B00020",
    fontFamily: "monospace",
  },
  stackText: {
    fontSize: 11,
    color: "#888",
    marginTop: 8,
    fontFamily: "monospace",
  },
});
