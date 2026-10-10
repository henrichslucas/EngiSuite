import { mount } from 'svelte'
import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/faustina/wght.css'
import './app.css'
import App from './App.svelte'

export default mount(App, { target: document.getElementById('app') })

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}))
}
