export function go(tab, sub = '') {
  location.hash = `#/${tab}${sub ? '/' + sub : ''}`;
}
export function back() {
  if (history.length > 1) history.back(); else location.hash = '#/today';
}
