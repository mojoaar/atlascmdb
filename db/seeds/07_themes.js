const { v4: uuidv4 } = require('uuid');

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function t(colors, radius, font) {
  return JSON.stringify({ colors, borderRadius: radius || '6px', fontFamily: font || FONT });
}

// Blue Line — unified light + dark
const JYSK_LIGHT = t({
  background: '#ffffff', foreground: '#0f1823', primary: '#003d7a', primaryForeground: '#ffffff',
  secondary: '#e8edf3', secondaryForeground: '#003d7a', accent: '#c8102e', accentForeground: '#ffffff',
  muted: '#f4f6f9', mutedForeground: '#5d6f83', border: '#d4dbe4', card: '#ffffff', cardForeground: '#0f1823',
  success: '#2e7d32', warning: '#ed6c02', danger: '#c8102e', info: '#003d7a',
  sidebar: '#f0f3f7', sidebarForeground: '#0f1823', sidebarActive: '#003d7a', sidebarActiveForeground: '#ffffff',
  hover: '#f0f3f7',
}, '6px');

const JYSK_DARK = t({
  background: '#0f1823', foreground: '#e8edf3', primary: '#4d8cc7', primaryForeground: '#ffffff',
  secondary: '#1c2733', secondaryForeground: '#d4dbe4', accent: '#e0556b', accentForeground: '#ffffff',
  muted: '#1c2733', mutedForeground: '#8fa3b8', border: '#2a3847', card: '#162030', cardForeground: '#e8edf3',
  success: '#4caf50', warning: '#ff9800', danger: '#e0556b', info: '#4d8cc7',
  sidebar: '#0a1219', sidebarForeground: '#d4dbe4', sidebarActive: '#4d8cc7', sidebarActiveForeground: '#ffffff',
  hover: '#1c2733',
}, '6px');

// Catppuccin palettes
const CTPS = {
  latte: {
    background: '#eff1f5', foreground: '#4c4f69', primary: '#7287fd', primaryForeground: '#ffffff',
    secondary: '#ccd0da', secondaryForeground: '#4c4f69', accent: '#e64553', accentForeground: '#ffffff',
    muted: '#e6e9ef', mutedForeground: '#6c6f85', border: '#bcc0cc', card: '#ffffff', cardForeground: '#4c4f69',
    success: '#40a02b', warning: '#fe640b', danger: '#e64553', info: '#1e66f5',
    sidebar: '#dce0e8', sidebarForeground: '#4c4f69', sidebarActive: '#7287fd', sidebarActiveForeground: '#ffffff',
    hover: '#e6e9ef',
  },
  frappe: {
    background: '#303446', foreground: '#c6d0f5', primary: '#5c63c0', primaryForeground: '#ffffff',
    secondary: '#414559', secondaryForeground: '#c6d0f5', accent: '#a83d52', accentForeground: '#ffffff',
    muted: '#292c3c', mutedForeground: '#a5adce', border: '#51576d', card: '#414559', cardForeground: '#c6d0f5',
    success: '#a6d189', warning: '#ef9f76', danger: '#ea999c', info: '#8caaee',
    sidebar: '#232634', sidebarForeground: '#c6d0f5', sidebarActive: '#5c63c0', sidebarActiveForeground: '#ffffff',
    hover: '#51576d',
  },
  macchiato: {
    background: '#24273a', foreground: '#cad3f5', primary: '#5c63c0', primaryForeground: '#ffffff',
    secondary: '#363a4f', secondaryForeground: '#cad3f5', accent: '#a83d52', accentForeground: '#ffffff',
    muted: '#1e2030', mutedForeground: '#a5adcb', border: '#494d64', card: '#363a4f', cardForeground: '#cad3f5',
    success: '#a6da95', warning: '#f5a97f', danger: '#ed8796', info: '#8aadf4',
    sidebar: '#181926', sidebarForeground: '#cad3f5', sidebarActive: '#5c63c0', sidebarActiveForeground: '#ffffff',
    hover: '#494d64',
  },
  mocha: {
    background: '#1e1e2e', foreground: '#cdd6f4', primary: '#5c63c0', primaryForeground: '#ffffff',
    secondary: '#313244', secondaryForeground: '#cdd6f4', accent: '#a83d52', accentForeground: '#ffffff',
    muted: '#181825', mutedForeground: '#a6adc8', border: '#45475a', card: '#313244', cardForeground: '#cdd6f4',
    success: '#a6e3a1', warning: '#fab387', danger: '#eba0ac', info: '#89b4fa',
    sidebar: '#11111b', sidebarForeground: '#cdd6f4', sidebarActive: '#5c63c0', sidebarActiveForeground: '#ffffff',
    hover: '#45475a',
  },
};

// Nord — https://www.nordtheme.com
const NORD_LIGHT = t({
  background: '#eceff4', foreground: '#2e3440', primary: '#5e81ac', primaryForeground: '#eceff4',
  secondary: '#d8dee9', secondaryForeground: '#2e3440', accent: '#bf616a', accentForeground: '#eceff4',
  muted: '#e5e9f0', mutedForeground: '#4c566a', border: '#d8dee9', card: '#ffffff', cardForeground: '#2e3440',
  success: '#a3be8c', warning: '#d08770', danger: '#bf616a', info: '#81a1c1',
  sidebar: '#d8dee9', sidebarForeground: '#2e3440', sidebarActive: '#5e81ac', sidebarActiveForeground: '#eceff4',
  hover: '#d8dee9',
}, '6px');

const NORD_DARK = t({
  background: '#2e3440', foreground: '#d8dee9', primary: '#3d5a7d', primaryForeground: '#ffffff',
  secondary: '#3b4252', secondaryForeground: '#d8dee9', accent: '#bf616a', accentForeground: '#ffffff',
  muted: '#434c5e', mutedForeground: '#7b88a1', border: '#4c566a', card: '#3b4252', cardForeground: '#d8dee9',
  success: '#a3be8c', warning: '#d08770', danger: '#bf616a', info: '#81a1c1',
  sidebar: '#3b4252', sidebarForeground: '#d8dee9', sidebarActive: '#3d5a7d', sidebarActiveForeground: '#ffffff',
  hover: '#434c5e',
}, '6px');

// Dracula — https://draculatheme.com
const DRACULA_LIGHT = t({
  background: '#f8f8f2', foreground: '#282a36', primary: '#6272a4', primaryForeground: '#f8f8f2',
  secondary: '#e8e8e0', secondaryForeground: '#282a36', accent: '#ff79c6', accentForeground: '#282a36',
  muted: '#eeeeec', mutedForeground: '#6d6d80', border: '#d8d8d0', card: '#ffffff', cardForeground: '#282a36',
  success: '#50fa7b', warning: '#ffb86c', danger: '#ff5555', info: '#bd93f9',
  sidebar: '#eeeeec', sidebarForeground: '#282a36', sidebarActive: '#6272a4', sidebarActiveForeground: '#f8f8f2',
  hover: '#e8e8e0',
}, '8px');

const DRACULA_DARK = t({
  background: '#282a36', foreground: '#f8f8f2', primary: '#6c42b5', primaryForeground: '#ffffff',
  secondary: '#383a4a', secondaryForeground: '#f8f8f2', accent: '#c0357f', accentForeground: '#ffffff',
  muted: '#33354a', mutedForeground: '#6272a4', border: '#44475a', card: '#282a36', cardForeground: '#f8f8f2',
  success: '#50fa7b', warning: '#ffb86c', danger: '#ff5555', info: '#8be9fd',
  sidebar: '#21222c', sidebarForeground: '#f8f8f2', sidebarActive: '#6c42b5', sidebarActiveForeground: '#ffffff',
  hover: '#44475a',
}, '8px');

// Cyberpunk — neon night city palette
const CYBERPUNK_LIGHT = t({
  background: '#f0f0fa', foreground: '#1a1a2e', primary: '#7c4dff', primaryForeground: '#ffffff',
  secondary: '#e0d8f0', secondaryForeground: '#1a1a2e', accent: '#ff2d88', accentForeground: '#ffffff',
  muted: '#e8e4f4', mutedForeground: '#5c5c80', border: '#d0c8e0', card: '#ffffff', cardForeground: '#1a1a2e',
  success: '#00e676', warning: '#ff9100', danger: '#ff1744', info: '#00b0ff',
  sidebar: '#e0d8f0', sidebarForeground: '#1a1a2e', sidebarActive: '#7c4dff', sidebarActiveForeground: '#ffffff',
  hover: '#e0d8f0',
}, '4px');

const CYBERPUNK_DARK = t({
  background: '#0b0d17', foreground: '#e0e0f0', primary: '#cc0066', primaryForeground: '#ffffff',
  secondary: '#181a2e', secondaryForeground: '#c0c0e0', accent: '#006a87', accentForeground: '#ffffff',
  muted: '#15172a', mutedForeground: '#7c7caa', border: '#2a2c44', card: '#12142a', cardForeground: '#e0e0f0',
  success: '#00ff87', warning: '#ffb800', danger: '#ff2d88', info: '#006a87',
  sidebar: '#0a0c1e', sidebarForeground: '#c0c0e0', sidebarActive: '#cc0066', sidebarActiveForeground: '#ffffff',
  hover: '#1a1c34',
}, '4px');

exports.seed = async function (knex) {
  await knex('user_theme_preferences').del();
  await knex('themes').del();

  await knex('themes').insert([
    { id: uuidv4(), name: 'Blue Line', tokenSetLight: JYSK_LIGHT, tokenSetDark: JYSK_DARK, isDefault: true, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Catppuccin Latte',   tokenSetLight: t(CTPS.latte, '8px'), tokenSetDark: null, isDefault: false, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Catppuccin Frappé',   tokenSetLight: null, tokenSetDark: t(CTPS.frappe, '8px'), isDefault: false, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Catppuccin Macchiato', tokenSetLight: null, tokenSetDark: t(CTPS.macchiato, '8px'), isDefault: false, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Catppuccin Mocha',    tokenSetLight: null, tokenSetDark: t(CTPS.mocha, '8px'), isDefault: false, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Nord',               tokenSetLight: NORD_LIGHT, tokenSetDark: NORD_DARK, isDefault: false, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Dracula',             tokenSetLight: DRACULA_LIGHT, tokenSetDark: DRACULA_DARK, isDefault: false, isSystem: true, status: 'active' },
    { id: uuidv4(), name: 'Cyberpunk',           tokenSetLight: CYBERPUNK_LIGHT, tokenSetDark: CYBERPUNK_DARK, isDefault: false, isSystem: true, status: 'active' },
  ]);
};
