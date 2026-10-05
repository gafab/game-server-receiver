// Pantalla común para "Reflejos".
export function mount(root) {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./style.css', import.meta.url).href;
  document.head.append(css);

  root.innerHTML = `
    <div class="rxtv">
      <div class="rxtv-stage">
        <div class="rxtv-round"></div>
        <div class="rxtv-big"></div>
        <div class="rxtv-sub"></div>
      </div>
      <div class="rxtv-side">
        <h2>Marcador</h2>
        <ol class="rxtv-scores"></ol>
      </div>
    </div>`;
  const stage = root.querySelector('.rxtv-stage');
  const round = root.querySelector('.rxtv-round');
  const big = root.querySelector('.rxtv-big');
  const sub = root.querySelector('.rxtv-sub');
  const scores = root.querySelector('.rxtv-scores');

  return {
    onMessage(d) {
      stage.dataset.phase = d.phase;
      round.textContent = d.phase === 'final' ? '' : `Ronda ${d.round} de ${d.rounds}`;
      const early = d.falseStarts.length ? `Se adelantaron: ${d.falseStarts.join(', ')}` : '';
      switch (d.phase) {
        case 'wait':
          big.textContent = 'Esperen…';
          sub.textContent = early;
          break;
        case 'go':
          big.textContent = '¡YA!';
          sub.textContent = early;
          break;
        case 'result':
          big.textContent = d.winner ?? 'Nadie';
          sub.textContent = d.winner ? `${d.reactionMs} ms` : 'Nadie tocó a tiempo';
          break;
        case 'final':
          big.textContent = d.scores[0] ? `🏆 ${d.scores[0].nick}` : 'Fin';
          sub.textContent = 'Fin del juego';
          break;
      }
      scores.replaceChildren(...d.scores.map((s) => {
        const li = document.createElement('li');
        const name = document.createElement('span');
        name.textContent = s.nick;
        const pts = document.createElement('b');
        pts.textContent = s.score;
        li.append(name, pts);
        if (!s.connected) li.classList.add('off');
        return li;
      }));
    },
    destroy() {
      css.remove();
    },
  };
}
