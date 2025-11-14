/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Cool & Professional Blue Palette
        primary: {
          DEFAULT: '#3B82F6',    // Bright Blue - Trust & Energy
          light: '#60A5FA',      // Lighter Blue - Friendly & Clear
          dark: '#2563EB'        // Deep Blue - Confidence & Strength
        },
        secondary: {
          DEFAULT: '#1E3A8A',    // Navy Blue - Stability & Professionalism
          light: '#3B82F6',      // Bright Blue for accents
          dark: '#1E40AF'        // Deep Navy for focus
        },
        accent: {
          DEFAULT: '#38BDF8',    // Sky Blue - Highlights
          light: '#BAE6FD',      // Soft Light Blue
          dark: '#0284C7'        // Vibrant Blue Accent
        },
        success: '#22C55E',      // Fresh Green - Success
        warning: '#FACC15',      // Soft Yellow - Caution
        error: '#EF4444',        // Calm Red - Error
        info: '#3B82F6',         // Blue - Info tone
        
        // Background Colors - Cool & Clean
        background: {
          DEFAULT: '#F8FAFC',    // Very Light Blue Gray
          secondary: '#F1F5F9'   // Slightly Darker Blue Gray
        },
        surface: {
          DEFAULT: '#FFFFFF',    // Pure White
          cool: '#F9FAFB'        // Cool White tone
        },
        
        // Text Colors - Readable & Calm
        'text-primary': '#1E293B',    // Slate Gray - Readable
        'text-secondary': '#475569',  // Softer Gray
        'text-muted': '#94A3B8',      // Muted Blue-Gray
        'text-accent': '#3B82F6',     // Blue accent for highlights
        
        // Border & Divider Colors - Subtle Blues
        border: {
          DEFAULT: '#E2E8F0',    // Soft Blue-Gray Divider
          light: '#F1F5F9',      // Very Light Blue
          dark: '#CBD5E1'        // Darker Border
        },
        
        // Shadow Colors - Cool & Soft
        shadow: {
          DEFAULT: 'rgba(59, 130, 246, 0.1)',   // Blue Shadow
          light: 'rgba(59, 130, 246, 0.05)',    // Light Blue Shadow
          dark: 'rgba(59, 130, 246, 0.2)'       // Deeper Blue Shadow
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
