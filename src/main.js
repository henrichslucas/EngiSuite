import { mount } from 'svelte'
import '@fontsource-variable/geist/wght.css'
import '@fontsource-variable/faustina/wght.css'
import './app.css'
import App from './App.svelte'

export default mount(App, { target: document.getElementById('app') })
