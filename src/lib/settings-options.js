// Shared option constants for the admin and portal settings pages.

export const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const TIMEZONE_OPTIONS = [
  { value: 'Europe/Copenhagen', label: 'Europe/Copenhagen (CET/CEST)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT)' },
  { value: 'America/Chicago', label: 'America/Chicago (CST/CDT)' },
  { value: 'America/Denver', label: 'America/Denver (MST/MDT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST)' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai (CST)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST)' },
  { value: 'Australia/Sydney', label: 'Australia/Sydney (AEST/AEDT)' },
  { value: 'UTC', label: 'UTC' },
];

export const CLOCK_OPTIONS = [
  { value: '24h', label: '24-hour (14:30)' },
  { value: '12h', label: '12-hour AM/PM (2:30 PM)' },
];

export const DATE_OPTIONS = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
];

export const ROW_LIMIT_OPTIONS = [
  { value: '50', label: '50 rows' },
  { value: '100', label: '100 rows' },
  { value: '250', label: '250 rows' },
  { value: '500', label: '500 rows' },
];

export const DEPTH_OPTIONS = Array.from({ length: 6 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }));

export const AVATAR_COLORS = ['#003d7a', '#c8102e', '#2e7d32', '#ed6c02', '#4d8cc7', '#7b6faf', '#e0556b', '#00695c', '#e64a19', '#3f51b5', '#f57f17', '#455a64', '#6d1f2a', '#558b2f'];
