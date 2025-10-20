import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },

        // Add custom DCCI colors here
        dcciPrettyPink: {
          50: "#ffe5e2",
          100: "#ffc6bb",
          200: "#fbb1a4",
          300: "#f8998d",
          400: "#f27f76",
          500: "#eb6760",
          600: "#e05549", // <- this is what you can use as bg-dcciPrettyPink-600
          700: "#c84332",
          800: "#a83220",
          900: "#0e0908ff",
        },
        dcciGreen: "#b8e6baff",
        dcciBrown: "#bb9182ff",
        dcciYellow: "#faf3b4ff",
        dcciBlueGray: "#9fcde4ff",
        dcciLightGray: "#abababff",
        PrettyPink: "#FCC6BB",
        earthyLightBrown: '#916A4F', // not using?
        earthyTan: '#E1CAB2',
        earthyBrown: '#76583F',
        earthyGreen: '#758A48',
        earthyLightGreen: '#899D5E', // alternate background color
        earthyLIGHTGreen: '#A3B97C',
        earthyBlue: '#2B7180', // initial background color
        grayText: "#8F8F8F",
        headerDark: "#58412F", // don't use
        errorRed: "#FB3939",
        white: "#FFFFFF",
        inputBg: "#EEEEEE",
        inputBorder: "#ACACAC",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        lalezar: ['"Lalezar"', 'cursive'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
