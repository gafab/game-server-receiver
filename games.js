// Carga dinámica de la vista de un juego: <base>games/<id>/<kind>.js
//
// Contrato de un módulo de juego (player.js o tv.js):
//   export function mount(root, api) { ...; return { onMessage(data) {}, destroy() {} } }
// Sus propios assets deben resolverse con `new URL('./archivo', import.meta.url)`,
// porque el receptor de Chromecast los sirve desde otra ruta.
//
// `api` de jugador: { me, isHost, send(data), hasTv(), players() }
// `api` de TV:      { players() }
//
// Los mensajes que llegan mientras el módulo se descarga quedan en cola.
export function createGameHost(root, kind, api, base = `${location.origin}/`) {
  let current = null;
  let loadingId = null;
  let pending = [];

  function unload() {
    try { current?.destroy?.(); } catch (e) { console.error(e); }
    current = null;
    loadingId = null;
    pending = [];
    root.replaceChildren();
  }

  async function load(id) {
    if (loadingId === id) return;
    unload();
    loadingId = id;
    let mod;
    try {
      mod = await import(new URL(`games/${encodeURIComponent(id)}/${kind}.js`, base).href);
    } catch (e) {
      console.error(e);
      root.textContent = `No se pudo cargar el juego "${id}".`;
      return;
    }
    if (loadingId !== id) return;
    current = mod.mount(root, api);
    pending.splice(0).forEach((d) => current.onMessage?.(d));
  }

  function message(data) {
    if (current) current.onMessage?.(data);
    else if (loadingId) pending.push(data);
  }

  return {
    load,
    unload,
    message,
    get id() { return loadingId; },
  };
}
