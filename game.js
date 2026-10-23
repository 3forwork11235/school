'use strict';
// ============================================================================
//  ЗАПУСК ИГРЫ: заставка, создание героя, главный цикл
// ============================================================================
const IN_APP = /SchoolApp\//.test(navigator.userAgent);

function boot() {
  const had = loadSave();
  WORLD.cv = $('cv'); WORLD.c = WORLD.cv.getContext('2d');
  resizeWorld(); initWorldInput();
  Snd.on = S.settings.sound; Snd.musicOn = S.settings.music;
  decayMastery(); ensureQuests();
  showTitle(had && !!S.name);
  WORLD.loc = null; enterLoc('hub', 'elev'); // фон заставки — холл
  requestAnimationFrame(loop);
  window.addEventListener('beforeunload', () => save(true));
  document.addEventListener('visibilitychange', () => { if (document.hidden) save(true); });
  setInterval(() => { if (!document.hidden && S.name) { S.stats.playSec += 10; save(); } }, 10000);
}

function showTitle(continuing) {
  const el = $('title'); UI_OPEN = true;
  const tip = R.pick(TIPS);
  if (continuing) {
    el.innerHTML = `<div class="run">🏃‍♂️💨</div><h1>${GAME_TITLE}</h1><div class="sub">От таблицы умножения до университета. Решай задачи на время, собирай шпаргалки, побеждай боссов и обгоняй Гошу Зубрилкина!</div>
    <div class="card" style="max-width:420px;width:100%"><div class="row"><span class="big-e">${S.gender === 'g' ? '👧' : '🧒'}</span><div class="sp" style="text-align:left"><h4>${esc(S.name)}</h4><p>${rankName(S.xp)} · ⭐ ${totalStars()} · серия ${S.streak.count} дн.</p></div></div></div>
    <button class="btn gold xl" id="tgo" style="min-width:260px">Продолжить</button><div class="sub" style="font-size:13px">💡 ${tip}</div>`;
    $('tgo').onclick = () => { Snd.init(); startPlay(); };
  } else {
    let gender = 'b';
    el.innerHTML = `<div class="run">🏃‍♀️💨</div><h1>${GAME_TITLE}</h1><div class="sub">Ты — новенький в школе №57¾. Впереди 7 этажей, ЕГЭ и университет мечты. Как тебя зовут?</div>
    <div style="max-width:380px;width:100%;display:flex;flex-direction:column;gap:12px"><input id="tname" class="input" maxlength="14" placeholder="Твоё имя" autocomplete="off">
    <div class="opt" style="justify-content:center"><button class="o on" id="gb">🧒 Мальчик</button><button class="o" id="gg">👧 Девочка</button></div>
    <button class="btn gold xl wide" id="tgo">Начать игру</button></div><div class="sub" style="font-size:13px">💡 ${tip}</div>`;
    $('gb').onclick = () => { gender = 'b'; $('gb').classList.add('on'); $('gg').classList.remove('on'); };
    $('gg').onclick = () => { gender = 'g'; $('gg').classList.add('on'); $('gb').classList.remove('on'); };
    $('tgo').onclick = () => {
      Snd.init(); const name = $('tname').value.trim() || (gender === 'g' ? 'Маша' : 'Вася');
      S = newState(); S.name = name.slice(0, 14); S.gender = gender;
      S.look = gender === 'g' ? { hair: 2, hairC: 2, skin: 1, shirt: 6, bag: 1, hat: 0, glasses: 0, trail: 0, pet: 0 } : { hair: 0, hairC: 1, skin: 1, shirt: 0, bag: 0, hat: 0, glasses: 0, trail: 0, pet: 0 };
      S.streak = { last: dayNum(), count: 1, claimed: 0 }; ensureQuests(); save(true); startPlay(true);
    };
  }
}

function startPlay(isNew) {
  const el = $('title'); el.style.transition = 'opacity .4s'; el.style.opacity = 0; setTimeout(() => { el.style.display = 'none'; el.style.opacity = 1; }, 400);
  if (S.settings.music) Snd.setMusic(true);
  UI_OPEN = false;
  if (isNew) {
    enterLoc('hub', { x: 16.5, y: 12.5 }); UI_OPEN = true;
    setTimeout(() => say(PROLOGUE, () => { S.seen.prologue = 1; save(true); FIRST_TIME_TIPS.forEach((t, i) => setTimeout(() => toast('💡 ' + t, 'ok'), 600 + i * 2400)); }), 500);
    return;
  }
  // продолжение: вернуться, где остановились
  const w = S.world || { loc: 'hub' }; let id = w.loc || 'hub';
  if (id !== 'hub' && !chUnlocked(+id.slice(1))) id = 'hub';
  enterLoc(id, id === 'hub' ? 'elev' : 'left');
  if (w.loc === id && w.x && !WORLD.loc.isSolid(Math.floor(w.x / T), Math.floor(w.y / T))) { WORLD.hero.x = w.x; WORLD.hero.y = w.y; WORLD.pet.x = w.x - 30; WORLD.pet.y = w.y; }
  const st = loginStreak();
  if (st) { setTimeout(() => toast(`📆 Серия входов: ${st.count} ${pl(st.count, 'день', 'дня', 'дней')}!<br>Подарок ждёт у дяди Коли в холле.`, 'big'), 700); checkAch(); }
  setTimeout(() => { const d = forecast(); if (d.weak.length && S.xp > 100) toast('🔁 Знания забываются: загляни в Библиотеку — там «Повторение».', 'ok'); }, 4200);
}

let _last = 0;
function loop(t) {
  const dt = Math.min(.05, (t - _last) / 1000 || .016); _last = t;
  if (WORLD.loc) { try { updateWorld(dt); drawWorld(); } catch (e) { console.error(e); } }
  requestAnimationFrame(loop);
}
window.addEventListener('error', e => { try { console.error(e.message); } catch (_) { } });
document.addEventListener('contextmenu', e => e.preventDefault());
window.addEventListener('load', boot);

// кнопка «назад» на Android: обрабатываем внутри игры; false — пусть приложение спросит про выход
window.onAndroidBack = function () {
  try {
    if (RUN.active) { endRun(true); return true; }
    if (LS.active) { if ($('fbRes')) { const b = $('rsExit'); b && b.click(); } else askExit(); return true; }
    if (DLG.on) { endDialog(); return true; }
    if (SCR.open) { closeScreen(); return true; }
    if ($('title').style.display !== 'none' && $('title').innerHTML) return false;
    return false;
  } catch (e) { return false; }
};
