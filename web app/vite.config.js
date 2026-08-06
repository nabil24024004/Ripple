import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    watch: {
      ignored: ['**/*.mp4', '**/*.webm', '**/screenshots-and-demovideo/**'],
    },
  },
})
