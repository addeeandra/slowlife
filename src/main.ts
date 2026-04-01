import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './styles/tokens.css'
import { getDb } from './core/db'
import { seedIfEmpty } from './core/seed'

async function init() {
  const app = createApp(App)
  app.use(router)
  app.mount('#app')

  try {
    const db = await getDb()
    await seedIfEmpty(db)
  } catch (e) {
    console.error('failed to initialize database:', e)
  }
}

init()
