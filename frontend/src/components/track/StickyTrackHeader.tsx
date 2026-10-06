"use client";

import { Box } from "@mui/material";
import { useEffect, useRef, useState } from "react";

import { MAIN_HEADER_HEIGHT } from "@/components/layout/header-nav";
import { KslColors } from "@/theme/theme";

/**
 * Keeps a track page's title + toolbar pinned under the site header.
 * The divider/shadow only appears once it is actually stuck, so the page
 * looks unchanged at the top.
 */
export default function StickyTrackHeader({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const top = ref.current?.getBoundingClientRect().top;
      const sticky = ref.current ? getComputedStyle(ref.current).position === "sticky" : false;
      setStuck(sticky && top !== undefined && window.scrollY > 0 && top <= MAIN_HEADER_HEIGHT + 0.5);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <Box
      ref={ref}
      sx={{
        // Sticky from tablet width up; on phones the stacked header would
        // cover a quarter of the screen, so it scrolls normally there.
        position: { xs: "static", md: "sticky" },
        top: MAIN_HEADER_HEIGHT,
        zIndex: 5,
        // `&&` beats Stack's child-margin reset so the bar can bleed to the
        // PageContainer edges and content never peeks past its sides.
        "&&": { mx: { xs: 0, md: -3 } },
        px: { xs: 0, md: 3 },
        // Constant padding: changing height on stick would shove the content below.
        py: { xs: 0, md: 1.5 },
        bgcolor: "rgba(255, 255, 255, 0.94)",
        backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${stuck ? KslColors.border : "transparent"}`,
        boxShadow: stuck ? "0 8px 20px -14px rgba(20, 40, 76, 0.35)" : "none",
        transition: "border-color 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      {children}
    </Box>
  );
}
