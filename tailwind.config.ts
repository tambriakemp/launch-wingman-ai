import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        'xs': ['0.8125rem', { lineHeight: '1.25rem' }], // 13px instead of default 12px
      },
      fontFamily: {
        sans: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
        serif: ['"Playfair Display"', '"Iowan Old Style"', '"Apple Garamond"', "Georgia", '"Times New Roman"', "serif"],
        display: ['Fraunces', '"Iowan Old Style"', '"Apple Garamond"', "Georgia", '"Times New Roman"', "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        highlight: {
          DEFAULT: "hsl(var(--highlight))",
          foreground: "hsl(var(--highlight-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
        },
        info: {
          DEFAULT: "hsl(var(--info))",
          foreground: "hsl(var(--info-foreground))",
        },
        callout: {
          DEFAULT: "hsl(var(--callout))",
          foreground: "hsl(var(--callout-foreground))",
          accent: "hsl(var(--callout-accent))",
        },
        /* === Editorial palette (Launch Tasks design system) === */
        paper: {
          50: "hsl(var(--paper-50))",
          100: "hsl(var(--paper-100))",
          200: "hsl(var(--paper-200))",
          300: "hsl(var(--paper-300))",
        },
        ink: {
          900: "hsl(var(--ink-900))",
          800: "hsl(var(--ink-800))",
          300: "hsl(var(--ink-300))",
          100: "hsl(var(--ink-100))",
        },
        terracotta: {
          DEFAULT: "hsl(var(--terracotta-500))",
          500: "hsl(var(--terracotta-500))",
          600: "hsl(var(--terracotta-600))",
        },
        clay: {
          100: "hsl(var(--clay-100))",
          200: "hsl(var(--clay-200))",
        },
        moss: {
          100: "hsl(var(--moss-100))",
          500: "hsl(var(--moss-500))",
          700: "hsl(var(--moss-700))",
        },
        plum: {
          100: "hsl(var(--plum-100))",
          700: "hsl(var(--plum-700))",
        },
        hairline: "hsl(var(--border-hairline))",
        "fg-secondary": "hsl(var(--fg-secondary))",
        "fg-muted": "hsl(var(--fg-muted))",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
