'use strict';

// ─────────────────────────────────────────────
// 컬럼 정의
// 드롭다운 options 값은 실제 데이터에 맞게 수정하세요.
// ─────────────────────────────────────────────
const WHERE_COLUMNS = [
  { name: '일반사업소',   type: 'like' },
  { name: '일반대리점',   type: 'like' },
  { name: '실적사업소',   type: 'dropdown', multi: true, options: ['광주권역','광주사업소','남부권역(A)','남부권역(B)','남부사업소','대구권역','대구사업소','대리점기타','대전권역','대전사업소','동부권역(A)','동부권역(B)','동부사업소','매장운영사업소','본사계약','부산권역','북동권역','북부사업소','북서권역','사업개발A','사업개발B','서부권역','서부사업소','온라인','자사몰사업소','중부권역','폐쇄몰사업소','플래그십사업소'] },
  { name: '실적대리점',   type: 'like' },
  { name: '수주건명',     type: 'like' },
  { name: '수주건구분',   type: 'dropdown', multi: true,  options: ['일반수주', '견적수주', '프로젝트수주'] },
  { name: '사업자번호',   type: 'eq' },
  { name: '세트코드',     type: 'eq' },
  { name: '세트코드색상', type: 'eq' },
  { name: '단품코드',     type: 'eq' },
  { name: '단품코드색상', type: 'eq' },
  { name: '제품구분',     type: 'dropdown', multi: true,  options: ['의자류', '소파류', '테이블류', '기타'] },
  { name: '수주량',       type: 'num_range' },
  { name: '매출량',       type: 'num_range' },
  { name: '수주단가',     type: 'num_range' },
  { name: '매출단가',     type: 'num_range' },
  { name: '수주금액',     type: 'num_range' },
  { name: '매출금액',     type: 'num_range' },
  { name: '공장도금액',   type: 'num_range' },
];

const TYPE_LABELS = {
  like:      'LIKE',
  eq:        '=',
  num_eq:    '숫자=',
  num_range: '범위',
  dropdown:  '선택',
};

// ─────────────────────────────────────────────
// State
// ─────────────────────────────────────────────
const state = {
  gubun:     'both',
  dateType:  '주문일자',
  startDate: '',
  endDate:   '',
  conditions: {},
};

function initState() {
  WHERE_COLUMNS.forEach(col => {
    if (col.type === 'num_range') {
      state.conditions[col.name] = { checked: false, min: '', max: '' };
    } else if (col.type === 'dropdown') {
      state.conditions[col.name] = { checked: false, selected: [] };
    } else {
      state.conditions[col.name] = { checked: false, value: '' };
    }
  });
}

// ─────────────────────────────────────────────
// Render conditions
// ─────────────────────────────────────────────
function renderConditions() {
  const list = document.getElementById('conditionList');
  list.innerHTML = '';

  WHERE_COLUMNS.forEach(col => {
    const cond = state.conditions[col.name];
    const item = document.createElement('div');
    item.className = 'cond-item';
    item.id = `item-${col.name}`;

    // header
    const header = document.createElement('div');
    header.className = 'cond-item__header';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.className = 'cond-item__checkbox';
    chk.id = `chk-${col.name}`;

    const lbl = document.createElement('label');
    lbl.className = 'cond-item__name';
    lbl.htmlFor = `chk-${col.name}`;
    lbl.textContent = `[${col.name}]`;

    const badge = document.createElement('span');
    badge.className = 'cond-item__type-badge';
    badge.textContent = TYPE_LABELS[col.type];

    header.append(chk, lbl, badge);
    item.appendChild(header);

    // body
    const body = document.createElement('div');
    body.className = 'cond-item__body cond-item__body--hidden';
    body.id = `body-${col.name}`;
    body.innerHTML = buildInputHTML(col);
    item.appendChild(body);

    list.appendChild(item);

    chk.addEventListener('change', () => {
      cond.checked = chk.checked;
      item.classList.toggle('cond-item--active', chk.checked);
      body.classList.toggle('cond-item__body--hidden', !chk.checked);
      updateQuery();
    });

    attachInputListeners(col, body, cond);
  });
}

function buildInputHTML(col) {
  if (col.type === 'like') {
    return `<input type="text" class="input cond-text" placeholder="값1, 값2, ... (쉼표로 구분)">`;
  }
  if (col.type === 'eq') {
    return `<input type="text" class="input cond-text" placeholder="값1, 값2, ... (쉼표로 구분)">`;
  }
  if (col.type === 'num_eq') {
    return `<input type="number" class="input cond-text" placeholder="숫자 입력">`;
  }
  if (col.type === 'num_range') {
    return `
      <div class="input-pair">
        <input type="number" class="input cond-min" placeholder="최솟값">
        <span>~</span>
        <input type="number" class="input cond-max" placeholder="최댓값">
      </div>`;
  }
  if (col.type === 'dropdown') {
    const chips = col.options
      .map(o => `<span class="chip" data-val="${o}">${o}</span>`)
      .join('');
    return `<div class="chip-group">${chips}</div>`;
  }
  return '';
}

function attachInputListeners(col, body, cond) {
  if (col.type === 'like' || col.type === 'eq' || col.type === 'num_eq') {
    const inp = body.querySelector('.cond-text');
    inp.addEventListener('input', () => { cond.value = inp.value.trim(); updateQuery(); });
    return;
  }
  if (col.type === 'num_range') {
    body.querySelector('.cond-min').addEventListener('input', e => { cond.min = e.target.value; updateQuery(); });
    body.querySelector('.cond-max').addEventListener('input', e => { cond.max = e.target.value; updateQuery(); });
    return;
  }
  if (col.type === 'dropdown') {
    body.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const val = chip.dataset.val;
        if (col.multi) {
          if (cond.selected.includes(val)) {
            cond.selected = cond.selected.filter(v => v !== val);
            chip.classList.remove('chip--active');
          } else {
            cond.selected.push(val);
            chip.classList.add('chip--active');
          }
        } else {
          body.querySelectorAll('.chip').forEach(c => c.classList.remove('chip--active'));
          if (cond.selected[0] === val) {
            cond.selected = [];
          } else {
            cond.selected = [val];
            chip.classList.add('chip--active');
          }
        }
        updateQuery();
      });
    });
  }
}

// ─────────────────────────────────────────────
// Query builder
// ─────────────────────────────────────────────
function buildQuery() {
  const { gubun, dateType, startDate, endDate } = state;
  if (!startDate || !endDate) return null;
  if (endDate < startDate) return null;

  const parts = [];

  // SELECT
  parts.push('SELECT *');
  parts.push('FROM [sidiz].[DM_ERP_시디즈_수주건별매출현황_OOR0050_M01]');

  // WHERE — fixed conditions
  const conds = [];

  if (gubun === 'both') {
    conds.push(`[구분] IN ('수주', '매출')`);
  } else {
    conds.push(`[구분] = '${gubun}'`);
  }
  conds.push(`[회사] = '시디즈'`);
  conds.push(`[브랜드] = '시디즈'`);
  conds.push(`[${dateType}] BETWEEN '${startDate}' AND '${endDate}'`);

  // WHERE — user conditions
  WHERE_COLUMNS.forEach(col => {
    const cond = state.conditions[col.name];
    if (!cond.checked) return;

    if (col.type === 'like') {
      if (cond.value) {
        const vals = cond.value.split(',').map(v => v.trim()).filter(Boolean);
        if (vals.length === 1) {
          conds.push(`[${col.name}] LIKE '%${vals[0]}%'`);
        } else if (vals.length > 1) {
          const or = vals.map(v => `[${col.name}] LIKE '%${v}%'`).join(' OR ');
          conds.push(`(${or})`);
        }
      }
    } else if (col.type === 'eq') {
      if (cond.value) {
        const vals = cond.value.split(',').map(v => v.trim()).filter(Boolean);
        if (vals.length === 1) {
          conds.push(`[${col.name}] = '${vals[0]}'`);
        } else if (vals.length > 1) {
          const inList = vals.map(v => `'${v}'`).join(', ');
          conds.push(`[${col.name}] IN (${inList})`);
        }
      }
    } else if (col.type === 'num_eq') {
      if (cond.value !== '') conds.push(`[${col.name}] = ${cond.value}`);
    } else if (col.type === 'num_range') {
      const hasMin = cond.min !== '';
      const hasMax = cond.max !== '';
      if (hasMin && hasMax) {
        conds.push(`[${col.name}] BETWEEN ${cond.min} AND ${cond.max}`);
      } else if (hasMin) {
        conds.push(`[${col.name}] >= ${cond.min}`);
      } else if (hasMax) {
        conds.push(`[${col.name}] <= ${cond.max}`);
      }
    } else if (col.type === 'dropdown') {
      if (cond.selected.length === 1) {
        conds.push(`[${col.name}] = '${cond.selected[0]}'`);
      } else if (cond.selected.length > 1) {
        const vals = cond.selected.map(v => `'${v}'`).join(', ');
        conds.push(`[${col.name}] IN (${vals})`);
      }
    }
  });

  const whereLines = conds.map((c, i) => (i === 0 ? `WHERE ${c}` : `  AND ${c}`));
  parts.push(...whereLines);

  return parts.join('\n');
}

function updateQuery() {
  const { startDate, endDate } = state;

  // date validation
  const dateError = document.getElementById('dateError');
  dateError.hidden = !(startDate && endDate && endDate < startDate);

  const output = document.getElementById('queryOutput');
  const lineNums = document.getElementById('lineNumbers');

  const query = buildQuery();

  if (!query) {
    output.textContent = '-- 기간 조건을 설정하면\n-- 쿼리가 자동으로 생성됩니다.';
    lineNums.textContent = '';
    return;
  }

  output.textContent = query;
  const lineCount = query.split('\n').length;
  lineNums.textContent = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
}

// ─────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('toast--show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('toast--show'), 2400);
}

// ─────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────
function resetAll() {
  document.querySelector('input[name="gubun"][value="both"]').checked = true;
  document.querySelector('input[name="dateType"][value="주문일자"]').checked = true;
  state.gubun = 'both';
  state.dateType = '주문일자';

  document.getElementById('startDate').value = '';
  document.getElementById('endDate').value = '';
  state.startDate = '';
  state.endDate = '';

  WHERE_COLUMNS.forEach(col => {
    const cond = state.conditions[col.name];
    cond.checked = false;
    if (col.type === 'num_range') { cond.min = ''; cond.max = ''; }
    else if (col.type === 'dropdown') { cond.selected = []; }
    else { cond.value = ''; }
  });

  renderConditions();
  updateQuery();
}

// ─────────────────────────────────────────────
// Init
// ─────────────────────────────────────────────
function init() {
  initState();
  renderConditions();
  updateQuery();

  document.querySelectorAll('input[name="gubun"]').forEach(r =>
    r.addEventListener('change', () => { state.gubun = r.value; updateQuery(); })
  );

  document.querySelectorAll('input[name="dateType"]').forEach(r =>
    r.addEventListener('change', () => { state.dateType = r.value; updateQuery(); })
  );

  document.getElementById('startDate').addEventListener('change', e => {
    state.startDate = e.target.value;
    updateQuery();
  });
  document.getElementById('endDate').addEventListener('change', e => {
    state.endDate = e.target.value;
    updateQuery();
  });

  document.getElementById('generateBtn').addEventListener('click', () => {
    const { startDate, endDate } = state;
    if (!startDate || !endDate) {
      showToast('기간(시작일, 종료일)을 설정해주세요.');
      return;
    }
    if (endDate < startDate) {
      showToast('종료일은 시작일 이후여야 합니다.');
      return;
    }
    document.getElementById('queryOutput').closest('.card').scrollIntoView({ behavior: 'smooth' });
    showToast('쿼리가 생성되었습니다.');
  });

  document.getElementById('copyBtn').addEventListener('click', () => {
    const text = document.getElementById('queryOutput').textContent;
    if (!text || text.startsWith('--')) {
      showToast('복사할 쿼리가 없습니다.');
      return;
    }
    navigator.clipboard.writeText(text)
      .then(() => showToast('클립보드에 복사되었습니다!'))
      .catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('클립보드에 복사되었습니다!');
      });
  });

  document.getElementById('resetBtn').addEventListener('click', resetAll);
}

document.addEventListener('DOMContentLoaded', init);
