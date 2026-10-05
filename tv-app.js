// Lógica de la pantalla común, compartida por /tv (WebSocket) y el receptor de Chromecast.
// `handle(msg)` recibe los mismos mensajes del hub: lobby, start, game, end (+ qr en Chromecast).
import { createGameHost } from './games.js';

export function createTvApp({ base, qrFor } = {}) {
  const $ = (s) => document.querySelector(s);
  let players = [];
  let joinUrl = null;

  const host = createGameHost($('#game'), 'tv', { players: () => players }, base);

  function show(id) {
    for (const s of document.querySelectorAll('.screen')) s.classList.toggle('hidden', s.id !== id);
  }

  function syncGame(game) {
    if (game) {
      if (host.id !== game.id) host.load(game.id);
      show('game');
    } else {
      if (host.id) host.unload();
      show('lobby');
    }
  }

  function setQr(src) {
    $('#qr').src = src;
    $('#qr').classList.remove('hidden');
  }

  function renderLobby(m) {
    if (m.joinUrl && m.joinUrl !== joinUrl) {
      joinUrl = m.joinUrl;
      $('#joinUrl').textContent = m.joinUrl;
      if (qrFor) setQr(qrFor(m.joinUrl));
    }
    $('#count').textContent = `(${m.players.length})`;
    $('#players').replaceChildren(...m.players.map((p) => {
      const li = document.createElement('li');
      li.textContent = p.nick;
      if (!p.connected) li.classList.add('off');
      return li;
    }));
  }

  function handle(m) {
    switch (m.t) {
      case 'qr':
        setQr(m.dataUrl);
        break;
      case 'lobby':
        players = m.players;
        renderLobby(m);
        syncGame(m.game);
        break;
      case 'start':
        syncGame(m.game);
        break;
      case 'game':
        host.message(m.data);
        break;
      case 'end':
        syncGame(null);
        break;
    }
  }

  return { handle, show };
}
