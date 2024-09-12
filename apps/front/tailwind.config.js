import { fontFamily } from 'tailwindcss/defaultTheme'
import daisyui from 'daisyui'

/** @type {import('tailwindcss').Config} */
const config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	safelist: ['dark'],
	plugins: [daisyui],
	daisyui: {
		themes: [
			'dark',
			'light',
			'cyberpunk',
			'cupcake',
			{
				spring: {
					primary: '#A7F3D0',
					secondary: '#FBCFE8',
					accent: '#FEF9C3',
					neutral: '#BFDBFE',
					'base-100': '#FFFFFF',
					info: '#BFDBFE',
					success: '#A7F3D0',
					warning: '#FEF9C3',
					error: '#FBCFE8'
				}
			},
			{
				summer: {
					primary: '#38BDF8',
					secondary: '#F472B6',
					accent: '#FDE047',
					neutral: '#FB923C',
					'base-100': '#FFFFFF',
					info: '#38BDF8',
					success: '#FDE047',
					warning: '#FB923C',
					error: '#F472B6'
				}
			},
			{
				autumn: {
					primary: '#F97316',
					secondary: '#EF4444',
					accent: '#FACC15',
					neutral: '#9A3412',
					'base-100': '#FFFFFF',
					info: '#FACC15',
					success: '#F97316',
					warning: '#FACC15',
					error: '#EF4444'
				}
			},
			{
				winter: {
					primary: '#0EA5E9',
					secondary: '#94A3B8',
					accent: '#F1F5F9',
					neutral: '#1E3A8A',
					'base-100': '#FFFFFF',
					info: '#0EA5E9',
					success: '#F1F5F9',
					warning: '#94A3B8',
					error: '#1E3A8A'
				}
			}
		]
	},
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			colors: {
				border: 'hsl(var(--border) / <alpha-value>)',
				input: 'hsl(var(--input) / <alpha-value>)',
				ring: 'hsl(var(--ring) / <alpha-value>)',
				background: 'hsl(var(--background) / <alpha-value>)',
				foreground: 'hsl(var(--foreground) / <alpha-value>)',
				destructive: {
					DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
					foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
					foreground: 'hsl(var(--muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
					foreground: 'hsl(var(--accent-foreground) / <alpha-value>)'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
					foreground: 'hsl(var(--popover-foreground) / <alpha-value>)'
				},
				card: {
					DEFAULT: 'hsl(var(--card) / <alpha-value>)',
					foreground: 'hsl(var(--card-foreground) / <alpha-value>)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			fontFamily: {
				sans: [...fontFamily.sans]
			}
		}
	}
}

export default config
