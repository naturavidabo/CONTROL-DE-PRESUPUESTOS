'use strict';

const STORAGE_KEY = 'control_presupuesto_v1';
const APP_VERSION = 3;
const defaultCategories = [
  'Transporte local','Viajes','Alquiler / vivienda','Alimentación',
  'Bebidas / antojos','Higiene / limpieza','Salud','Trabajo / académico',
  'Uniformes / accesorios','Trámites / bancos','Comunicación','Otros'
];
const defaultFavorites = [
  {label:'Micro', amount:2.5, category:'Transporte local'},
  {label:'Taxi', amount:10, category:'Transporte local'},
  {label:'Almuerzo', amount:20, category:'Alimentación'},
  {label:'Gaseosa', amount:5, category:'Bebidas / antojos'}
];

const $ = id => document.getElementById(id);
const modalIds = [
  'settingsModal','categoriesModal','categoryPickerModal','favoriteConfirmModal',
  'favoriteEditorModal','expenseEditorModal','projectEditorModal'
];
let selectedFavoriteId = null;
let editingFavoriteId = null;
let editingExpenseId = null;
let editingProjectId = null;
let toastTimer = null;
let state = loadState();

function uid(){
  if (globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
function pad(n){ return String(n).padStart(2,'0'); }
function localDateKey(date = new Date()){ return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())}`; }
function monthKey(date = new Date()){ return `${date.getFullYear()}-${pad(date.getMonth()+1)}`; }
function parseAmount(value){
  const normalized = String(value ?? '').trim().replace(/\s/g,'').replace(',','.');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}
function inputAmount(number){ return number ? String(Number(number)).replace('.',',') : ''; }
function money(number){
  return `Bs ${new Intl.NumberFormat('es-BO',{minimumFractionDigits:2,maximumFractionDigits:2}).format(Number(number)||0)}`;
}
function monthLabel(key){
  if (!/^\d{4}-\d{2}$/.test(key)) return key;
  const [year,month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('es-BO',{month:'long',year:'numeric'}).format(new Date(year,month-1,1));
}
function monthShortLabel(key){
  if (!/^\d{4}-\d{2}$/.test(key)) return key;
  const [year,month] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('es-BO',{month:'short',year:'numeric'}).format(new Date(year,month-1,1));
}
function escapeHtml(value){
  return String(value ?? '').replace(/[&<>'"]/g,char=>({
    '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
  })[char]);
}
function initialState(){
  return {
    version:APP_VERSION,
    expenses:[],
    categories:[...defaultCategories],
    favorites:defaultFavorites.map(f=>({id:uid(),...f})),
    monthSettings:{},
    projects:[{id:'general',name:'Gastos generales',budget:0,active:true}]
  };
}
function migrateState(saved){
  const base = initialState();
  const result = saved && typeof saved === 'object' ? saved : base;
  result.expenses = Array.isArray(result.expenses) ? result.expenses : [];
  result.categories = Array.isArray(result.categories) && result.categories.length ? result.categories : [...defaultCategories];
  result.favorites = Array.isArray(result.favorites) ? result.favorites : [];
  result.favorites = result.favorites.map(f=>({id:f.id||uid(),label:f.label||'Favorito',amount:Number(f.amount)||0,category:f.category||result.categories[0]}));
  result.projects = Array.isArray(result.projects) && result.projects.length ? result.projects : [{id:'general',name:'Gastos generales',budget:0,active:true}];
  if (!result.projects.some(p=>p.id==='general')) result.projects.unshift({id:'general',name:'Gastos generales',budget:0,active:false});
  if (!result.projects.some(p=>p.active)) result.projects[0].active = true;
  if (!result.monthSettings || typeof result.monthSettings !== 'object') result.monthSettings = {};
  if (result.settings && !result.monthSettings[monthKey()]) {
    result.monthSettings[monthKey()] = {
      budget:Number(result.settings.monthlyBudget)||0,
      savingsGoal:Number(result.settings.savingsGoal)||0
    };
  }
  result.expenses = result.expenses.map(e=>({
    id:e.id||uid(), amount:Number(e.amount)||0, category:e.category||result.categories[0],
    detail:e.detail||'', projectId:e.projectId||'general', date:e.date||localDateKey(),
    createdAt:e.createdAt||`${e.date||localDateKey()}T12:00:00`
  }));
  result.version = APP_VERSION;
  return result;
}
function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? migrateState(JSON.parse(raw)) : initialState();
  }catch(error){
    console.error('No se pudo leer el almacenamiento local:',error);
    return initialState();
  }
}
function persist({render=true}={}){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(state));
  if (render) renderAll();
}
function sum(list){ return list.reduce((total,item)=>total+Number(item.amount||0),0); }
function startOfWeek(date = new Date()){
  const copy = new Date(date);
  const offset = (copy.getDay()+6)%7;
  copy.setDate(copy.getDate()-offset);
  copy.setHours(0,0,0,0);
  return copy;
}
function inThisWeek(dateKey){
  const value = new Date(`${dateKey}T12:00:00`);
  const now = new Date();
  return value >= startOfWeek(now) && value <= now;
}
function currentPeriodExpenses(period){
  const today = localDateKey();
  const currentMonth = monthKey();
  return state.expenses.filter(e=>{
    if (period==='day') return e.date===today;
    if (period==='week') return inThisWeek(e.date);
    return e.date.slice(0,7)===currentMonth;
  });
}
function activeProject(){ return state.projects.find(p=>p.active) || state.projects[0]; }
function projectById(id){ return state.projects.find(p=>p.id===id) || state.projects.find(p=>p.id==='general'); }
function getMonthSetting(key = monthKey()){
  const item = state.monthSettings[key] || {};
  return {budget:Number(item.budget)||0,savingsGoal:Number(item.savingsGoal)||0};
}
function showToast(message){
  const toast = $('toast');
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ toast.hidden=true; },2200);
}
function openModal(id){
  const element = $(id);
  if (!element) return;
  element.hidden = false;
  document.body.classList.add('modal-open');
}
function closeModal(id){
  const element = $(id);
  if (!element) return;
  element.hidden = true;
  if (modalIds.every(modalId=>$(modalId).hidden)) document.body.classList.remove('modal-open');
}
function closeAllModals(){ modalIds.forEach(closeModal); }
function setSelectOptions(select,items,selectedValue){
  select.innerHTML = items.map(item=>`<option value="${escapeHtml(item.value)}" ${item.value===selectedValue?'selected':''}>${escapeHtml(item.label)}</option>`).join('');
}

function addExpense(amount,category,detail='',projectId='general'){
  const value = parseAmount(amount);
  if (value<=0){ showToast('Ingresa un monto válido.'); return false; }
  state.expenses.unshift({
    id:uid(), amount:value, category:category||state.categories[0], detail:detail.trim(),
    projectId:projectId||activeProject().id, date:localDateKey(), createdAt:new Date().toISOString()
  });
  persist();
  flashSaved();
  return true;
}
function flashSaved(){
  const message = $('savedMsg');
  message.hidden=false;
  setTimeout(()=>{message.hidden=true;},1700);
}

function renderAll(){
  renderSelectors();
  renderTotals();
  renderFavorites();
  renderSummary();
  renderHistoryMonthOptions();
  renderHistory();
  renderProjects();
  renderCategories();
  renderCategoryPicker();
}
function renderSelectors(){
  const currentCategory = state.categories.includes($('categoryInput').value) ? $('categoryInput').value : state.categories[0];
  $('categoryInput').value = currentCategory;
  $('categoryPickerText').textContent = currentCategory;

  const projectValue = state.projects.some(p=>p.id===$('projectInput').value) ? $('projectInput').value : activeProject().id;
  setSelectOptions($('projectInput'),state.projects.map(p=>({value:p.id,label:p.name})),projectValue);
  setSelectOptions($('favoriteConfirmProject'),state.projects.map(p=>({value:p.id,label:p.name})),activeProject().id);
  setSelectOptions($('favoriteCategoryInput'),state.categories.map(c=>({value:c,label:c})),$('favoriteCategoryInput').value||state.categories[0]);
  setSelectOptions($('editExpenseCategory'),state.categories.map(c=>({value:c,label:c})),$('editExpenseCategory').value||state.categories[0]);
  setSelectOptions($('editExpenseProject'),state.projects.map(p=>({value:p.id,label:p.name})),$('editExpenseProject').value||activeProject().id);

  const project = activeProject();
  $('activeProjectLabel').textContent = project.id==='general' ? 'Gastos generales' : `Proyecto activo: ${project.name}`;
}
function renderTotals(){
  const today = sum(currentPeriodExpenses('day'));
  const week = sum(currentPeriodExpenses('week'));
  const monthExpenses = currentPeriodExpenses('month');
  const monthSpent = sum(monthExpenses);
  const currentMonth = monthKey();
  const config = getMonthSetting(currentMonth);
  const usable = Math.max(0,config.budget-config.savingsGoal);
  const available = usable-monthSpent;
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(),now.getMonth()+1,0).getDate();
  const day = now.getDate();
  const daysRemaining = Math.max(1,daysInMonth-day+1);
  const plannedDaily = usable>0 ? usable/daysInMonth : 0;
  const remainingDaily = usable>0 ? Math.max(0,available)/daysRemaining : 0;

  $('currentMonthName').textContent = monthLabel(currentMonth);
  $('todayTotal').textContent = money(today);
  $('weekTotal').textContent = money(week);
  $('monthTotal').textContent = money(monthSpent);
  $('availableMonth').textContent = money(available);

  const badge = $('monthProgressBadge');
  badge.className='badge';
  if (usable<=0){
    badge.textContent='Sin configurar';
    $('budgetStatus').textContent='Configura el presupuesto y el objetivo de ahorro de este mes.';
    $('dailyAllowance').textContent='—';
    $('monthDaysInfo').textContent=`${monthLabel(currentMonth)} tiene ${daysInMonth} días.`;
  }else{
    const percent = monthSpent/usable*100;
    badge.textContent=`${Math.round(percent)}% usado`;
    if (percent>100) badge.classList.add('danger');
    else if (percent>75) badge.classList.add('warning');
    else badge.classList.add('good');
    $('budgetStatus').textContent=`Gasto permitido: ${money(usable)} · Ahorrando: ${money(config.savingsGoal)}`;
    $('dailyAllowance').textContent=`${money(remainingDaily)} / día`;
    $('monthDaysInfo').textContent=`Mes de ${daysInMonth} días · Plan inicial ${money(plannedDaily)} por día · Quedan ${daysRemaining} días.`;
  }

  const expected = usable*(day/daysInMonth);
  if (usable<=0){
    $('paceMessage').textContent='Configura tu presupuesto para ver una referencia diaria y el ritmo de gasto.';
  }else if (available<0){
    $('paceMessage').textContent=`⚠️ Superaste el gasto permitido en ${money(Math.abs(available))}. Revisa las categorías con mayor consumo.`;
  }else if (monthSpent>expected*1.15){
    $('paceMessage').textContent=`⚠️ Estás gastando más rápido de lo previsto. A esta fecha la referencia acumulada era ${money(expected)} y llevas ${money(monthSpent)}.`;
  }else{
    $('paceMessage').textContent=`✓ El ritmo está controlado. Puedes gastar aproximadamente ${money(remainingDaily)} por día durante los ${daysRemaining} días restantes.`;
  }

  renderActiveProjectCard();
}
function renderActiveProjectCard(){
  const project = activeProject();
  const card = $('activeProjectCard');
  if (!project || project.id==='general'){
    card.hidden=true;
    return;
  }
  const spent = sum(state.expenses.filter(e=>e.projectId===project.id));
  const budget = Number(project.budget)||0;
  const available = budget-spent;
  const percent = budget>0 ? Math.max(0,Math.min(100,spent/budget*100)) : 0;
  $('activeProjectName').textContent=project.name;
  $('activeProjectBudget').textContent=budget>0?money(budget):'Sin límite';
  $('activeProjectSpent').textContent=money(spent);
  $('activeProjectAvailable').textContent=budget>0?money(available):'—';
  $('activeProjectProgress').style.width=`${percent}%`;
  card.hidden=false;
}
function renderFavorites(){
  const container=$('quickButtons');
  if (!state.favorites.length){
    container.innerHTML='<p class="pace">Aún no tienes favoritos. Pulsa “+ Favorito” para crear uno.</p>';
    return;
  }
  container.innerHTML=state.favorites.map(f=>`
    <div class="quick-card">
      <button class="quick-use" data-fav-use="${escapeHtml(f.id)}" type="button">
        <strong>${escapeHtml(f.label)}</strong>
        <span>${money(f.amount)} · ${escapeHtml(f.category)}</span>
      </button>
      <button class="quick-edit" data-fav-edit="${escapeHtml(f.id)}" type="button" aria-label="Editar ${escapeHtml(f.label)}">✎</button>
    </div>`).join('');
  container.querySelectorAll('[data-fav-use]').forEach(button=>button.addEventListener('click',()=>openFavoriteConfirmation(button.dataset.favUse)));
  container.querySelectorAll('[data-fav-edit]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();openFavoriteEditor(button.dataset.favEdit);}));
}
function openFavoriteConfirmation(id){
  const favorite=state.favorites.find(f=>f.id===id);
  if (!favorite) return;
  selectedFavoriteId=id;
  $('favoriteConfirmTitle').textContent=`Registrar ${favorite.label}`;
  $('favoriteConfirmInfo').textContent=`Categoría: ${favorite.category}. Revisa el monto antes de confirmar.`;
  $('favoriteConfirmAmount').value=inputAmount(favorite.amount);
  setSelectOptions($('favoriteConfirmProject'),state.projects.map(p=>({value:p.id,label:p.name})),activeProject().id);
  openModal('favoriteConfirmModal');
  setTimeout(()=>$('favoriteConfirmAmount').focus(),80);
}
function openFavoriteEditor(id=null){
  editingFavoriteId=id;
  const favorite=id?state.favorites.find(f=>f.id===id):null;
  $('favoriteEditorTitle').textContent=favorite?'Editar favorito':'Nuevo favorito';
  $('favoriteLabelInput').value=favorite?.label||'';
  $('favoriteAmountInput').value=inputAmount(favorite?.amount||0);
  setSelectOptions($('favoriteCategoryInput'),state.categories.map(c=>({value:c,label:c})),favorite?.category||state.categories[0]);
  $('deleteFavoriteBtn').hidden=!favorite;
  openModal('favoriteEditorModal');
  setTimeout(()=>$('favoriteLabelInput').focus(),80);
}
function renderSummary(){
  const period=$('periodFilter').value;
  const list=currentPeriodExpenses(period);
  const byCategory={};
  list.forEach(e=>{byCategory[e.category]=(byCategory[e.category]||0)+Number(e.amount)});
  const rows=Object.entries(byCategory).sort((a,b)=>b[1]-a[1]);
  const max=Math.max(1,...rows.map(row=>row[1]));
  const periodText=period==='day'?'hoy':period==='week'?'la semana':'el mes';
  $('categoryPeriodTotal').textContent=`Total de ${periodText}: ${money(sum(list))}`;
  $('categorySummary').innerHTML=rows.length?rows.map(([category,total])=>`
    <div class="bar-row">
      <div class="bar-info"><span>${escapeHtml(category)}</span><strong>${money(total)}</strong></div>
      <div class="bar-bg"><div class="bar-fill" style="width:${Math.max(4,total/max*100)}%"></div></div>
    </div>`).join(''):'<p class="pace">Todavía no hay gastos en este periodo.</p>';
}
function getHistoryMonths(){
  const months=new Set([monthKey(),...state.expenses.map(e=>e.date.slice(0,7))]);
  return [...months].filter(m=>/^\d{4}-\d{2}$/.test(m)).sort().reverse();
}
function renderHistoryMonthOptions(){
  const select=$('historyMonthFilter');
  const previous=select.value||monthKey();
  const months=getHistoryMonths();
  select.innerHTML=`<option value="all">Todos los meses</option>${months.map(m=>`<option value="${m}">${escapeHtml(monthLabel(m))}</option>`).join('')}`;
  select.value=[...select.options].some(o=>o.value===previous)?previous:monthKey();
}
function historyFilteredExpenses(){
  const query=($('searchInput').value||'').trim().toLowerCase();
  const selectedMonth=$('historyMonthFilter').value||monthKey();
  return state.expenses.filter(e=>{
    const project=projectById(e.projectId);
    const text=`${e.category} ${e.detail} ${e.date} ${project?.name||''}`.toLowerCase();
    const matchesMonth=selectedMonth==='all'||e.date.slice(0,7)===selectedMonth;
    return matchesMonth&&text.includes(query);
  });
}
function renderHistory(){
  const list=historyFilteredExpenses().slice(0,250);
  $('historyList').innerHTML=list.length?list.map(e=>{
    const project=projectById(e.projectId);
    return `<div class="item">
      <div><strong>${escapeHtml(e.category)}</strong><small>${escapeHtml(e.date)} · ${escapeHtml(e.detail||'Sin detalle')} · ${escapeHtml(project?.name||'Gastos generales')}</small></div>
      <div class="amount-block"><strong>${money(e.amount)}</strong><div class="item-actions"><button class="mini-btn" data-expense-edit="${escapeHtml(e.id)}" type="button">Editar</button><button class="mini-btn delete" data-expense-delete="${escapeHtml(e.id)}" type="button">Borrar</button></div></div>
    </div>`;
  }).join(''):'<p class="pace">No hay gastos para este filtro.</p>';
  $('historyList').querySelectorAll('[data-expense-edit]').forEach(button=>button.addEventListener('click',()=>openExpenseEditor(button.dataset.expenseEdit)));
  $('historyList').querySelectorAll('[data-expense-delete]').forEach(button=>button.addEventListener('click',()=>{
    if(confirm('¿Borrar este gasto?')){
      state.expenses=state.expenses.filter(e=>e.id!==button.dataset.expenseDelete);
      persist();
      showToast('Gasto borrado.');
    }
  }));
}
function openExpenseEditor(id){
  const expense=state.expenses.find(e=>e.id===id);
  if (!expense) return;
  editingExpenseId=id;
  $('editExpenseAmount').value=inputAmount(expense.amount);
  $('editExpenseDetail').value=expense.detail||'';
  setSelectOptions($('editExpenseCategory'),state.categories.map(c=>({value:c,label:c})),expense.category);
  setSelectOptions($('editExpenseProject'),state.projects.map(p=>({value:p.id,label:p.name})),expense.projectId);
  openModal('expenseEditorModal');
}
function renderProjects(){
  $('projectList').innerHTML=state.projects.map(project=>{
    const spent=sum(state.expenses.filter(e=>e.projectId===project.id));
    const budget=Number(project.budget)||0;
    const available=budget-spent;
    const status=budget>0?`Presupuesto ${money(budget)} · Disponible ${money(available)}`:'Sin presupuesto definido';
    const editButton=project.id==='general'?'':`<button class="mini-btn" data-project-edit="${escapeHtml(project.id)}" type="button">Editar</button>`;
    return `<div class="item">
      <div><strong>${escapeHtml(project.name)}</strong><small>${status} · Gastado ${money(spent)}</small></div>
      <div class="project-actions">${editButton}<button class="mini-btn ${project.active?'active-project-button':''}" data-project-use="${escapeHtml(project.id)}" type="button">${project.active?'Activo':'Usar'}</button></div>
    </div>`;
  }).join('');
  $('projectList').querySelectorAll('[data-project-use]').forEach(button=>button.addEventListener('click',()=>activateProject(button.dataset.projectUse)));
  $('projectList').querySelectorAll('[data-project-edit]').forEach(button=>button.addEventListener('click',()=>openProjectEditor(button.dataset.projectEdit)));
}
function activateProject(id){
  const project=state.projects.find(p=>p.id===id);
  if (!project) return;
  state.projects.forEach(p=>{p.active=p.id===id});
  persist();
  showToast(project.id==='general'?'Volviste a gastos generales.':`Proyecto activo: ${project.name}`);
}
function openProjectEditor(id){
  const project=state.projects.find(p=>p.id===id);
  if (!project||project.id==='general') return;
  editingProjectId=id;
  $('editProjectName').value=project.name;
  $('editProjectBudget').value=inputAmount(project.budget);
  openModal('projectEditorModal');
}
function renderCategories(){
  $('categoriesList').innerHTML=state.categories.map((category,index)=>`
    <div class="category-item">
      <span>${escapeHtml(category)}</span>
      <div class="category-actions">
        <button class="mini-btn" data-category-rename="${index}" type="button">Renombrar</button>
        <button class="mini-btn delete" data-category-delete="${index}" type="button">Borrar</button>
      </div>
    </div>`).join('');
  $('categoriesList').querySelectorAll('[data-category-rename]').forEach(button=>button.addEventListener('click',()=>renameCategory(Number(button.dataset.categoryRename))));
  $('categoriesList').querySelectorAll('[data-category-delete]').forEach(button=>button.addEventListener('click',()=>deleteCategory(Number(button.dataset.categoryDelete))));
}
function renameCategory(index){
  const oldName=state.categories[index];
  const newName=(prompt('Nuevo nombre de la categoría:',oldName)||'').trim();
  if (!newName||newName===oldName) return;
  if (state.categories.includes(newName)){showToast('Esa categoría ya existe.');return;}
  state.categories[index]=newName;
  state.expenses.forEach(e=>{if(e.category===oldName)e.category=newName});
  state.favorites.forEach(f=>{if(f.category===oldName)f.category=newName});
  if ($('categoryInput').value===oldName) $('categoryInput').value=newName;
  persist();
  showToast('Categoría actualizada.');
}
function deleteCategory(index){
  const category=state.categories[index];
  const inUse=state.expenses.some(e=>e.category===category)||state.favorites.some(f=>f.category===category);
  if (inUse){showToast('No se puede borrar: la categoría está en uso.');return;}
  if (state.categories.length<=1){showToast('Debe quedar al menos una categoría.');return;}
  if(confirm(`¿Borrar la categoría “${category}”?`)){
    state.categories.splice(index,1);
    persist();
  }
}
function renderCategoryPicker(){
  const selected=$('categoryInput').value;
  $('categoryOptions').innerHTML=state.categories.map(category=>`<button class="category-option ${category===selected?'selected':''}" data-category-option="${escapeHtml(category)}" type="button">${escapeHtml(category)}</button>`).join('');
  $('categoryOptions').querySelectorAll('[data-category-option]').forEach(button=>button.addEventListener('click',()=>{
    $('categoryInput').value=button.dataset.categoryOption;
    $('categoryPickerText').textContent=button.dataset.categoryOption;
    closeModal('categoryPickerModal');
    renderCategoryPicker();
  }));
}
function loadSettingsMonth(){
  const key=$('settingsMonthInput').value||monthKey();
  const config=getMonthSetting(key);
  $('monthlyBudgetInput').value=inputAmount(config.budget);
  $('savingsGoalInput').value=inputAmount(config.savingsGoal);
}
function exportCsv(){
  const selectedMonth=$('historyMonthFilter').value||'all';
  const rows=(selectedMonth==='all'?state.expenses:state.expenses.filter(e=>e.date.slice(0,7)===selectedMonth)).slice().sort((a,b)=>a.createdAt.localeCompare(b.createdAt));
  if (!rows.length){showToast('No hay gastos para exportar.');return;}
  const headers=['Mes','Fecha','Hora','Categoría','Detalle','Monto Bs','Proyecto'];
  const csvRows=[headers,...rows.map(e=>{
    const dateTime=new Date(e.createdAt);
    const time=Number.isNaN(dateTime.getTime())?'':dateTime.toLocaleTimeString('es-BO',{hour:'2-digit',minute:'2-digit'});
    return [e.date.slice(0,7),e.date,time,e.category,e.detail||'',Number(e.amount).toFixed(2).replace('.',','),projectById(e.projectId)?.name||'Gastos generales'];
  })];
  const escapeCell=value=>`"${String(value??'').replace(/"/g,'""')}"`;
  const csv='\uFEFF'+csvRows.map(row=>row.map(escapeCell).join(';')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const anchor=document.createElement('a');
  anchor.href=url;
  anchor.download=`control-presupuesto-${selectedMonth==='all'?'todos':selectedMonth}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  showToast('Archivo creado. Puedes abrirlo con Excel.');
}

$('expenseForm').addEventListener('submit',event=>{
  event.preventDefault();
  const ok=addExpense($('amountInput').value,$('categoryInput').value,$('detailInput').value,$('projectInput').value);
  if (ok){
    $('amountInput').value='';
    $('detailInput').value='';
    $('amountInput').focus();
  }else $('amountInput').focus();
});
$('categoryPickerBtn').addEventListener('click',()=>{renderCategoryPicker();openModal('categoryPickerModal')});
$('periodFilter').addEventListener('change',renderSummary);
$('searchInput').addEventListener('input',renderHistory);
$('historyMonthFilter').addEventListener('change',renderHistory);
$('exportBtn').addEventListener('click',exportCsv);
$('exportSettingsBtn').addEventListener('click',exportCsv);

document.querySelectorAll('.tab').forEach(tab=>tab.addEventListener('click',()=>{
  document.querySelectorAll('.tab').forEach(item=>item.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(content=>content.classList.remove('active'));
  tab.classList.add('active');
  $(`${tab.dataset.tab}Tab`).classList.add('active');
}));

$('settingsBtn').addEventListener('click',()=>{
  $('settingsMonthInput').value=monthKey();
  loadSettingsMonth();
  openModal('settingsModal');
});
$('settingsMonthInput').addEventListener('change',loadSettingsMonth);
$('saveSettingsBtn').addEventListener('click',()=>{
  const key=$('settingsMonthInput').value||monthKey();
  state.monthSettings[key]={budget:parseAmount($('monthlyBudgetInput').value),savingsGoal:parseAmount($('savingsGoalInput').value)};
  persist();
  closeModal('settingsModal');
  showToast(`Presupuesto guardado para ${monthLabel(key)}.`);
});
$('openCategoriesBtn').addEventListener('click',()=>{
  closeModal('settingsModal');
  openModal('categoriesModal');
});
$('addCategoryBtn').addEventListener('click',()=>{
  const category=$('newCategoryInput').value.trim();
  if (!category){$('newCategoryInput').focus();return;}
  if (state.categories.includes(category)){showToast('Esa categoría ya existe.');return;}
  state.categories.push(category);
  $('newCategoryInput').value='';
  persist();
  showToast('Categoría agregada.');
});
$('resetBtn').addEventListener('click',()=>{
  if(confirm('Esto borrará gastos, presupuestos, favoritos y proyectos de este dispositivo. ¿Continuar?')){
    localStorage.removeItem(STORAGE_KEY);
    state=initialState();
    persist();
    closeAllModals();
    showToast('Todos los datos fueron borrados.');
  }
});

$('addFavoriteBtn').addEventListener('click',()=>openFavoriteEditor());
$('confirmFavoriteBtn').addEventListener('click',()=>{
  const favorite=state.favorites.find(f=>f.id===selectedFavoriteId);
  if (!favorite) return;
  const ok=addExpense($('favoriteConfirmAmount').value,favorite.category,favorite.label,$('favoriteConfirmProject').value);
  if(ok){closeModal('favoriteConfirmModal');showToast(`${favorite.label} registrado.`)}
});
$('saveFavoriteBtn').addEventListener('click',()=>{
  const label=$('favoriteLabelInput').value.trim();
  const amount=parseAmount($('favoriteAmountInput').value);
  const category=$('favoriteCategoryInput').value;
  if(!label){showToast('Escribe el nombre del favorito.');$('favoriteLabelInput').focus();return;}
  if(amount<=0){showToast('Ingresa un monto válido.');$('favoriteAmountInput').focus();return;}
  if(editingFavoriteId){
    const favorite=state.favorites.find(f=>f.id===editingFavoriteId);
    if(favorite){favorite.label=label;favorite.amount=amount;favorite.category=category;}
  }else state.favorites.push({id:uid(),label,amount,category});
  persist();
  closeModal('favoriteEditorModal');
  showToast(editingFavoriteId?'Favorito actualizado.':'Favorito creado.');
});
$('deleteFavoriteBtn').addEventListener('click',()=>{
  if(!editingFavoriteId)return;
  const favorite=state.favorites.find(f=>f.id===editingFavoriteId);
  if(favorite&&confirm(`¿Borrar el favorito “${favorite.label}”?`)){
    state.favorites=state.favorites.filter(f=>f.id!==editingFavoriteId);
    persist();
    closeModal('favoriteEditorModal');
    showToast('Favorito borrado.');
  }
});

$('saveExpenseEditBtn').addEventListener('click',()=>{
  const expense=state.expenses.find(e=>e.id===editingExpenseId);
  const amount=parseAmount($('editExpenseAmount').value);
  if(!expense||amount<=0){showToast('Ingresa un monto válido.');return;}
  expense.amount=amount;
  expense.category=$('editExpenseCategory').value;
  expense.detail=$('editExpenseDetail').value.trim();
  expense.projectId=$('editExpenseProject').value;
  persist();
  closeModal('expenseEditorModal');
  showToast('Gasto actualizado.');
});

$('projectForm').addEventListener('submit',event=>{
  event.preventDefault();
  const name=$('projectNameInput').value.trim();
  if(!name)return;
  state.projects.forEach(p=>{p.active=false});
  state.projects.push({id:uid(),name,budget:parseAmount($('projectBudgetInput').value),active:true});
  $('projectNameInput').value='';
  $('projectBudgetInput').value='';
  persist();
  showToast(`Proyecto activo: ${name}`);
  window.scrollTo({top:0,behavior:'smooth'});
});
$('finishProjectBtn').addEventListener('click',()=>activateProject('general'));
$('saveProjectEditBtn').addEventListener('click',()=>{
  const project=state.projects.find(p=>p.id===editingProjectId);
  const name=$('editProjectName').value.trim();
  if(!project||!name){showToast('Escribe un nombre para el proyecto.');return;}
  project.name=name;
  project.budget=parseAmount($('editProjectBudget').value);
  persist();
  closeModal('projectEditorModal');
  showToast('Proyecto actualizado.');
});

document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeModal(button.dataset.close)));
modalIds.forEach(id=>$(id).addEventListener('click',event=>{if(event.target===$(id))closeModal(id)}));
document.addEventListener('keydown',event=>{
  if(event.key==='Escape'){
    const open=[...modalIds].reverse().find(id=>!$(id).hidden);
    if(open)closeModal(open);
  }
});

function registerServiceWorker(){
  if(!navigator.serviceWorker || typeof navigator.serviceWorker.register!=='function')return;
  let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{
    if(reloading)return;
    reloading=true;
    window.location.reload();
  });
  navigator.serviceWorker.register('./sw.js?v=3').then(registration=>{
    registration.update();
    if(registration.waiting)registration.waiting.postMessage({type:'SKIP_WAITING'});
    registration.addEventListener('updatefound',()=>{
      const worker=registration.installing;
      worker?.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller)worker.postMessage({type:'SKIP_WAITING'});
      });
    });
  }).catch(error=>console.warn('Service worker no disponible:',error));
}

renderAll();
registerServiceWorker();
