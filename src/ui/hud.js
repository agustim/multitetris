const $ = (id) => document.getElementById(id);

export function updateHUD(score, lines) {
  $('score-display').textContent = score.toLocaleString();
  $('lines-display').textContent = lines;
}

export function updatePeerList(players, myId) {
  const list = $('peers');
  list.innerHTML = '';
  const sorted = Array.from(players).sort((a, b) => (b.state?.score || 0) - (a.state?.score || 0));
  for (const p of sorted) {
    const li = document.createElement('li');
    if (p.id === myId) li.className = 'you';
    const alive = p.state?.alive !== false;
    li.innerHTML = `
      <span class="name">${p.name}${p.id === myId ? ' (tu)' : ''}</span>
      <span class="lines">${p.state?.linesCleared || 0} línies ${!alive ? '<span class="dead">💀</span>' : ''}</span>
    `;
    list.appendChild(li);
  }
}
