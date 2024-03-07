/** @type {import('tailwindcss').Config} */
import plugin from 'tailwindcss/plugin'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontSize: {
        '4xl': '3rem',
        '5xl': '8rem',
      }
    }
  },
  plugins: [plugin(({ addUtilities }) => {
    addUtilities({
      '.center': {
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)'
      }
    })
  })],
}