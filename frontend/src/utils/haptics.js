// Haptic feedback. Vibration is unsupported on iOS Safari and on desktop, and Chrome ignores it
// until the user has interacted with the page — so every call here is best-effort and must never
// throw. A missing buzz is invisible; an exception from a tap handler is not.
//
// Durations are deliberately short. Anything past ~40ms on a phone reads as a fault rather than
// feedback, and a trading app taps a lot.

const OFF_KEY = 'kynex_haptics_off';

function buzz(pattern) {
  try {
    if (localStorage.getItem(OFF_KEY) === '1') return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(pattern);
  } catch { /* unsupported, blocked by permissions policy, or storage denied — ignore */ }
}

/** Light tick — stepper arrows, tab switches, toggles. The most frequent one, so the shortest. */
export const hapticTick = () => buzz(8);

/** Standard press — ordinary buttons. */
export const hapticTap = () => buzz(15);

/** Committing something that costs money — placing a trade, confirming a withdrawal. */
export const hapticCommit = () => buzz([12, 40, 22]);

/** A win settled in the user's favour: two rising pulses. */
export const hapticWin = () => buzz([18, 60, 30]);

/** A loss: one longer, duller pulse. Not punishing, just distinct from the win. */
export const hapticLoss = () => buzz(45);

/** Something the user did wrong — validation failure, rejected input. */
export const hapticError = () => buzz([25, 50, 25]);

/** Read the user's preference so a settings screen can show the current state. */
export const hapticsEnabled = () => {
  try { return localStorage.getItem(OFF_KEY) !== '1'; } catch { return true; }
};

/** Turn haptics on/off app-wide. Fires a confirming buzz when switching on. */
export const setHapticsEnabled = (on) => {
  try { localStorage.setItem(OFF_KEY, on ? '0' : '1'); } catch { /* storage denied */ }
  if (on) hapticTap();
};
