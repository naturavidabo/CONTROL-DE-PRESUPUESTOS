const STORAGE_KEY = 'control_presupuesto_v1';
const defaultCategories = ['Transporte local','Viajes','Alquiler / vivienda','Alimentación','Bebidas / antojos','Higiene / limpieza','Salud','Trabajo / académico','Uniformes / accesorios','Trámites / bancos','Comunicación','Otros'];
const defaultFavorites = [
  {label:'Micro', amount:2.5, category:'Transporte local'},
  {label:'Taxi', amount:10, category:'Transporte local'},
  {label:'Almuerzo', amount:20, category:'Alimentación'},
  {label:'Gaseosa', amount:5, category:'Bebidas / antojos'}
];
let state = load();
function load(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw) return JSON.parse(raw);
  return {expenses:[], categories: defaultCategories, favorites: defaultFavorites, settings:{monthlyBudget:0,savingsGoal:0}, projects:[{id:'general', name:'Gastos generales', budget:0, active:true}]};
}
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); render(); }
const $ = id => document.getElementById(id);
function money(n){ return `Bs ${Number(n||0).toFixed(2)}`; }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function startOfWeek(d=new Date()){ const x=new Date(d); const day=(x.getDay()+6)%7; x.setDate(x.getDate()-day); x.setHours(0,0,0,0); return x; }
function isSameDay(date){ return date === todayStr(); }
function inThisWeek(date){ const d = new Date(date+'T12:00:00'); return d >= startOfWeek() && d <= new Date(); }
function inThisMonth(date){ const now = new Date(); const d = new Date(date+'T12:00:00'); return d.getMonth()===now.getMonth() && d.getFullYear()===now.getFullYear(); }
function activeProject(){ return state.projects.find(p=>p.active) || state.projects[0]; }
function addExpense(amount, category, detail='', projectId=null){
  const value = Number(amount);
  if(!value || value <= 0) return;
  state.expenses.unshift({id:crypto.randomUUID(), amount:value, category, detail, projectId:projectId || activeProject().id, date:todayStr(), createdAt:new Date().toISOString()});
  save(); flashSaved();
}
function flashSaved(){ const el=$('savedMsg'); el.hidden=false; setTimeout(()=>el.hidden=true,1500); }
function filteredByPeriod(period){
  return state.expenses.filter(e => period==='day' ? isSameDay(e.date) : period==='week' ? inThisWeek(e.date) : inThisMonth(e.date));
}
function sum(list){ return list.reduce((a,e)=>a+Number(e.amount),0); }
function render(){
  renderSelectors(); renderTotals(); renderFavorites(); renderSummary(); renderHistory(); renderProjects();
}
function renderSelectors(){
  $('categoryInput').innerHTML = state.categories.map(c=>`<option>${c}</option>`).join('');
  $('projectInput').innerHTML = state.projects.map(p=>`<option value="${p.id}" ${p.active?'selected':''}>${p.name}</option>`).join('');
  $('activeProjectLabel').textContent = activeProject().name;
  $('monthlyBudgetInput').value = state.settings.monthlyBudget || '';
  $('savingsGoalInput').value = state.settings.savingsGoal || '';
}
function renderTotals(){
  const today=sum(filteredByPeriod('day')), week=sum(filteredByPeriod('week')), month=sum(filteredByPeriod('month'));
  const usable=(Number(state.settings.monthlyBudget)||0)-(Number(state.settings.savingsGoal)||0);
  $('todayTotal').textContent=money(today); $('weekTotal').textContent=money(week); $('monthTotal').textContent=money(month);
  $('availableMonth').textContent=money(usable-month);
  $('budgetStatus').textContent = usable>0 ? `Presupuesto usable: ${money(usable)} · Usado: ${Math.min(100, month/usable*100).toFixed(0)}%` : 'Configura tu presupuesto mensual';
  const day = new Date().getDate(); const days = new Date(new Date().getFullYear(), new Date().getMonth()+1, 0).getDate();
  if(usable>0){
    const expected = usable * (day/days);
    $('paceMessage').textContent = month > expected*1.15 ? `⚠️ Estás gastando más rápido de lo previsto. A esta fecha lo ideal sería ir cerca de ${money(expected)} y vas en ${money(month)}.` : `✅ Tu ritmo está controlado. Vas en ${money(month)} de ${money(usable)} disponibles para el mes.`;
  } else $('paceMessage').textContent='Configura tu presupuesto para ver el ritmo de gasto.';
}
function renderFavorites(){
  $('quickButtons').innerHTML = state.favorites.map((f,i)=>`<button class="quick" data-fav="${i}"><strong>${f.label}</strong><span>${money(f.amount)} · ${f.category}</span></button>`).join('');
  document.querySelectorAll('[data-fav]').forEach(btn=>btn.onclick=()=>{const f=state.favorites[btn.dataset.fav]; addExpense(f.amount,f.category,f.label);});
}
function renderSummary(){
  const list=filteredByPeriod($('periodFilter').value); const by={}; list.forEach(e=>by[e.category]=(by[e.category]||0)+Number(e.amount));
  const rows=Object.entries(by).sort((a,b)=>b[1]-a[1]); const max=Math.max(...rows.map(r=>r[1]),1);
  $('categorySummary').innerHTML = rows.length ? rows.map(([cat,total])=>`<div class="bar-row"><div class="bar-info"><span>${cat}</span><strong>${money(total)}</strong></div><div class="bar-bg"><div class="bar-fill" style="width:${total/max*100}%"></div></div></div>`).join('') : '<p class="pace">Todavía no hay gastos en este periodo.</p>';
}
function renderHistory(){
  const q=($('searchInput').value||'').toLowerCase();
  const list=state.expenses.filter(e=>`${e.category} ${e.detail} ${e.date}`.toLowerCase().includes(q)).slice(0,80);
  $('historyList').innerHTML = list.length ? list.map(e=>`<div class="item"><div><strong>${e.category}</strong><small>${e.date} · ${e.detail||'Sin detalle'}</small></div><div><strong>${money(e.amount)}</strong><div class="item-actions"><button class="mini-btn" data-edit="${e.id}">Editar</button><button class="mini-btn delete" data-del="${e.id}">Borrar</button></div></div></div>`).join('') : '<p class="pace">Sin gastos registrados.</p>';
  document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>{ if(confirm('¿Borrar este gasto?')){ state.expenses=state.expenses.filter(e=>e.id!==b.dataset.del); save(); }});
  document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>{ const e=state.expenses.find(x=>x.id===b.dataset.edit); const val=prompt('Nuevo monto:', e.amount); if(val && Number(val)>0){ e.amount=Number(val); save(); }});
}
function renderProjects(){
  $('projectList').innerHTML = state.projects.map(p=>{ const total=sum(state.expenses.filter(e=>e.projectId===p.id)); const avail=Number(p.budget||0)-total; return `<div class="item"><div><strong>${p.name}</strong><small>${p.budget?`Presupuesto ${money(p.budget)} · Disponible ${money(avail)}`:'Sin presupuesto'} · Gastado ${money(total)}</small></div><button class="mini-btn" data-active="${p.id}">${p.active?'Activo':'Usar'}</button></div>` }).join('');
  document.querySelectorAll('[data-active]').forEach(b=>b.onclick=()=>{ state.projects.forEach(p=>p.active=p.id===b.dataset.active); save(); });
}
$('expenseForm').onsubmit=e=>{e.preventDefault(); addExpense($('amountInput').value,$('categoryInput').value,$('detailInput').value,$('projectInput').value); $('amountInput').value=''; $('detailInput').value=''; $('amountInput').focus();};
$('periodFilter').onchange=renderSummary; $('searchInput').oninput=renderHistory;
document.querySelectorAll('.tab').forEach(t=>t.onclick=()=>{document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab-content').forEach(x=>x.classList.remove('active'));t.classList.add('active');$(t.dataset.tab+'Tab').classList.add('active');});
$('settingsBtn').onclick=()=>$('modal').hidden=false; $('closeModal').onclick=()=>$('modal').hidden=true;
$('saveSettingsBtn').onclick=()=>{state.settings.monthlyBudget=Number($('monthlyBudgetInput').value)||0;state.settings.savingsGoal=Number($('savingsGoalInput').value)||0;$('modal').hidden=true;save();};
$('addCategoryBtn').onclick=()=>{const c=$('newCategoryInput').value.trim(); if(c && !state.categories.includes(c)){state.categories.push(c);$('newCategoryInput').value='';save();}};
$('addFavoriteBtn').onclick=()=>{const label=prompt('Nombre del favorito:'); if(!label) return; const amount=Number(prompt('Monto en Bs:')); if(!amount) return; const category=prompt('Categoría:', state.categories[0]) || state.categories[0]; state.favorites.push({label,amount,category}); save();};
$('projectForm').onsubmit=e=>{e.preventDefault(); state.projects.forEach(p=>p.active=false); state.projects.push({id:crypto.randomUUID(), name:$('projectNameInput').value.trim(), budget:Number($('projectBudgetInput').value)||0, active:true}); $('projectNameInput').value=''; $('projectBudgetInput').value=''; save();};
$('resetBtn').onclick=()=>{ if(confirm('Esto borrará todos los gastos y configuración. ¿Continuar?')){ localStorage.removeItem(STORAGE_KEY); state=load(); $('modal').hidden=true; render(); }};
if('serviceWorker' in navigator){ navigator.serviceWorker.register('sw.js').catch(()=>{}); }
render();
