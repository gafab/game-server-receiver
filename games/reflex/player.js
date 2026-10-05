// Vista del jugador para "Reflejos".
export function mount(root, api) {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./style.css', import.meta.url).href;
  document.head.append(css);

  root.innerHTML = `
    <div class="rx">
      <button class="rx-pad" type="button">Prepárate…</button>
      <div class="rx-bar"><span class="rx-round"></span><span>Puntos: <b class="rx-score">0</b></span></div>
      <ol class="rx-board hidden"></ol>
    </div>`;
  const pad = root.querySelector('.rx-pad');
  const round = root.querySelector('.rx-round');
  const score = root.querySelector('.rx-score');
  const board = root.querySelector('.rx-board');

  pad.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    api.send({ tap: true });
    navigator.vibrate?.(20);
  });

  return {
    onMessage(d) {
      pad.dataset.phase = d.phase;
      pad.textContent = d.text;
      round.textContent = `Ronda ${d.round}/${d.rounds}`;
      score.textContent = d.score;

      // Sin TV, el marcador se muestra en cada celular.
      const showBoard = !api.hasTv() || d.phase === 'final';
      board.classList.toggle('hidden', !showBoard);
      if (showBoard) {
        board.replaceChildren(...d.scores.map((s) => {
          const li = document.createElement('li');
          const name = document.createElement('span');
          name.textContent = s.nick;
          const pts = document.createElement('b');
          pts.textContent = s.score;
          li.append(name, pts);
          if (!s.connected) li.classList.add('off');
          return li;
        }));
      }
    },
    destroy() {
      css.remove();
    },
  };
}
