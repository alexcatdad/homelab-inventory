import { mount } from 'svelte';
import App from './App.svelte';
import './styles/app.css';

// Initialize i18n
import { initI18n } from './lib/i18n';

// Initialize i18n then mount the app
initI18n().then(() => {
  mount(App, {
    target: document.getElementById('app')!,
  });
});
