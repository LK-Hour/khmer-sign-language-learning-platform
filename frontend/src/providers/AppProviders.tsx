"use client";

import SnackbarProvider from "@/components/snackbar/snackbar-provider";
import { AuthProvider } from "@/features/auth/components";
import ThemeStylesProvider from "@/providers/ThemeStylesProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeStylesProvider>
      <SnackbarProvider>
        <AuthProvider>{children}</AuthProvider>
      </SnackbarProvider>
    </ThemeStylesProvider>
  );
}
