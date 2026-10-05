// Pantalla común ("pizarra") para "Adivina quién miente".
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function mount(root) {
  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = new URL('./style.css', import.meta.url).href;
  document.head.append(css);

  root.innerHTML = `
    <div class="lqtv">
      <div class="lqtv-stage"></div>
      <div class="lqtv-side"><h2>Marcador</h2><p class="muted lqtv-target"></p><ol class="lqtv-scores"></ol></div>
    </div>`;
  const stage = root.querySelector('.lqtv-stage');

  function render(d) {
    const head = `<div class="lqtv-round">Ronda ${d.round}</div>`;
    switch (d.phase) {
      case 'answer':
        stage.innerHTML = `${head}
          <h1>Miren su celular y respondan</h1>
          <p class="lqtv-sub">Uno de ustedes tiene una pregunta distinta… y no lo sabe.</p>
          <ul class="chips big">${d.players.map((p) => `<li class="${p.answered ? 'done' : 'off'}">${p.answered ? '✓ ' : ''}${esc(p.nick)}</li>`).join('')}</ul>`;
        break;
      case 'vote':
        stage.innerHTML = `${head}
          <div class="lqtv-q">${esc(d.question)}</div>
          <div class="lqtv-answers">${d.answers.map((a) => {
            const voted = d.players.find((p) => p.id === a.id)?.voted;
            return `<div class="lqtv-card"><span class="nick">${esc(a.nick)}${voted ? ' ✓' : ''}</span><span class="ans">${esc(a.answer)}</span></div>`;
          }).join('')}</div>
          <p class="lqtv-sub">¿Quién miente? Discutan y voten en su celular.</p>`;
        break;
      case 'result': {
        const ans = d.answers.find((a) => a.nick === d.impostor)?.answer ?? '—';
        stage.innerHTML = `${head}
          <h1 class="${d.caught ? 'caught' : 'escaped'}">${d.caught ? '¡Atrapado!' : '¡Se escapó!'}</h1>
          <p class="lqtv-sub">El impostor era <b>${esc(d.impostor)}</b> — respondió <b>${esc(ans)}</b></p>
          <div class="lqtv-q small">Su pregunta: ${esc(d.impostorQuestion)}</div>
          <p class="lqtv-sub">${d.caught ? 'Los demás suman 1 punto cada uno' : `${esc(d.impostor)} suma 3 puntos`}</p>
          <ul class="lqtv-tally">${d.tally.map((t) => `<li><span>${esc(t.nick)}</span><span class="bar" style="--n:${t.votes}"></span><b>${t.votes}</b></li>`).join('')}</ul>`;
        break;
      }
      case 'final':
        stage.innerHTML = `<h1>🏆 ${esc(d.winners.join(', '))}</h1><p class="lqtv-sub">¡Ganó${d.winners.length > 1 ? 'aron' : ''} la partida!</p>`;
        break;
    }
  }

  return {
    onMessage(d) {
      render(d);
      root.querySelector('.lqtv-target').textContent = `Gana quien llegue a ${d.target}`;
      root.querySelector('.lqtv-scores').replaceChildren(...d.scores.map((s) => {
        const li = document.createElement('li');
        li.innerHTML = `<span>${esc(s.nick)}</span><b>${s.score}</b>`;
        if (!s.connected) li.classList.add('off');
        return li;
      }));
    },
    destroy() {
      css.remove();
    },
  };
}
