# DevTrack v2 design system

Tokens live in `design/tokens.css` (`--v2-*`). Themes: light (`:root`) and dark (`[data-theme="dark"]`).

## Tokens
- **Brand:** `--v2-primary`, `--v2-accent`, muted variants
- **Surfaces:** `--v2-bg`, `--v2-bg-elevated`, `--v2-bg-muted`, borders
- **Text:** `--v2-fg`, `--v2-fg-muted`, `--v2-fg-subtle`
- **Semantic:** success / warning / danger / info
- **Platforms:** `--v2-cf|lc|hr|ac|cc|gfg` (see `design/platforms.ts`)
- **Space:** 4px base (`--v2-space-1` … `--v2-space-12`)
- **Radii / shadows / z-index / layout chrome heights**

## Components (`components/`)
Button, Input, Card, Badge/PlatformBadge, Skeleton, EmptyState, BottomSheet

## Shell (`shell/`)
AppShell, BottomNav (mobile), Sidebar (tablet rail + desktop), TopBar, ThemeProvider

## Breakpoints (Tailwind)
- Mobile: default + bottom nav
- Tablet: `md` icon rail
- Desktop: `lg` labeled sidebar

Do not hardcode colors outside tokens.
