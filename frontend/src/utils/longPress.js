// WhatsApp-style press-and-hold detection, used by the live-chat bubbles to open the emoji picker.
//
// `longPressProps(fn)` returns a props object you spread onto the element. `fn` fires once the
// finger (or left mouse button) has been held roughly still for HOLD_MS; lifting early, or drifting
// more than MOVE_TOLERANCE px (i.e. the user was scrolling the thread), cancels it.
//
// The pending-press state lives at module scope on purpose. Only one press can be active at a time,
// and the chat list re-renders every few seconds from polling — a closure created at touchstart
// would be a stale one by touchend, leaking the timer and firing after the user let go.

const HOLD_MS = 450;
const MOVE_TOLERANCE = 10;

let timer = null;
let startX = 0;
let startY = 0;
let firedAt = 0;
let isTouchDevice = false;

function cancel() {
  if (timer) { clearTimeout(timer); timer = null; }
}

function start(x, y, fn) {
  cancel();
  startX = x;
  startY = y;
  timer = setTimeout(() => {
    timer = null;
    firedAt = Date.now();
    fn();
  }, HOLD_MS);
}

function moved(x, y) {
  if (timer && (Math.abs(x - startX) > MOVE_TOLERANCE || Math.abs(y - startY) > MOVE_TOLERANCE)) cancel();
}

/**
 * True if a long press fired in the last moment. Android replays a `click` after the finger lifts,
 * which would otherwise immediately dismiss the picker the press just opened — guard with this.
 */
export function justLongPressed() {
  return Date.now() - firedAt < 500;
}

export function longPressProps(onLongPress) {
  return {
    onTouchStart: (e) => {
      isTouchDevice = true;
      const t = e.touches && e.touches[0];
      start(t ? t.clientX : 0, t ? t.clientY : 0, onLongPress);
    },
    onTouchMove: (e) => {
      const t = e.touches && e.touches[0];
      if (t) moved(t.clientX, t.clientY);
    },
    onTouchEnd: cancel,
    onTouchCancel: cancel,
    // Desktop (and the admin panel on a laptop) gets the same gesture with the mouse. Phones replay
    // a synthetic mouse sequence after every touch, so once a real touch is seen the mouse path is
    // left off for good.
    onMouseDown: (e) => {
      if (isTouchDevice || e.button !== 0) return;
      start(e.clientX, e.clientY, onLongPress);
    },
    onMouseMove: (e) => moved(e.clientX, e.clientY),
    onMouseUp: cancel,
    onMouseLeave: cancel,
    // A held finger otherwise pops the browser's own text-selection / context callout on top of our
    // picker.
    onContextMenu: (e) => e.preventDefault(),
  };
}
