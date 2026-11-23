// Day 3 prototype: compare three dashboard and pipeline layouts with identical sample data.

const variants = [
  { id: 'follow-up', title: '跟進工作台', file: '1-follow-up.html' },
  { id: 'sales-overview', title: '業務總覽', file: '2-sales-overview.html' },
  { id: 'activity-journal', title: '業務日誌', file: '3-activity-journal.html' },
];

const stages = [
  { id: 'new', title: '新商機', probability: 10, cards: [
    ['門市包裝更新', '島嶼食品', 95000, '12/04'],
    ['客戶入口網站', '棲光旅店', 140000, '12/18'],
    ['產品型錄製作', '森序設計', 75000, '12/10'],
  ] },
  { id: 'qualified', title: '已確認', probability: 25, cards: [
    ['倉儲盤點流程', '青禾製造', 210000, '12/03'],
    ['年度保養方案', '鑄川工業', 125000, '11/20'],
    ['南區教育訓練', '知序科技', 185000, '12/11'],
  ] },
  { id: 'proposal', title: '提案', probability: 50, cards: [
    ['產線稽核系統', '青禾製造', 280000, '11/27', 55],
    ['門市數據整合', '島嶼食品', 360000, '12/09'],
    ['會員服務改版', '棲光旅店', 150000, '12/16'],
  ] },
  { id: 'negotiation', title: '議價', probability: 75, cards: [
    ['年度維護合約', '知序科技', 440000, '11/25'],
    ['新廠監控部署', '鑄川工業', 315000, '11/21'],
    ['展示間設備升級', '森序設計', 220000, '12/02'],
  ] },
  { id: 'won', title: '成交', probability: 100, closed: true, cards: [
    ['採購系統第一期', '青禾製造', 380000, '11/21'],
    ['門市設備換新', '島嶼食品', 260000, '11/13'],
    ['服務台導入', '知序科技', 185000, '11/05'],
    ['進貨排程整合', '青禾製造', 280000, '10/27'],
    ['預約網站維護', '棲光旅店', 180000, '10/24'],
    ['設備備品合約', '鑄川工業', 145000, '10/15'],
    ['季節型錄更新', '森序設計', 85000, '10/06'],
    ['供應商入口平台', '島嶼食品', 300000, '09/22'],
    ['維修派工作業', '鑄川工業', 210000, '09/10'],
    ['新店點導入', '島嶼食品', 245000, '08/26'],
    ['品質檢查建置', '青禾製造', 215000, '08/13'],
    ['簡訊通知整合', '棲光旅店', 160000, '08/04'],
    ['設備資料遷移', '鑄川工業', 240000, '06/22'],
    ['工單流程顧問', '知序科技', 110000, '06/08'],
  ] },
  { id: 'lost', title: '失單', probability: 0, closed: true, cards: [
    ['連鎖據點巡檢', '島嶼食品', 155000, '11/17'],
    ['展會報到系統', '森序設計', 245000, '10/26'],
    ['線上訂房外掛', '棲光旅店', 90000, '09/19'],
  ] },
].map(stage => ({
  ...stage,
  cards: stage.cards.map(([title, company, amount, date, probability = stage.probability]) => ({
    title, company, amount, date, probability, stage: stage.id,
  })),
}));

const tasks = [
  ['寄出更新版維護報價', '年度維護合約', '11/20', '逾期', 'late'],
  ['確認監控設備交付時程', '新廠監控部署', '11/21', '逾期', 'late'],
  ['回覆產線稽核提案問題', '產線稽核系統', '11/23', '今天', 'today'],
  ['安排盤點需求訪談', '陳思妤', '11/23', '今天', 'today'],
  ['追蹤新包裝打樣進度', '門市包裝更新', '11/26', '七天內', 'soon'],
  ['確認員工訓練名單', '南區教育訓練', '12/03', '稍後', 'later'],
];

const activities = [
  ['階段變更', '從提案移至議價', '年度維護合約', '11/23', '10:42', 'stage'],
  ['通話', '確認首批交付項目', '陳思妤', '11/23', '09:18', 'call'],
  ['電子郵件', '已寄出設計樣張與估價', '門市包裝更新', '11/23', '08:56', 'mail'],
  ['階段變更', '從議價移至成交', '採購系統第一期', '11/21', '16:25', 'stage'],
  ['備註', '工廠新增一個監控點位', '新廠監控部署', '11/21', '14:10', 'note'],
  ['通話', '偏好於十二月安排訓練', '南區教育訓練', '11/20', '15:30', 'call'],
  ['電子郵件', '收到門市數據欄位需求', '門市數據整合', '11/19', '13:04', 'mail'],
  ['備註', '整理年度設備保養範圍', '年度保養方案', '11/19', '11:42', 'note'],
  ['階段變更', '從已確認移至提案', '會員服務改版', '11/18', '16:08', 'stage'],
  ['通話', '預約下週展示間場勘', '展示間設備升級', '11/18', '10:36', 'call'],
];

const query = new URLSearchParams(location.search);
const variant = variants.find(item => item.id === query.get('variant')) ??
  variants.find(item => item.id === document.documentElement.dataset.variant);
const view = query.get('view') === 'pipeline' ? 'pipeline' : 'dashboard';
document.documentElement.dataset.variant = variant.id;
document.documentElement.dataset.view = view;

const money = new Intl.NumberFormat('zh-TW', { maximumFractionDigits: 2 });
const currency = value => `NT$${money.format(value)}`;
const total = cards => cards.reduce((sum, card) => sum + card.amount, 0);
const expected = cards => cards.reduce((sum, card) => sum + card.amount * card.probability, 0) / 100;
const openCards = stages.filter(stage => !stage.closed).flatMap(stage => stage.cards);
const wonCards = stages.find(stage => stage.id === 'won').cards;
const monthly = [6, 7, 8, 9, 10, 11].map(month => {
  const cards = wonCards.filter(card => Number(card.date.split('/')[0]) === month);
  return { label: `${month}月`, value: total(cards), count: cards.length };
});
const currentMonth = monthly.at(-1);
const deals = stages.flatMap(stage => stage.cards);

function viewLink(target) {
  return `${variant.file}${target === 'pipeline' ? '?view=pipeline' : ''}`;
}

function navigation() {
  const sections = [
    ['儀表板', 'dashboard', '▦'], ['公司', '', '◇'], ['聯絡人', '', '◎'],
    ['商機', '', '▤'], ['商機看板', 'pipeline', '▥'],
  ];
  return `<header class="masthead">
    <a class="brand" href="${viewLink('dashboard')}"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span>Accountable</a>
    <nav aria-label="主要導覽">${sections.map(([label, target, glyph]) => {
      const text = `<span class="nav-icon" aria-hidden="true">${glyph}</span>${label}`;
      return target
        ? `<a ${target === view ? 'aria-current="page"' : ''} href="${viewLink(target)}">${text}</a>`
        : `<span class="nav-preview">${text}</span>`;
    }).join('')}</nav>
  </header>`;
}

function heading(title) {
  return `<header class="page-heading"><h1>${title}</h1><time datetime="2026-11-23">2026 年 11 月 23 日　週一</time></header>`;
}

function followUps() {
  return `<section class="panel follow-ups" aria-labelledby="follow-ups-heading">
    <header class="panel-heading"><h2 id="follow-ups-heading">待跟進事項</h2><span class="panel-note" id="task-count" role="status">${tasks.length} 筆</span></header>
    <ul class="task-list">${tasks.map(([action, target, date, status, kind], index) => `
      <li class="task"><input type="checkbox" aria-label="將「${action}」標記完成">
        <div class="task-copy"><strong>${action}</strong><button class="text-button" type="button" data-preview="task:${index}">${target} <span aria-hidden="true">↗</span></button></div>
        <span class="task-date"><span class="num">${date}</span><span class="badge ${kind}">${status}</span></span>
      </li>`).join('')}</ul>
    <p class="empty-tasks" hidden>目前沒有待跟進事項。</p>
  </section>`;
}

function recentActivity() {
  return `<section class="panel recent" aria-labelledby="recent-heading">
    <header class="panel-heading"><h2 id="recent-heading">近期活動</h2><span class="panel-note">最新 ${activities.length} 筆</span></header>
    <ol class="activity-list">${activities.map(([type, action, target, date, time, kind], index) => `
      <li class="activity ${kind}">
        <div class="activity-time num"><span>${date}</span><span>${time}</span></div>
        <i class="activity-dot" aria-hidden="true"></i>
        <div class="activity-copy"><span class="activity-type">${type}</span><strong>${action}</strong><button class="text-button" type="button" data-preview="activity:${index}">${target} <span aria-hidden="true">↗</span></button></div>
      </li>`).join('')}</ol>
  </section>`;
}

function metrics(board = false) {
  const items = board
    ? [['進行中商機', `${openCards.length} 筆`, ''], ['合計金額', currency(total(openCards)), ''], ['預期營收', currency(expected(openCards)), '']]
    : [['本月成交', currency(currentMonth.value), `${currentMonth.count} 筆成交`],
      ['進行中商機', currency(total(openCards)), `${openCards.length} 筆商機`], ['預期營收', currency(expected(openCards)), '金額加權後的合計']];
  return `<dl class="metrics" aria-label="${board ? '看板合計' : '商機摘要'}">${items.map(([label, value, detail]) => `
    <div class="metric"><dt>${label}</dt><dd class="num">${value}</dd>${detail ? `<dd class="metric-detail">${detail}</dd>` : ''}</div>`).join('')}</dl>`;
}

function chart(kind, title) {
  const metric = kind === 'amount' ? 'value' : 'count';
  const description = monthly.map(point => `${point.label} ${kind === 'amount' ? currency(point[metric]) : `${point[metric]} 筆`}`).join('，');
  return `<section class="panel chart-panel">
    <header class="panel-heading"><h2>${title}</h2><span class="panel-note">6–11 月</span></header>
    <canvas class="chart" data-chart="${kind}" role="img" aria-label="${title}，${description}"></canvas>
  </section>`;
}

function stageAmounts(link = true) {
  const max = Math.max(...stages.map(stage => total(stage.cards)));
  return `<section class="panel stage-summary">
    <header class="panel-heading"><h2>各階段商機金額</h2>${link ? `<a class="text-button" href="${viewLink('pipeline')}">開啟看板 <span aria-hidden="true">↗</span></a>` : ''}</header>
    <ul>${stages.map(stage => `<li class="stage-${stage.id}">
      <span class="stage-title"><i></i>${stage.title}</span><span class="num">${currency(total(stage.cards))}</span>
      <span class="mini-track" aria-hidden="true"><i style="--fill:${total(stage.cards) / max * 100}%"></i></span>
    </li>`).join('')}</ul>
  </section>`;
}

function dashboard() {
  const charts = `<div class="charts">${chart('amount', '每月成交金額')}${chart('count', '每月成交筆數')}</div>`;
  if (variant.id === 'sales-overview') {
    return `<div class="overview-layout"><div class="overview-main">${metrics()}${charts}${stageAmounts()}</div><aside class="overview-rail">${followUps()}${recentActivity()}</aside></div>`;
  }
  if (variant.id === 'activity-journal') {
    return `<div class="journal-layout">${recentActivity()}<div class="journal-rail">${followUps()}${metrics()}${charts}${stageAmounts()}</div></div>`;
  }
  return `<div class="work-list">${followUps()}${recentActivity()}</div>${metrics()}${charts}${stageAmounts()}`;
}

function dealCard(card) {
  const stage = stages.find(item => item.id === card.stage);
  const late = !stage.closed && card.date < '11/23';
  return `<article class="deal-card ${late ? 'late-deal' : ''}">
    <div class="deal-name"><button type="button" class="deal-link" data-preview="deal:${deals.indexOf(card)}">${card.title}</button><span class="grip" aria-hidden="true">⠿</span></div>
    <div class="deal-company">${card.company}</div>
    <div class="deal-amount num">${currency(card.amount)}</div>
    <div class="deal-meta"><span title="成交機率" class="num">${card.probability}%</span>
      <span title="${stage.closed ? '實際結案日' : '預計結案日'}" class="num">${card.date}</span>${late ? '<span class="badge late">逾期</span>' : ''}</div>
  </article>`;
}

function columns() {
  return `<div class="board-scroll" role="region" tabindex="0" aria-label="六個商機階段，可水平捲動"><div class="board-columns">
    ${stages.map(stage => `<section class="lane stage-${stage.id}" aria-labelledby="lane-${stage.id}">
      <header class="lane-header">
        <div class="lane-title"><i></i><h2 id="lane-${stage.id}">${stage.title}</h2><span class="lane-count num">${stage.cards.length}</span><button class="lane-add" type="button" data-add="${stage.id}" aria-label="在${stage.title}新增商機">＋</button></div>
        <dl class="lane-totals"><div><dt>進行中合計</dt><dd class="num">${currency(stage.closed ? 0 : total(stage.cards))}</dd></div><div><dt>預期營收</dt><dd class="num">${currency(stage.closed ? 0 : expected(stage.cards))}</dd></div></dl>
      </header>
      <div class="lane-cards">${stage.cards.map(dealCard).join('')}</div>
    </section>`).join('')}
  </div></div>`;
}

function pipeline() {
  if (variant.id === 'activity-journal') {
    return `<div class="journal-board">${columns()}<aside class="board-sidebar"><h2>看板合計</h2>${metrics(true)}${stageAmounts(false)}</aside></div>`;
  }
  return `${metrics(true)}${columns()}`;
}

const variantIndex = variants.indexOf(variant);
const previewSibling = direction => variants[(variantIndex + direction + variants.length) % variants.length];
const siblingLink = direction => `${previewSibling(direction).file}?variant=${previewSibling(direction).id}&view=${view}`;

function switcher() {
  return `<nav class="variant-switcher" aria-label="切換設計稿">
    <a href="${siblingLink(-1)}" aria-label="上一份設計稿">←</a>
    <span>${variantIndex + 1} / ${variants.length}　${variant.title}</span>
    <a href="${siblingLink(1)}" aria-label="下一份設計稿">→</a>
  </nav>`;
}

document.querySelector('#app').innerHTML = `${navigation()}<main>
  ${heading(view === 'pipeline' ? '商機看板' : '儀表板')}${view === 'pipeline' ? pipeline() : dashboard()}
</main>${query.has('capture') ? '' : switcher()}<dialog class="preview-dialog"></dialog>`;

function drawChart(canvas) {
  const kind = canvas.dataset.chart;
  const amount = kind === 'amount';
  const width = Math.round(canvas.clientWidth);
  const height = Math.round(canvas.clientHeight);
  if (!width || !height) return;
  const pixelRatio = window.devicePixelRatio || 1;
  canvas.width = width * pixelRatio;
  canvas.height = height * pixelRatio;
  const ctx = canvas.getContext('2d');
  ctx.scale(pixelRatio, pixelRatio);

  const left = amount ? 83 : 22;
  const right = width - 26;
  const top = 12;
  const bottom = height - 27;
  const max = amount ? 900000 : 6;
  const ticks = amount ? [0, 300000, 600000, 900000] : [0, 2, 4, 6];
  const x = index => left + (right - left) * (index + 0.5) / monthly.length;
  const y = value => bottom - (bottom - top) * value / max;
  const points = monthly.map((point, index) => [x(index), y(amount ? point.value : point.count)]);

  ctx.font = '11px Instrument Sans, PingFang TC, sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (const tick of ticks) {
    ctx.fillStyle = '#4e6972';
    ctx.fillText(amount ? currency(tick) : String(tick), left - 9, y(tick));
    ctx.strokeStyle = '#e3ecec';
    ctx.beginPath();
    ctx.moveTo(left, y(tick));
    ctx.lineTo(right, y(tick));
    ctx.stroke();
  }

  ctx.textAlign = 'center';
  monthly.forEach((point, index) => ctx.fillText(point.label, x(index), height - 10));

  if (amount) {
    ctx.beginPath();
    ctx.moveTo(points[0][0], bottom);
    points.forEach(([pointX, pointY]) => ctx.lineTo(pointX, pointY));
    ctx.lineTo(points.at(-1)[0], bottom);
    ctx.fillStyle = '#06d6a019';
    ctx.fill();
    ctx.beginPath();
    points.forEach(([pointX, pointY], index) => index ? ctx.lineTo(pointX, pointY) : ctx.moveTo(pointX, pointY));
    ctx.strokeStyle = '#007e62';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    points.forEach(([pointX, pointY], index) => {
      ctx.beginPath();
      ctx.arc(pointX, pointY, index === points.length - 1 ? 5 : 3.5, 0, Math.PI * 2);
      ctx.fillStyle = index === points.length - 1 ? '#06d6a0' : '#fff';
      ctx.fill();
      ctx.stroke();
    });
  } else {
    const barWidth = Math.min(34, (right - left) / 10);
    points.forEach(([pointX, pointY], index) => {
      ctx.fillStyle = index === points.length - 1 ? '#118ab2' : '#a7d9e6';
      ctx.beginPath();
      ctx.roundRect(pointX - barWidth / 2, pointY, barWidth, Math.max(1, bottom - pointY), [3, 3, 0, 0]);
      ctx.fill();
      ctx.fillStyle = '#073b4c';
      ctx.fillText(String(monthly[index].count), pointX, pointY - 9);
    });
  }
}

for (const canvas of document.querySelectorAll('.chart')) {
  const observer = new ResizeObserver(() => drawChart(canvas));
  observer.observe(canvas);
  document.fonts.ready.then(() => drawChart(canvas));
}

const dialog = document.querySelector('.preview-dialog');

function showPreview(title, content) {
  dialog.innerHTML = `<header class="panel-heading"><h2>${title}</h2><form method="dialog"><button class="close-preview" aria-label="關閉">×</button></form></header>${content}`;
  dialog.showModal();
}

document.addEventListener('click', event => {
  const control = event.target.closest('[data-preview], [data-add]');
  if (!control) return;
  if (control.dataset.add) {
    const stage = stages.find(item => item.id === control.dataset.add);
    showPreview('新增商機', `<div class="sample-form"><label>名稱<input type="text" autofocus></label><label>金額（新臺幣）<input type="number" min="0"></label><label>階段<input value="${stage.title}" readonly></label><label>成交機率<input value="${stage.probability}%" readonly></label></div>`);
    return;
  }
  const [type, index] = control.dataset.preview.split(':');
  if (type === 'deal') {
    const card = deals[index];
    showPreview(card.title, `<p>${card.company}</p><dl class="preview-fields"><div><dt>金額</dt><dd class="num">${currency(card.amount)}</dd></div><div><dt>成交機率</dt><dd class="num">${card.probability}%</dd></div><div><dt>結案日期</dt><dd class="num">${card.date}</dd></div></dl>`);
    return;
  }
  const [action, target, date] = type === 'task' ? tasks[index] : activities[index].slice(1);
  showPreview(target, `<p class="preview-date num">${date}</p><h3>活動時間軸</h3><p>${action}</p>`);
});

document.addEventListener('change', event => {
  const task = event.target.closest('.task');
  if (!task || !event.target.checked) return;
  task.remove();
  const remaining = document.querySelectorAll('.task').length;
  document.querySelector('#task-count').textContent = `${remaining} 筆`;
  document.querySelector('.empty-tasks').hidden = remaining > 0;
});

document.addEventListener('keydown', event => {
  if (dialog.open || event.target.closest('input, textarea, [contenteditable], .board-scroll')) return;
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    location.href = siblingLink(event.key === 'ArrowLeft' ? -1 : 1);
  }
});
