---
name: skillkart-theme
description: Theme and dark mode management in SkillKart — ThemeContext, localStorage persistence, OS preference listening, and Tailwind dark classes.
---

# SkillKart Theme and Dark Mode Guidelines

Instructions on how to manage UI themes and dark mode in the SkillKart LMS workspace.

---

## Overview

- **Context Location:** `frontend/src/context/ThemeContext.tsx`
- **Toggle Component:** `frontend/src/components/common/ThemeToggle.tsx`
- **Styles Location:** `frontend/src/styles/tailwind.css`
- **Root Provider:** `frontend/src/main.tsx`

---

## How It Works

1. `ThemeProvider` wraps the application and exposes `theme` (`'light' | 'dark' | 'system'`), `resolvedTheme` (`'light' | 'dark'`), `setTheme`, and `toggleTheme`.
2. Preference is persisted in `localStorage` under `skillkart_theme`.
3. In `'system'` mode, a media query listener observes `(prefers-color-scheme: dark)` changes.
4. When `resolvedTheme === 'dark'`, the `.dark` class is applied to `document.documentElement` (`<html class="dark">`) and `style.colorScheme` is set.
5. Tailwind CSS and custom component overrides in `tailwind.css` apply the dark theme palette.

---

## Key Rules

- When building new components, always support dark mode using Tailwind `dark:` prefix utility classes or semantic component styles.
- Ensure high text contrast (`#f8fafc` text on `#0f172a` / `#1e293b` backgrounds).
- Place interactive controls like `ThemeToggle` in global navigation headers.

---

## Code Example

```tsx
import { useTheme } from '@/context/ThemeContext';

export function MyComponent() {
  const { resolvedTheme, toggleTheme } = useTheme();
  return (
    <button onClick={toggleTheme}>
      Current theme: {resolvedTheme}
    </button>
  );
}
```
