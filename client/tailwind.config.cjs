/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                brand: {
                    primary: '#CCCFBA',
                    secondary: '#540023',
                    'secondary-light': 'rgba(84, 0, 35, 0.1)',
                },
                civic: {
                    dark: '#0a0e1a',
                    darker: '#060911',
                    card: '#111827',
                    border: '#1e293b',
                    orange: '#f97316',
                    'orange-glow': '#fb923c',
                    blue: '#3b82f6',
                    'blue-glow': '#60a5fa',
                    purple: '#a855f7',
                    green: '#22c55e',
                    muted: '#94a3b8',
                },
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'float-delay': 'float 6s ease-in-out 2s infinite',
                'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
                'slide-up': 'slide-up 0.5s ease-out',
                'fade-in': 'fade-in 0.5s ease-out',
                'ripple': 'ripple 0.6s linear',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-12px)' },
                },
                'glow-pulse': {
                    '0%, 100%': { boxShadow: '0 0 20px rgba(84,0,35,0.1)' },
                    '50%': { boxShadow: '0 0 40px rgba(84,0,35,0.2)' },
                },
                'slide-up': {
                    '0%': { opacity: '0', transform: 'translateY(20px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                },
                'fade-in': {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                ripple: {
                    '0%': { transform: 'scale(0)', opacity: '1' },
                    '100%': { transform: 'scale(4)', opacity: '0' },
                }
            },
            borderRadius: {
                '2xl': '1rem',
                '3xl': '1.5rem',
            },
            boxShadow: {
                'soft': '0 10px 25px -5px rgba(84, 0, 35, 0.05), 0 8px 10px -6px rgba(84, 0, 35, 0.05)',
                'card-hover': '0 20px 25px -5px rgba(84, 0, 35, 0.1), 0 10px 10px -5px rgba(84, 0, 35, 0.04)',
            }
        },
    },
    plugins: [],
}
