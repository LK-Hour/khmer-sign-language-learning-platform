# Layout

Responsive **web** layout — not a mobile app shell.

## Active

| Component | Role |
|---|---|
| `MainHeader` | Sticky top navbar (logo left, links right) |
| `AppLayout` | Wraps all `[locale]` pages with `MainHeader` |
| `PageContainer` | Standard `Container maxWidth="xl"` wrapper |
| `ResponsiveHidden` | Breakpoint visibility (`mdDown`, `mdUp`, etc.) |

## Layout conventions

Always wrap page content in `PageContainer`:

```tsx
import { Grid } from "@/components/mui";
import { PageContainer, ResponsiveHidden } from "@/components/layout";

export default function MyPage() {
  return (
    <PageContainer>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 4 }}>Left content</Grid>
        <Grid size={{ xs: 12, md: 8 }}>Right content</Grid>
      </Grid>

      <ResponsiveHidden mdDown>
        Visible only on large screens (lg, xl)
      </ResponsiveHidden>
    </PageContainer>
  );
}
```

### Breakpoints

| Key | Min width | Typical use |
|---|---|---|
| `xs` | 0px | Mobile |
| `md` | 900px | Tablet / small desktop |
| `lg` | 1200px | Desktop |
| `xl` | 1536px | Wide desktop |

### Visibility (`ResponsiveHidden`)

MUI v9 removed `<Hidden />`. Use `ResponsiveHidden` instead:

| Prop | Meaning |
|---|---|
| `smDown` | Hidden on xs, sm — visible on md, lg, xl |
| `mdDown` | Hidden on xs, sm, md — visible on lg, xl |
| `mdUp` | Hidden on md, lg, xl — visible on xs, sm |
| `lgDown` | Hidden on xs–lg — visible on xl only |
| `lgUp` | Hidden on lg, xl — visible on xs, sm, md |

`MainHeader` is mounted in `AppLayout` — do not import it on individual pages.

## Legacy (unused)

`AppShell`, `AppHeader`, and `BottomNav` are from an older mobile-style shell.
