const fs=require('fs');
function patch(file, pairs){ let s=fs.readFileSync(file,'utf8'); pairs.forEach(([a,b])=>{ if(!s.includes(a)) console.log(file,'NOT FOUND:',a.slice(0,70)); else s=s.replace(a,()=>b); }); fs.writeFileSync(file,s); }
patch('world.js',[
 // auto teacher intro on first arrival at a floor + mark visited
 ["  S.world = { loc: id, x: WORLD.hero.x, y: WORLD.hero.y };\n","  S.world = { loc: id, x: WORLD.hero.x, y: WORLD.hero.y };\n  if (id !== 'hub') { S.seen.floorVisited = 1; const ch0 = +id.slice(1); if (!S.seen['t' + ch0] && S.name) setTimeout(() => { if (WORLD.loc && WORLD.loc.id === id && !UI_OPEN) talkTeacher(ch0); }, 900); }\n"],
 // hub guide arrow + stairs highlight
 ["  W2.objs.forEach(o => { if (o.k === 'door') drawDoor(c, o, M); else if (o.k === 'locker') drawLocker(c, o); });","  W2.objs.forEach(o => { if (o.k === 'door') drawDoor(c, o, M); else if (o.k === 'locker') drawLocker(c, o); });\n  if (M.id === 'hub' && !S.seen.floorVisited) { const e = W2.objs.find(o => o.label === 'Лифт'); if (e) { const bob = Math.sin(W2.time * 4) * 6; c.fillStyle = '#ffd54a'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.moveTo(e.x, e.ty * T + T + 36 + bob); c.lineTo(e.x - 14, e.ty * T + T + 12 + bob); c.lineTo(e.x + 14, e.ty * T + T + 12 + bob); c.closePath(); c.fill(); c.stroke(); } }\n  if (M.id !== 'hub') { const gd = guideTarget(); if (gd && gd.stairs) { const st = W2.objs.find(o => o.k === 'stairs' && o.dir === 'up'); if (st) { const pulse = (Math.sin(W2.time * 5) + 1) / 2; c.strokeStyle = 'rgba(255,213,74,' + (.4 + pulse * .5) + ')'; c.lineWidth = 5; c.beginPath(); c.arc(st.x, st.y + 6, 44 + pulse * 6, 0, 7); c.stroke(); } } }"],
]);
patch('ui.js',[
 ["['settings', '⚙️', 'Настройки', 'Звук, время, прогресс']];","['settings', '⚙️', 'Настройки', 'Звук, время, прогресс'], ['help', '❓', 'Как играть', 'Правила, награды, советы']];"],
 ["settings: openSettings })[d.k]();","settings: openSettings, help: openHelp })[d.k]();"],
]);
let s=fs.readFileSync('ui.js','utf8');
s+=`
// ---------------------------------------------------------------- справка
function openHelp() {
  const body = \`<div class="card" style="margin-bottom:8px"><h4>🏃 Управление</h4><p>Двигайся джойстиком (тяни палец по экрану) или клавишами WASD / стрелками. Подойди к двери или человеку — справа загорится кнопка действия (на компьютере — Пробел или E).</p></div>
  <div class="card" style="margin-bottom:8px"><h4>🏫 Как устроена школа</h4><p>В холле — столовая (припасы), гардероб, библиотека (тренировки), спортзал (мини-игры), кабинет директора и лифт. На каждом этаже шесть кабинетов-уроков и босс. Победил босса — открылся следующий этаж. На седьмом этаже сдаёшь ЕГЭ, а за ним ждёт университет.</p></div>
  <div class="card" style="margin-bottom:8px"><h4>⏱ Задачи на время</h4><p>У каждой задачи — свои числа и таймер. Ответил за половину времени — бонус «молния» ×1,5. Вышло время (или ты свернул игру) — учитель меняет вариант, а за новый ответ нет ни монет, ни освоения темы. Подсказки тоже снижают награду.</p></div>
  <div class="card" style="margin-bottom:8px"><h4>⭐ Награды</h4><p>🪙 монеты — за верные ответы (больше за скорость и комбо), на них покупаются припасы, одежда и питомцы. ✨ опыт повышает ранг. ⭐ звёзды — за качество урока. 🃏 шпаргалки с формулами — за первое прохождение и в шкафчиках на этажах. 📋 задания дня и 📆 подарки за вход — каждый день.</p></div>
  <div class="card" style="margin-bottom:8px"><h4>🧠 Как учиться эффективно</h4><p>Читай теорию перед уроком, разбирай ошибки (они сохраняются в «Работе над ошибками»), повторяй темы в Библиотеке — знания забываются, если их не повторять. Прогноз ЕГЭ в профиле показывает, какие темы подтянуть.</p></div>
  <div class="card"><h4>🏁 Соперники</h4><p>В уроках можно обгонять соперника, а Гоша Зубрилкин зовёт на дуэль раз в день. В рейтинге класса одноклассники растут каждый день — занимайся регулярно!</p></div>\`;
  openScreen(pan('Как играть', body, '<button class="btn gold" data-a="close">Понятно</button>'));
}
`;
fs.writeFileSync('ui.js',s);
// game.js: Android back
let g=fs.readFileSync('game.js','utf8');
g+=`
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
`;
fs.writeFileSync('game.js',g);
// Java back
let j=fs.readFileSync('android/src/ru/school/app/MainActivity.java','utf8');
j=j.replace(/    @Override\n    public void onBackPressed\(\) \{[\s\S]*?\n    \}\n/, `    @Override
    public void onBackPressed() {
        // сначала даём обработать «назад» самой игре (закрыть окно, выйти из урока); если не нужно — двойное нажатие для выхода
        web.evaluateJavascript("(window.onAndroidBack?window.onAndroidBack():false)", value -> {
            if ("true".equals(value)) return;
            long now = System.currentTimeMillis();
            if (now - backAt < 2000) { finish(); return; }
            backAt = now;
            Toast.makeText(this, "Нажмите «назад» ещё раз, чтобы выйти", Toast.LENGTH_SHORT).show();
        });
    }
`);
fs.writeFileSync('android/src/ru/school/app/MainActivity.java',j);
