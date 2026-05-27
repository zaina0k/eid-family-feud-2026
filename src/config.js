// Frontend-only "speed bump" password. Change this to whatever you want.
export const SETTINGS_PASSWORD = 'feud2026';

// Default team palette — used when adding teams. Each new team picks the next
// unused colour from this list so two new teams never start matching.
export const DEFAULT_COLORS = [
  '#3b82f6', // blue
  '#ef4444', // red
  '#10b981', // green
  '#f59e0b', // amber
];

// Max teams allowed by the blueprint (min is 2, default 2).
export const MIN_TEAMS = 2;
export const MAX_TEAMS = 4;

// Strikes go 0..MAX_STRIKES (manual, no auto-steal).
export const MAX_STRIKES = 3;

// Default count used by the End-screen "Add more questions" stepper.
export const DEFAULT_ADD_COUNT = 1;
