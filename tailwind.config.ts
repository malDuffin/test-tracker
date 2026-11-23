import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        primary: { DEFAULT: "hsl(var(--primary))", foreground: "hsl(var(--primary-foreground))" },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: "hsl(var(--accent))",
        yes: "hsl(var(--yes))",
        partly: "hsl(var(--partly))",
        no: "hsl(var(--no))",
        unknown: "hsl(var(--unknown))",
      },
      fontFamily: {
        sans: ["DM Sans", "Manrope", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["Crimson Pro", "Literata", "ui-serif", "Georgia", "serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
