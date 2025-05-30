/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
        './pages/**/*.{js,jsx}',
        './components/**/*.{js,jsx}',
        './app/**/*.{js,jsx}',
        './src/**/*.{js,jsx}',
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
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
  		colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
  			primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                    50: '#E6F7FF',
                    100: '#BAE7FF',
                    200: '#91D5FF',
                    300: '#69C0FF',
                    400: '#40A9FF',
                    500: '#1890FF',
                    600: '#096DD9',
                    700: '#0050B3',
                    800: '#003A8C',
                    900: '#002766'
  			},
  			secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                    50: '#F0F5FF',
                    100: '#D6E4FF',
                    200: '#ADC6FF',
                    300: '#85A5FF',
                    400: '#597EF7',
                    500: '#2F54EB',
                    600: '#1D39C4',
                    700: '#10239E',
                    800: '#061178',
                    900: '#030852'
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
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                success: {
                    light: '#B7EB8F',
                    DEFAULT: '#52C41A',
                    dark: '#389E0D'
                },
                warning: {
                    light: '#FFE58F',
                    DEFAULT: '#FAAD14',
                    dark: '#D48806'
  			},
                error: {
                    light: '#FFA39E',
                    DEFAULT: '#F5222D',
                    dark: '#CF1322'
                },
                info: {
                    light: '#91D5FF',
                    DEFAULT: '#1890FF',
                    dark: '#096DD9'
                }
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
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
                "collapsible-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-collapsible-content-height)" },
                },
                "collapsible-up": {
                    from: { height: "var(--radix-collapsible-content-height)" },
                    to: { height: "0" },
                },
  		},
  		animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "collapsible-down": "collapsible-down 0.2s ease-out",
                "collapsible-up": "collapsible-up 0.2s ease-out",
            },
            spacing: {
                '72': '18rem',
                '84': '21rem',
                '96': '24rem',
            },
            minHeight: {
                '0': '0',
                '1/4': '25%',
                '1/2': '50%',
                '3/4': '75%',
                'full': '100%',
            },
            maxHeight: {
                '0': '0',
                '1/4': '25%',
                '1/2': '50%',
                '3/4': '75%',
                'full': '100%',
            },
            zIndex: {
                '0': '0',
                '10': '10',
                '20': '20',
                '30': '30',
                '40': '40',
                '50': '50',
                'auto': 'auto',
            },
            typography: {
                DEFAULT: {
                    css: {
                        maxWidth: '65ch',
                        color: 'inherit',
                        a: {
                            color: 'inherit',
                            textDecoration: 'none',
                            fontWeight: '500',
                        },
                        strong: {
                            color: 'inherit',
                            fontWeight: '600',
                        },
                        code: {
                            color: 'inherit',
                            fontWeight: '400',
                        },
                        h1: {
                            color: 'inherit',
                            fontWeight: '800',
                        },
                        h2: {
                            color: 'inherit',
                            fontWeight: '700',
                        },
                        h3: {
                            color: 'inherit',
                            fontWeight: '600',
                        },
                        h4: {
                            color: 'inherit',
                            fontWeight: '600',
                        },
                    },
                },
            },
        },
  },
    plugins: [
        require("tailwindcss-animate"),
        require('@tailwindcss/typography'),
        require('@tailwindcss/forms'),
        require('@tailwindcss/aspect-ratio'),
    ],
}