// ================================
// taskflow v2 — app.js
// ================================

// ---- Avatar color palette ----
const AVATAR_COLORS = [
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#EAF3DE', color: '#27500A' },
  { bg: '#FAEEDA', color: '#633806' },
  { bg: '#FCEBEB', color: '#791F1F' },
  { bg: '#EEEDFE', color: '#3C3489' },
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#FBEAF0', color: '#72243E' },
];

function avatarColor(username) {
  const idx = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function initials(name) {
  return name.trim().split(/\s+/).map(p => p[0]).slice(0, 2).join('').toUpperCase();
}

// ---- Constants ----
const API_BASE = 'http://localhost:8080/api';
const PRIO_LABEL = { ALTA: 'Alta', MEDIA: 'Média', BAIXA: 'Baixa', high: 'Alta', medium: 'Média', low: 'Baixa' };
const PRIO_CLASS = { ALTA: 'bp-high', MEDIA: 'bp-medium', BAIXA: 'bp-low', high: 'bp-high', medium: 'bp-medium', low: 'bp-low' };

// ---- State ----
let currentUser = null;
let memberFilter = 'all';
let editingMember = null;
let pendingDelete = null;

// ---- API helpers ----
async function apiGet(path) {
  try {
    const r = await fetch(`${API_BASE}${path}`);
    return r.ok ? await r.json() : null;
  } catch (e) {
    console.error('Erro API:', e);
    return null;
  }
}

async function apiPost(path, body) {
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    return r.ok ? await r.json() : null;
  } catch (e) {
    console.error('Erro API:', e);
    return null;
  }
}

async function apiDelete(path) {
  try {
    const r = await fetch(`${API_BASE}${path}`, { method: 'DELETE' });
    return r.ok;
  } catch (e) {
    console.error('Erro API:', e);
    return false;
  }
}

async function loadMembers() {
  return await apiGet('/membros') || [];
}

async function loadTasks() {
  return await apiGet('/tarefas') || [];
}

function loadConfig() { return JSON.parse(localStorage.getItem('tf_config') || '{"instance":"","token":"","clientToken":""}'); }
function saveConfigData(c) { localStorage.setItem('tf_config', JSON.stringify(c)); }


// ---- Utils ----
function escHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = d.split('-');
  return `${day}/${m}/${y}`;
}

function isLate(t) {
  if (t.done || !t.due) return false;
  return t.due < new Date().toISOString().slice(0, 10);
}

// ---- Toast ----
function toast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (type ? ' ' + type : '');
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 3500);
}

// ---- Screens ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + id).classList.add('active');
}

// ---- Tabs ----
function switchTab(name, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  document.getElementById('tab-' + name).classList.add('active');
  if (name === 'team') renderTeam();
  if (name === 'config') loadConfigUI();
}

// ---- Login hint ----
function buildHint() {
  const members = loadMembers();
  const names = members.map(m => `<strong>${m.username}</strong>`).join(', ');
  document.getElementById('login-hint').innerHTML =
    `Admin: <strong>admin</strong> / admin123<br>Equipe: ${names} / senha123`;
}

// ---- Auth ----
async function doLogin() {
  const u = document.getElementById('login-user').value.trim().toLowerCase();
  const p = document.getElementById('login-pass').value;
  const err = document.getElementById('login-error');

  // Admin built-in for simplicity
  if (u === 'admin' && p === 'admin123') {
    err.textContent = '';
    currentUser = { username: 'admin', role: 'admin', name: 'Admin' };
    showScreen('admin');
    switchTab('tasks', document.querySelector('.tab'));
    await renderAdminTasks();
    await populateMemberSelect();
    return;
  }

  // Members via API
  const m = await apiPost('/autenticacao/login', { usuario: u, senha: p });
  if (!m) { err.textContent = 'Usuário ou senha incorretos.'; return; }

  err.textContent = '';
  currentUser = { username: m.usuario, role: 'member', name: m.nome };

  const av = document.getElementById('member-avatar');
  av.textContent = initials(m.nome);
  const ac = avatarColor(m.usuario);
  av.style.background = ac.bg;
  av.style.color = ac.color;

  document.getElementById('member-name-top').textContent = m.nome;
  document.getElementById('member-greeting').textContent = 'Olá, ' + m.nome + '!';

  memberFilter = 'all';
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.filter-btn').classList.add('active');

  showScreen('member');
  await renderMemberTasks();
}


function doLogout() {
  currentUser = null;
  document.getElementById('login-user').value = '';
  document.getElementById('login-pass').value = '';
  document.getElementById('login-error').textContent = '';
  showScreen('login');
}

document.getElementById('login-pass').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
document.getElementById('login-user').addEventListener('keydown', e => { if (e.key === 'Enter') document.getElementById('login-pass').focus(); });

// ---- Member select (for task assignment) ----
async function populateMemberSelect() {
  const sel = document.getElementById('task-user');
  const cur = sel.value;
  sel.innerHTML = '<option value="">Atribuir a...</option>';
  const members = await loadMembers();
  members.forEach(m => {
    const o = document.createElement('option');
    o.value = m.id; // Agora usamos ID numérico
    o.textContent = m.nome;
    if (String(m.id) === cur) o.selected = true;
    sel.appendChild(o);
  });
}


// ================================ TEAM TAB
async function renderTeam() {
  const members = await loadMembers();
  const tasks = await loadTasks();
  document.getElementById('team-count').textContent = members.length + ' integrante' + (members.length !== 1 ? 's' : '');

  const grid = document.getElementById('team-grid');
  grid.innerHTML = members.map(m => {
    const total = tasks.filter(t => t.membro && t.membro.usuario === m.usuario).length;
    const done = tasks.filter(t => t.membro && t.membro.usuario === m.usuario && t.concluida).length;
    const ac = avatarColor(m.usuario);
    return `
      <div class="member-card">
        <div class="member-card-top">
          <div class="member-av" style="background:${ac.bg};color:${ac.color}">${initials(m.nome)}</div>
          <div>
            <div class="member-name">${escHtml(m.nome)}</div>
            <div class="member-login">@${escHtml(m.usuario)}</div>
          </div>
        </div>
        <div class="member-stats">${total} tarefa${total !== 1 ? 's' : ''} &middot; ${done} concluída${done !== 1 ? 's' : ''}</div>
        <div class="member-card-actions">
          <button class="btn-sm" onclick="openModal('${m.usuario}')">Editar</button>
          <button class="btn-sm danger" onclick="askDeleteMember('${m.usuario}')">Remover</button>
        </div>
      </div>
    `;
  }).join('');

  // Add-member card
  grid.innerHTML += `
    <button class="btn-add-member" onclick="openModal()">
      <div class="plus-icon">+</div>
      Novo integrante
    </button>
  `;
}


// ================================ MODAL: NEW / EDIT MEMBER
function openModal(username) {
  editingMember = username || null;
  document.getElementById('modal-error').textContent = '';

  const titleEl = document.getElementById('modal-member-title');
  const unInput = document.getElementById('new-username');

  if (username) {
    const m = loadMembers().find(x => x.username === username);
    document.getElementById('new-name').value = m.name;
    document.getElementById('new-username').value = m.username;
    document.getElementById('new-pass').value = m.pass;
    document.getElementById('new-phone').value = m.phone || '';
    unInput.disabled = true;
    titleEl.textContent = 'Editar integrante';
    document.querySelector('#modal-member .btn-modal-confirm').textContent = 'Salvar alterações';
  } else {
    document.getElementById('new-name').value = '';
    document.getElementById('new-username').value = '';
    document.getElementById('new-pass').value = '';
    document.getElementById('new-phone').value = '';
    unInput.disabled = false;
    titleEl.textContent = 'Novo integrante';
    document.querySelector('#modal-member .btn-modal-confirm').textContent = 'Cadastrar';
  }

  document.getElementById('modal-member').classList.add('open');
  setTimeout(() => document.getElementById('new-name').focus(), 80);
}

function closeModal() {
  document.getElementById('modal-member').classList.remove('open');
  document.getElementById('new-username').disabled = false;
  editingMember = null;
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('modal-member')) closeModal();
}

async function confirmNewMember() {
  const name = document.getElementById('new-name').value.trim();
  const username = document.getElementById('new-username').value.trim().toLowerCase().replace(/\s+/g, '');
  const pass = document.getElementById('new-pass').value.trim();
  const phone = document.getElementById('new-phone').value.trim();
  const errEl = document.getElementById('modal-error');

  if (!name) { errEl.textContent = 'Informe o nome completo.'; return; }
  if (!username) { errEl.textContent = 'Informe um login.'; return; }
  if (!pass) { errEl.textContent = 'Informe uma senha.'; return; }
  if (username === 'admin') { errEl.textContent = 'Login "admin" é reservado.'; return; }

  if (editingMember) {
    // Editar: No backend simples aqui estamos só salvando como novo se não existe ou atualizando
    // Mas para o MVP vamos focar na criação. Edição precisaria de PUT/PATCH.
    // Vamos simplificar para criação.
    await apiPost('/membros', { id: editingMember.id, nome: name, usuario: username, senha: pass, telefone: phone });
    closeModal();
    await renderTeam();
    await populateMemberSelect();
    toast('Integrante atualizado!', 'success');
  } else {
    const ok = await apiPost('/membros', { nome: name, usuario: username, senha: pass, telefone: phone });
    if (!ok) {
      errEl.textContent = 'Erro ao salvar. Verifique se o login já existe.';
      return;
    }
    closeModal();
    await renderTeam();
    await populateMemberSelect();
    toast('Integrante ' + name + ' cadastrado!', 'success');
  }
}


// Enter key in modal
document.getElementById('modal-member').addEventListener('keydown', e => {
  if (e.key === 'Enter') confirmNewMember();
  if (e.key === 'Escape') closeModal();
});

// ================================ MODAL: DELETE MEMBER
function askDeleteMember(username) {
  pendingDelete = username;
  const m = loadMembers().find(x => x.username === username);
  const pending = loadTasks().filter(t => t.user === username && !t.done).length;
  const text = `Deseja remover "${m.name}" (@${username})? ` +
    (pending > 0 ? `Ele(a) tem ${pending} tarefa(s) pendente(s) — elas serão mantidas no sistema.` : '');
  document.getElementById('delete-confirm-text').textContent = text;
  document.getElementById('modal-delete').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('modal-delete').classList.remove('open');
  pendingDelete = null;
}

function closeDeleteOutside(e) {
  if (e.target === document.getElementById('modal-delete')) closeDeleteModal();
}

async function confirmDelete() {
  if (!pendingDelete) return;
  // Precisamos carregar membros para achar o ID
  const members = await loadMembers();
  const m = members.find(x => x.usuario === pendingDelete);
  if (m) {
    await apiDelete('/membros/' + m.id);
    closeDeleteModal();
    await renderTeam();
    await populateMemberSelect();
    toast('Integrante removido.', 'warn');
  }
}


document.getElementById('modal-delete').addEventListener('keydown', e => {
  if (e.key === 'Escape') closeDeleteModal();
});

// ================================ CONFIG TAB
function loadConfigUI() {
  const c = loadConfig();
  document.getElementById('zapi-instance').value = c.instance || '';
  document.getElementById('zapi-token').value = c.token || '';
  document.getElementById('zapi-client-token').value = c.clientToken || '';

  const members = loadMembers();
  document.getElementById('member-phones').innerHTML = members.map(m => `
    <div class="member-phone-row">
      <div class="phone-label">${escHtml(m.name)}</div>
      <input type="text" id="phone-${m.username}" placeholder="5521999990000"
        value="${escHtml(m.phone || '')}" />
    </div>
  `).join('');
}

function saveConfig() {
  // Persist phone numbers into members
  const members = loadMembers().map(m => {
    const el = document.getElementById('phone-' + m.username);
    return { ...m, phone: el ? el.value.trim() : m.phone };
  });
  saveMembers(members);

  const c = {
    instance: document.getElementById('zapi-instance').value.trim(),
    token: document.getElementById('zapi-token').value.trim(),
    clientToken: document.getElementById('zapi-client-token').value.trim(),
  };
  saveConfigData(c);
  toast('Configurações salvas!', 'success');
}

// ================================ WHATSAPP
async function sendWapp(phone, msg) {
  const c = loadConfig();
  if (!c.instance || !c.token) return { ok: false, reason: 'sem_config' };
  if (!phone) return { ok: false, reason: 'sem_numero' };

  const url = `https://api.z-api.io/instances/${c.instance}/token/${c.token}/send-text`;
  const headers = { 'Content-Type': 'application/json' };
  if (c.clientToken) headers['Client-Token'] = c.clientToken;

  try {
    const r = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ phone, message: msg }) });
    const d = await r.json();
    return { ok: r.ok, data: d };
  } catch (e) {
    return { ok: false, reason: 'erro_rede', detail: e.message };
  }
}

async function testWapp() {
  saveConfig();
  const c = loadConfig();
  if (!c.instance || !c.token) { toast('Preencha Instance ID e Token antes.', 'error'); return; }
  const members = loadMembers();
  const phone = members.find(m => m.phone)?.phone;
  if (!phone) { toast('Cadastre pelo menos um número na aba Equipe.', 'error'); return; }
  toast('Enviando mensagem de teste...');
  const r = await sendWapp(phone, '✅ *taskflow — teste de conexão*\n\nSeu WhatsApp está configurado corretamente!');
  if (r.ok) toast('Mensagem de teste enviada!', 'success');
  else toast('Falha. Verifique as credenciais Z-API.', 'error');
}

// ================================ TASKS
async function addTask() {
  const title = document.getElementById('task-title').value.trim();
  const desc = document.getElementById('task-desc').value.trim();
  const userId = document.getElementById('task-user').value;
  const prio = document.getElementById('task-prio').value.toUpperCase(); // ALTA, MEDIA, BAIXA
  const due = document.getElementById('task-due').value;

  if (!title) { document.getElementById('task-title').focus(); toast('Digite o título da tarefa.', 'error'); return; }
  if (!userId) { document.getElementById('task-user').focus(); toast('Selecione o membro.', 'error'); return; }

  const task = {
    titulo: title,
    descricao: desc,
    membro: { id: userId },
    prioridade: prio,
    prazo: due || null,
    concluida: false
  };

  const ok = await apiPost('/tarefas', task);
  if (ok) {
    document.getElementById('task-title').value = '';
    document.getElementById('task-desc').value = '';
    document.getElementById('task-due').value = '';
    await renderAdminTasks();
    toast('Tarefa lançada com sucesso!', 'success');
  } else {
    toast('Erro ao lançar tarefa.', 'error');
  }
}


async function checkLate() {
  const tasks = loadTasks();
  const late = tasks.filter(t => isLate(t));
  if (!late.length) { toast('Nenhuma tarefa atrasada.', 'success'); return; }

  const c = loadConfig();
  if (!c.instance || !c.token) { toast('Configure as credenciais Z-API primeiro.', 'error'); return; }

  toast('Enviando alertas para ' + late.length + ' tarefa(s) atrasada(s)...');
  const members = loadMembers();
  let ok = 0, fail = 0;

  for (const t of late) {
    const m = members.find(x => x.username === t.user);
    const phone = m?.phone || '';
    if (!phone) { fail++; continue; }
    const msg = `⚠️ *Tarefa atrasada, ${m.name}!*\n\n*${t.title}*\nPrazo era: ${formatDate(t.due)}\n\nPor favor, atualize o status o quanto antes.`;
    const r = await sendWapp(phone, msg);
    if (r.ok) ok++; else fail++;
  }

  toast(`Alertas enviados: ${ok} ok${fail ? ' | ' + fail + ' falha(s)' : ''}`, ok > 0 ? 'success' : 'warn');
}

async function toggleTask(id) {
  await fetch(`${API_BASE}/tarefas/${id}/alternar`, { method: 'PATCH' });
  if (currentUser.role === 'admin') await renderAdminTasks();
  else await renderMemberTasks();
}

async function deleteTask(id) {
  await apiDelete('/tarefas/' + id);
  await renderAdminTasks();
}


// ================================ RENDER ADMIN TASKS
async function renderAdminTasks() {
  const tasks = await loadTasks();
  const list = document.getElementById('admin-task-list');

  if (!tasks || !tasks.length) {
    list.innerHTML = '<div class="empty-state">Nenhuma tarefa lançada ainda.</div>';
    return;
  }

  list.innerHTML = tasks.map(t => `
    <div class="task-item ${t.concluida ? 'done' : ''}">
      <div class="task-meta">
        <span class="badge bu">${escHtml(t.membro ? t.membro.nome : 'Sem membro')}</span>
        <span class="badge ${PRIO_CLASS[t.prioridade]}">${PRIO_LABEL[t.prioridade]}</span>
        ${isLate(t)
      ? '<span class="badge blate">Atrasada</span>'
      : `<span class="badge ${t.concluida ? 'bdone' : 'bpend'}">${t.concluida ? 'Concluída' : 'Pendente'}</span>`
    }
        ${t.prazo ? `<span style="font-size:11px;color:var(--text-faint)">${formatDate(t.prazo)}</span>` : ''}
      </div>
      <div class="task-title-txt">${escHtml(t.titulo)}</div>
      ${t.descricao ? `<div class="task-desc-txt">${escHtml(t.descricao)}</div>` : ''}
      <div class="task-actions">
        <button class="btn-sm" onclick="toggleTask(${t.id})">${t.concluida ? 'Reabrir' : 'Concluir'}</button>
        <button class="btn-sm danger" onclick="deleteTask(${t.id})">Excluir</button>
      </div>
    </div>
  `).join('');
}


// ================================ RENDER MEMBER TASKS
function setFilter(f, btn) {
  memberFilter = f;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMemberTasks();
}

async function renderMemberTasks() {
  let allTasks = await loadTasks();
  let tasks = allTasks.filter(t => t.membro && t.membro.usuario === currentUser.username);

  document.getElementById('stat-total').textContent = tasks.length;
  document.getElementById('stat-pending').textContent = tasks.filter(t => !t.concluida).length;
  document.getElementById('stat-done').textContent = tasks.filter(t => t.concluida).length;

  if (memberFilter === 'pending') tasks = tasks.filter(t => !t.concluida);
  else if (memberFilter === 'done') tasks = tasks.filter(t => t.concluida);
  else if (memberFilter === 'high') tasks = tasks.filter(t => t.prioridade === 'ALTA');

  const list = document.getElementById('member-task-list');
  if (!tasks || !tasks.length) { list.innerHTML = '<div class="empty-state">Nenhuma tarefa aqui.</div>'; return; }

  list.innerHTML = tasks.map(t => `
    <div class="task-item ${t.concluida ? 'done' : ''}">
      <div class="task-check-row">
        <input type="checkbox" class="member-check" ${t.concluida ? 'checked' : ''} onchange="toggleTask(${t.id})" />
        <div style="flex:1">
          <div class="task-meta">
            <span class="badge ${PRIO_CLASS[t.prioridade]}">${PRIO_LABEL[t.prioridade]}</span>
            ${isLate(t) ? '<span class="badge blate">Atrasada</span>' : ''}
            ${t.prazo ? `<span style="font-size:11px;color:var(--text-faint)">${formatDate(t.prazo)}</span>` : ''}
          </div>
          <div class="task-title-txt">${escHtml(t.titulo)}</div>
          ${t.descricao ? `<div class="task-desc-txt">${escHtml(t.descricao)}</div>` : ''}
        </div>
      </div>
    </div>
  `).join('');
}


// ---- Login hint ----
async function buildHint() {
  const members = await loadMembers();
  if (!members) return;
  const names = members.map(m => `<strong>${m.usuario}</strong>`).join(', ');
  document.getElementById('login-hint').innerHTML =
    `Admin: <strong>admin</strong> / admin123<br>Equipe: ${names} / senha123`;
}

// ================================ INIT
buildHint();

