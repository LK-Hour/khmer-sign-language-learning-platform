"use client";

import SnackbarProvider from "@/components/snackbar/snackbar-provider";
import ReactQueryProvider from "@/providers/ReactQueryProvider";
import ThemeStylesProvider from "@/providers/ThemeStylesProvider";

type AppProvidersProps = {
  children: React.ReactNode;
};

export default function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeStylesProvider>
      <ReactQueryProvider>
        <SnackbarProvider>{children}</SnackbarProvider>
      </ReactQueryProvider>
    </ThemeStylesProvider>
  );
}
