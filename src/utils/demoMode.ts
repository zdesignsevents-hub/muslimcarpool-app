// Demo mode utilities — custom event emitter (NO window object in React Native)

let _demoEnabled = false;
const _listeners: Set<() => void> = new Set();

export function demoLogin(): void {
  _demoEnabled = true;
  _listeners.forEach((fn) => fn());
}

export function demoLogout(): void {
  _demoEnabled = false;
  _listeners.forEach((fn) => fn());
}

export function isDemoMode(): boolean {
  return _demoEnabled;
}

export function onDemoModeActivated(fn: () => void): () => void {
  _listeners.add(fn);
  return () => { _listeners.delete(fn); };
}