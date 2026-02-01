import type { Config } from "tailwindcss"
import defaultTheme from "tailwindcss/defaultTheme"

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          900: '#0402C3',
          800: '#06044A',
        },
        neon: {
          primary: '#5E55F0',
          secondary: '#8FA7FF',
          accent: '#EB9EFF',
        },
      },
      fontFamily: {
        sans: ["Inter", ...defaultTheme.fontFamily.sans],
      },
      boxShadow: {
        glow: '0 0 40px rgba(138, 92, 246, 0.25)',
        innerGlow: 'inset 0 0 20px rgba(0, 245, 255, 0.14)',
      },
      backgroundImage: {
        'neon-grid': 'radial-gradient(circle at 20% 20%, rgba(0,245,255,0.18), transparent 45%), radial-gradient(circle at 80% 10%, rgba(255,84,198,0.18), transparent 35%), radial-gradient(circle at 50% 80%, rgba(156,255,87,0.12), transparent 50%)',
      },
    },
  },
  plugins: [],
} satisfies Config
