import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base =
    command === 'build'
      ? (env.VITE_BASE || '/explorateur/frontend/dist/')
      : '/'

  return {
    plugins: [react()],
    base,
    // Frontend de développement : port 5173 (Vite)
    // Backend PHP (Apache/XAMPP) : généralement port 80, parfois 8080
    server: { port: 5173 },
  }
})
