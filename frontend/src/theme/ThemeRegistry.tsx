import ThemeStylesProvider from "@/providers/ThemeStylesProvider";

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ThemeStylesProvider>{children}</ThemeStylesProvider>;
}
