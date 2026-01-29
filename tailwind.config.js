/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: "#059669", // Deep Emerald
                    dark: "#047857",    // Darker Emerald
                    light: "#10B981",   // Bright Emerald
                },
                secondary: "#64748b",
                accent: {
                    DEFAULT: "#D97706", // Warm Amber Gold
                    light: "#FBBF24",   // Bright Gold
                    dark: "#B45309",    // Deep Bronze
                },
                success: {
                    DEFAULT: "#059669", // Deep Emerald
                    light: "#10B981",   // Bright Emerald
                },
                warning: {
                    DEFAULT: "#D97706", // Rich Amber
                    light: "#F59E0B",   // Bright Amber
                },
                error: {
                    DEFAULT: "#DC2626", // Deep Red
                    light: "#EF4444",   // Bright Red
                },
                background: {
                    DEFAULT: "#030712", // Near Black
                    surface: "#0F172A", // Slate 900
                    elevated: "#1E293B", // Slate 800
                },
                text: {
                    main: "#F8FAFC",   // Crisp White
                    secondary: "#CBD5E1", // Slate 300
                    muted: "#94A3B8",     // Slate 400
                },
                dark: "#0f172a", // Keep for backward compatibility if needed, but background.surface is preferred
                card: "rgba(30, 41, 59, 0.7)", // Transparent dark card
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
