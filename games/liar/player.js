// Vista del jugador para "Adivina quién miente".
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function mount(root, api) {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./style.css', import.meta.url).href;
  document.head.append(css);

  root.innerHTML = `
    <div class="lq">
      <div class="lq-top"><span class="lq-round"></span><span>Puntos: <b class="lq-score">0</b> / <span class="lq-target"></span></span></div>
      <div class="lq-main"></div>
      <p class="lq-progress muted"></p>
      <button type="button" class="lq-skip hidden">Avanzar sin esperar</button>
      <div class="lq-board hidden"><h3>Marcador</h3><ol></ol></div>
    </div>`;
  const $ = (s) => root.querySelector(s);
  const main = $('.lq-main');
  let key = null;
  let last = null;

  $('.lq-skip').addEventListener('click', () => api.send({ skip: true }));

  function renderMain(d) {
    if (!d.participant) {
      main.innerHTML = `<div class="card"><h2>Espera la próxima ronda</h2><p class="muted">Entraste con la ronda empezada.</p></div>`;
      return;
    }
    switch (d.phase) {
      case 'answer':
        if (d.myAnswer == null) {
          main.innerHTML = `
            <div class="card"><p class="muted">Tu pregunta</p><h2 class="lq-q">${esc(d.myQuestion)}</h2></div>
            <form class="stack lq-form">
              <input name="answer" maxlength="60" placeholder="Tu respuesta" autocomplete="off" required>
              <button type="submit">Enviar</button>
            </form>`;
          const form = main.querySelector('form');
          form.addEventListener('submit', (e) => {
            e.preventDefault();
            api.send({ answer: form.answer.value });
          });
          form.answer.focus();
        } else {
          main.innerHTML = `
            <div class="card"><p class="muted">Tu pregunta</p><h2 class="lq-q">${esc(d.myQuestion)}</h2>
            <p>Respondiste: <b>${esc(d.myAnswer)}</b></p></div>`;
        }
        break;
      case 'vote':
        main.innerHTML = `
          <div class="card lq-board-q"><p class="muted">La pregunta era</p><h2 class="lq-q">${esc(d.question)}</h2></div>
          <h3>¿Quién miente?</h3>
          <div class="stack lq-votes">${d.answers.map((a) => `
            <button type="button" class="lq-vote${a.id === d.myVote ? ' picked' : ''}" data-id="${esc(a.id)}"
              ${a.id === api.me?.id ? 'disabled' : ''}>
              <strong>${esc(a.nick)}</strong><span>${esc(a.answer)}</span>
            </button>`).join('')}
          </div>`;
        main.querySelectorAll('.lq-vote').forEach((b) => b.addEventListener('click', () => api.send({ vote: b.dataset.id })));
        break;
      case 'result': {
        const mine = d.answers.find((a) => a.nick === d.impostor);
        const delta = d.wasImpostor ? (d.caught ? 0 : 3) : (d.caught ? 1 : 0);
        main.innerHTML = `
          <div class="card lq-result ${d.caught ? 'caught' : 'escaped'}">
            <h2>${d.caught ? '¡Atraparon al impostor!' : '¡El impostor se escapó!'}</h2>
            <p>${d.wasImpostor ? 'El impostor eras <b>tú</b>' : `El impostor era <b>${esc(d.impostor)}</b>`}</p>
            <p class="muted">Su pregunta: ${esc(d.impostorQuestion)}</p>
            <p class="muted">Respondió: ${esc(mine?.answer ?? '—')}</p>
            <p class="lq-delta">${delta ? `+${delta} punto${delta > 1 ? 's' : ''}` : 'Sin puntos esta ronda'}</p>
          </div>`;
        break;
      }
      case 'final':
        main.innerHTML = `<div class="card lq-result"><h2>🏆 ${esc(d.winners.join(', '))}</h2><p>¡Fin del juego!</p></div>`;
        break;
    }
  }

  function renderBoard(d) {
    const show = !api.hasTv() || d.phase === 'result' || d.phase === 'final';
    $('.lq-board').classList.toggle('hidden', !show);
    $('.lq-board ol').replaceChildren(...d.scores.map((s) => {
      const li = document.createElement('li');
      li.innerHTML = `<span>${esc(s.nick)}</span><b>${s.score}</b>`;
      if (!s.connected) li.classList.add('off');
      return li;
    }));
  }

  function renderProgress(d) {
    const total = d.players.length;
    let text = '';
    if (d.phase === 'answer') {
      const waiting = d.players.filter((p) => !p.answered).map((p) => p.nick);
      text = `Respondieron ${total - waiting.length} de ${total}` + (waiting.length ? ` · faltan: ${waiting.join(', ')}` : '');
    } else if (d.phase === 'vote') {
      const waiting = d.players.filter((p) => !p.voted).map((p) => p.nick);
      text = `Votaron ${total - waiting.length} de ${total}` + (waiting.length ? ` · faltan: ${waiting.join(', ')}` : '');
    }
    $('.lq-progress').textContent = text;
    $('.lq-skip').classList.toggle('hidden', !(api.isHost && (d.phase === 'answer' || d.phase === 'vote')));
  }

  return {
    onMessage(d) {
      last = d;
      $('.lq-round').textContent = `Ronda ${d.round}`;
      $('.lq-score').textContent = d.score;
      $('.lq-target').textContent = d.target;
      // Solo se reconstruye lo principal cuando cambia algo propio, para no borrar lo que se está escribiendo.
      const newKey = [d.phase, d.round, d.participant, d.myAnswer ?? '', d.myVote ?? '', d.phase === 'vote' ? d.answers.length : ''].join('|');
      if (newKey !== key) {
        key = newKey;
        renderMain(d);
      }
      renderProgress(d);
      renderBoard(d);
    },
    destroy() {
      css.remove();
    },
  };
}
