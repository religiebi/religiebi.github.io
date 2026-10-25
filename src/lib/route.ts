/** Hash routes: GitHub Pages has no SPA rewrites, so all app state lives after "#". */
export type Route =
  | { kind: 'home' }
  | { kind: 'tradition'; id: string }
  | { kind: 'branch'; id: string }
  | { kind: 'about' };

const ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function parseHash(hash: string): Route {
  const path = hash.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  const [head, raw, ...rest] = path.split('/');
  let id: string;
  try {
    id = decodeURIComponent(raw ?? '');
  } catch {
    return { kind: 'home' };
  }
  if (rest.length === 0) {
    if (head === 't' && ID.test(id)) return { kind: 'tradition', id };
    if (head === 'b' && ID.test(id)) return { kind: 'branch', id };
    if (head === 'about' && raw === undefined) return { kind: 'about' };
  }
  return { kind: 'home' };
}

export function toHash(route: Route): string {
  switch (route.kind) {
    case 'tradition':
      return `#/t/${encodeURIComponent(route.id)}`;
    case 'branch':
      return `#/b/${encodeURIComponent(route.id)}`;
    case 'about':
      return '#/about';
    case 'home':
      return '';
  }
}
