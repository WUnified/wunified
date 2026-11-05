# Design System

How WUnified's look is defined and kept consistent across screens built by different
people. Read this before building or restyling any screen.

## Source of truth

- **Design:** the WUnified Figma file (`rtyvASSxuc7nfqda38y7gS`). Pages: **Foundations**
  (text styles), **Components** (icons, tab bar, cards, chips, message rows), **Screens**
  (Home, Marketplace, Chat).
- **Code:** `src/constants/colors.ts` and `src/constants/typography.ts`. Screens and
  components reference these tokens; they never hard-code hex values, font families, or
  sizes.

Figma is a guide, not a pixel spec. When a Figma value has no token, add a token (and
agree it with the team) rather than hard-coding the value in a screen. That is what keeps
screens built by different people looking like one app.

## Colors

Figma color variables map onto `Colors` as follows.

| Figma variable   | Value       | Code token          | Used for                          |
|------------------|-------------|---------------------|-----------------------------------|
| `bg/primary`     | `#08122B`   | `Colors.background` | Screen background                 |
| `bg/surface`     | `#12234C`   | `Colors.surface`    | Cards, inbox list                 |
| `bg/subtle`      | `#1E336C`   | `Colors.subtle`     | Search bar, icon tiles            |
| `bg/glass`       | `#12234CD9` | `Colors.glass`      | Floating tab bar                  |
| `border`         | `#1E336C`   | `Colors.border`     | Hairlines, outlines               |
| `accent/yellow`  | `#FFC82C`   | `Colors.primary`    | Primary actions, badges, active tab |
| `text/on-accent` | `#07122A`   | `Colors.onPrimary`  | Text/icons on yellow              |
| `text/primary`   | `#FFFFFF`   | `Colors.text`       | Main text                         |
| `text/secondary` | `#8F9EBA`   | `Colors.textDim`    | Secondary text, placeholders      |

`Colors.textMuted` currently has the same value as `textDim`. Figma has a single
secondary text color, so prefer `textDim` in new code.

`bg/subtle` and `border` share a value but mean different things (a fill versus a line),
so they are separate tokens and may diverge later.

Login and signup share the auth form presentation in
`src/features/auth/screens/AuthScreen.styles.ts`; use these same tokens and logo asset
when adjusting either screen so their visual treatment stays consistent.

## Radius

| Figma variable | Value | Code token      | Used for                        |
|----------------|-------|-----------------|---------------------------------|
| —              | 8     | `Radius.sm`     | Small controls                  |
| `radius/md`    | 12    | `Radius.md`     | Inputs, icon tiles              |
| —              | 16    | `Radius.lg`     | List cards (chat inbox)         |
| —              | 24    | `Radius.xl`     | Large cards (profile)           |
| `radius/full`  | 999   | `Radius.full`   | Pills, avatars, tab bar         |

## Typography

Fonts are Poppins (headings) and DM Sans (body), loaded in `app/_layout.tsx`. Figma text
styles map onto `Typography`:

| Figma style          | Spec                                 | Code token                       |
|----------------------|--------------------------------------|----------------------------------|
| `Title/Screen`       | Poppins ExtraBold 24/32              | `Typography.screenTitle`         |
| `Title/Section`      | Poppins Bold 20/28                   | `Typography.sectionTitle`        |
| `Section/Eyebrow`    | Poppins Bold 14/18 uppercase         | `Typography.sectionEyebrow`      |
| `Title/Card`         | Poppins SemiBold 15/22               | `Typography.cardTitle`           |
| `Title/Feature Card` | Poppins Bold 18/24                   | `Typography.featureCardTitle`    |
| `Body/Regular`       | DM Sans Regular 15/22                | `Typography.body`                |
| `Body/Strong`        | DM Sans SemiBold 15/22 (see below)  | `Typography.bodyStrong`          |
| `Caption`            | DM Sans Regular 13/18                | `Typography.caption`             |
| `Label`              | DM Sans Bold 11/14, +0.5, uppercase  | `Typography.badge`               |
| `Button`             | Poppins Bold 16/24                   | `Typography.button`              |
| `Price`              | Poppins SemiBold 16/24 in Figma      | `Typography.price` (Bold)        |

Text styles define font, size, and line height only. Color is applied per use, so the
same style works on dark backgrounds and on yellow.

## Open decisions

These differ between Figma and code. Existing screens depend on the current code values,
so they were left unchanged until the team agrees.

- **`Body/Strong` font.** Figma uses Inter, which the app does not load. Code uses DM Sans
  SemiBold instead, which reads almost identically and avoids a new font dependency.
  Proposed: switch the Figma style to DM Sans.
- **`Label` versus `Typography.label`.** Figma's `Label` is DM Sans Bold 11/14 uppercase
  (badges, counts). The existing `Typography.label` is DM Sans SemiBold 13/18 and is used
  by marketplace screens. The Figma style is exposed as `Typography.badge` so neither
  breaks; pick one name and value later.
- **`Price` weight.** Figma is SemiBold, code is Bold. Pick one.
- **Floating tab bar.** Figma's tab bar is a floating glass pill with a yellow active
  item. It changes every screen, so adopt it as its own change, not inside a feature PR.

## Adding or changing a token

1. Check Figma for the existing style or variable first.
2. Add the token to `colors.ts` or `typography.ts`, and add a row to the tables above.
3. Changing an existing token restyles every screen that uses it. Check usages with
   `grep -rn "Typography.<name>" src` and tell the team before merging.
