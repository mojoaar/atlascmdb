const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

function t(colors, radius) {
  return JSON.stringify({ colors, borderRadius: radius || '8px', fontFamily: FONT });
}

const LATTE_LIGHT = t({
  background: '#eff1f5', foreground: '#4c4f69', primary: '#7287fd', primaryForeground: '#ffffff',
  secondary: '#ccd0da', secondaryForeground: '#4c4f69', accent: '#e64553', accentForeground: '#ffffff',
  muted: '#e6e9ef', mutedForeground: '#6c6f85', border: '#bcc0cc', card: '#ffffff', cardForeground: '#4c4f69',
  success: '#40a02b', warning: '#fe640b', danger: '#e64553', info: '#1e66f5',
  sidebar: '#dce0e8', sidebarForeground: '#4c4f69', sidebarActive: '#7287fd', sidebarActiveForeground: '#ffffff',
  hover: '#e6e9ef',
}, '8px');

const MOCHA_DARK = t({
  background: '#1e1e2e', foreground: '#cdd6f4', primary: '#5c63c0', primaryForeground: '#ffffff',
  secondary: '#313244', secondaryForeground: '#cdd6f4', accent: '#a83d52', accentForeground: '#ffffff',
  muted: '#181825', mutedForeground: '#a6adc8', border: '#45475a', card: '#313244', cardForeground: '#cdd6f4',
  success: '#a6e3a1', warning: '#fab387', danger: '#eba0ac', info: '#89b4fa',
  sidebar: '#11111b', sidebarForeground: '#cdd6f4', sidebarActive: '#5c63c0', sidebarActiveForeground: '#ffffff',
  hover: '#45475a',
}, '8px');

exports.up = async function (knex) {
  await knex('themes').where({ name: 'Catppuccin Latte' }).update({ tokenSetDark: null });
  await knex('themes').where({ name: 'Catppuccin Frappé' }).update({ tokenSetLight: null });
  await knex('themes').where({ name: 'Catppuccin Macchiato' }).update({ tokenSetLight: null });
  await knex('themes').where({ name: 'Catppuccin Mocha' }).update({ tokenSetLight: null });
};

exports.down = async function (knex) {
  await knex('themes').where({ name: 'Catppuccin Latte' }).update({ tokenSetDark: MOCHA_DARK });
  await knex('themes').where({ name: 'Catppuccin Frappé' }).update({ tokenSetLight: LATTE_LIGHT });
  await knex('themes').where({ name: 'Catppuccin Macchiato' }).update({ tokenSetLight: LATTE_LIGHT });
  await knex('themes').where({ name: 'Catppuccin Mocha' }).update({ tokenSetLight: LATTE_LIGHT });
};
