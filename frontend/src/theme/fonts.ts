import localFont from "next/font/local";

export const niradei = localFont({
  src: [
    {
      path: "../../public/Fonts/CADTNiradei/Niradei-Regular.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/Fonts/CADTNiradei/Niradei-Bold.ttf",
      weight: "600",
      style: "normal",
    },
  ],
  variable: "--font-niradei",
  display: "swap",
});

export const kohSantepheap = localFont({
  src: [
    {
      path: "../../public/Fonts/Koh_Santepheap/KohSantepheap-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/Fonts/Koh_Santepheap/KohSantepheap-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/Fonts/Koh_Santepheap/KohSantepheap-Bold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/Fonts/Koh_Santepheap/KohSantepheap-Black.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-koh-santepheap",
  display: "swap",
});

export const mono = localFont({
  src: "../../public/Fonts/CADTMonoDisplay/CADTMonoDisplay-Regular.ttf",
  variable: "--font-mono-local",
  display: "swap",
});

export const appFonts = `${niradei.variable} ${kohSantepheap.variable} ${mono.variable}`;

export const fontFamilies = {
  english: 'var(--font-niradei), "Niradei", system-ui, sans-serif',
  khmer: 'var(--font-koh-santepheap), "Koh Santepheap", serif',
  sans:
    'var(--font-niradei), var(--font-koh-santepheap), system-ui, sans-serif',
  mono: 'var(--font-mono-local), ui-monospace, monospace',
} as const;
