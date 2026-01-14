import { mount } from 'svelte';
import App from './App.svelte';
import './styles/global.css';

// Register Mission Control Web Components
import 'mission-control-ui/define-all';

const app = mount(App, {
  target: document.getElementById('app')!,
});

export default app;
