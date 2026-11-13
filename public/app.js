const API = ""; // Фронтенд раздаётся тем же Express-сервером, поэтому используем относительные URL.
const state = { patients: [], doctors: [], services: [], assignments: [], currentDoctorId: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

async function api(path, options = {}) {
  const config = { ...options, headers: { ...(options.headers || {}) } };
  if (config.body && typeof config.body !== "string") {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }
  const response = await fetch(`${API}${path}`, config);
  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json") ? await response.json() : await response.text();
  if (!response.ok) {
    const message = data?.error || data?.message || `Ошибка HTTP ${response.status}`;
    throw new Error(message);
  }
  return data;
}

function toast(message, isError = false) {
  const node = document.createElement("div");
  node.className = `toast${isError ? " error" : ""}`;
  node.textContent = message;
  $("#toast-region").append(node);
  setTimeout(() => node.remove(), 4200);
}
function esc(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[ch]));
}
function initials(first = "", last = "") { return `${first.trim()[0] || ""}${last.trim()[0] || ""}`.toUpperCase() || "—"; }
function fullName(item) { return `${item.first_name || ""} ${item.last_name || ""}`.trim() || "Без имени"; }
function money(value) {
  const n = Number(value);
  return Number.isFinite(n) ? `${new Intl.NumberFormat("ru-RU").format(n)} ₽` : "—";
}
function statusPill(active) { return `<span class="status ${active ? "active" : "inactive"}">${active ? "Активен" : "Неактивен"}</span>`; }
function setConnection(online, label) {
  $(".connection-dot").classList.toggle("online", online);
  $("#connection-label").textContent = label;
}
function setPage(page) {
  $$(".page").forEach(el => el.classList.toggle("active", el.id === `${page}-page`));
  $$(".nav-link").forEach(el => el.classList.toggle("active", el.dataset.page === page));
  const titles = { dashboard:"Обзор", patients:"Пациенты", doctors:"Врачи", services:"Услуги", assignments:"Услуги врачей" };
  $("#page-title").textContent = titles[page] || "Обзор";
  if (page === "patients") loadPatients();
  if (page === "doctors") loadDoctors();
  if (page === "services") loadServices();
  if (page === "assignments") loadAssignmentDoctors();
}
function showDialog(title, fields, onSave, eyebrow = "УПРАВЛЕНИЕ ЗАПИСЯМИ") {
  $("#dialog-title").textContent = title;
  $("#dialog-eyebrow").textContent = eyebrow;
  $("#dialog-fields").innerHTML = fields.map(field => {
    const full = field.full || field.type === "textarea" || field.type === "select";
    let control = "";
    if (field.type === "textarea") control = `<textarea id="${field.name}" name="${field.name}" ${field.required ? "required" : ""} placeholder="${esc(field.placeholder || "")}">${esc(field.value ?? "")}</textarea>`;
    else if (field.type === "select") control = `<select id="${field.name}" name="${field.name}" ${field.required ? "required" : ""}>${field.options.map(o => `<option value="${esc(o.value)}" ${String(o.value) === String(field.value) ? "selected" : ""}>${esc(o.label)}</option>`).join("")}</select>`;
    else control = `<input id="${field.name}" name="${field.name}" type="${field.type || "text"}" value="${esc(field.value ?? "")}" ${field.required ? "required" : ""} ${field.min !== undefined ? `min="${field.min}"` : ""} ${field.step ? `step="${field.step}"` : ""} ${field.maxlength ? `maxlength="${field.maxlength}"` : ""} placeholder="${esc(field.placeholder || "")}">`;
    return `<div class="field${full ? " full" : ""}"><label for="${field.name}">${esc(field.label)}${field.required ? " *" : ""}</label>${control}${field.hint ? `<span class="field-hint">${esc(field.hint)}</span>` : ""}</div>`;
  }).join("");
  const dialog = $("#entity-dialog");
  dialog.showModal();
  $("#entity-form").onsubmit = async event => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(formData.entries());
    try {
      $("#dialog-submit").disabled = true;
      await onSave(values);
      dialog.close();
    } catch (error) { toast(error.message, true); }
    finally { $("#dialog-submit").disabled = false; }
  };
}
function closeEntityDialog() { $("#entity-dialog").close(); }
function confirmAction(title, text, action, buttonText = "Подтвердить") {
  $("#confirm-title").textContent = title;
  $("#confirm-text").textContent = text;
  $("#confirm-accept").textContent = buttonText;
  const dialog = $("#confirm-dialog");
  dialog.showModal();
  $("#confirm-accept").onclick = async event => {
    event.preventDefault();
    try { $("#confirm-accept").disabled = true; await action(); dialog.close(); }
    catch (error) { toast(error.message, true); }
    finally { $("#confirm-accept").disabled = false; }
  };
}
function personMarkup(item, kind) {
  const name = fullName(item);
  return `<div class="person-cell"><span class="person-avatar">${esc(initials(item.first_name, item.last_name))}</span><span><span class="person-name">${esc(name)}</span><span class="subtext">ID: ${esc(item.id)}</span></span></div>`;
}

async function loadDashboard() {
  try {
    const [patients, doctors, services] = await Promise.all([
      api("/patients"), api("/doctors"), api("/services")
    ]);
    state.patients = patients; state.doctors = doctors; state.services = services;
    $("#stat-patients").textContent = patients.length;
    $("#stat-doctors").textContent = doctors.length;
    $("#stat-active-doctors").textContent = doctors.filter(d => d.is_active).length;
    $("#stat-services").textContent = services.length;
    setConnection(true, "API подключён");
  } catch (error) {
    setConnection(false, "Нет соединения с API");
    toast(`Не удалось загрузить обзор: ${error.message}`, true);
  }
}

async function loadPatients() {
  try {
    state.patients = await api("/patients");
    renderPatients();
    setConnection(true, "API подключён");
  } catch (error) { toast(`Не удалось загрузить пациентов: ${error.message}`, true); }
}
function renderPatients() {
  const q = ($("#patients-search").value || "").toLowerCase();
  const items = state.patients.filter(p => `${fullName(p)} ${p.phone || ""} ${p.email || ""}`.toLowerCase().includes(q));
  $("#patients-table").innerHTML = items.map(p => `<tr>
    <td>${personMarkup(p, "patient")}</td><td>${esc(p.phone || "—")}</td><td>${esc(p.email || "—")}</td>
    <td><div class="row-actions"><button class="action-btn" data-edit-patient="${p.id}">Изменить</button><button class="action-btn danger" data-delete-patient="${p.id}">Удалить</button></div></td>
  </tr>`).join("") || `<tr><td colspan="4"><div class="empty-state">Пациенты не найдены</div></td></tr>`;
  $("#patients-count").textContent = `Показано: ${items.length} из ${state.patients.length}`;
}
function patientFields(p = {}) {
  return [
    { name:"first_name", label:"Имя", value:p.first_name, required:true, maxlength:100 },
    { name:"last_name", label:"Фамилия", value:p.last_name, required:true, maxlength:100 },
    { name:"phone", label:"Телефон", value:p.phone, required:true, maxlength:20 },
    { name:"email", label:"Email", value:p.email || "", type:"email", placeholder:"name@example.com" }
  ];
}
function openPatientForm(patient) {
  showDialog(patient ? "Редактировать пациента" : "Новый пациент", patientFields(patient), async values => {
    if (!values.email) values.email = null;
    if (patient) await api(`/patients/${patient.id}`, { method:"PATCH", body:values });
    else await api("/patients", { method:"POST", body:values });
    toast(patient ? "Данные пациента обновлены" : "Пациент создан");
    await loadPatients();
  });
}

async function loadDoctors() {
  try {
    const status = $("#doctors-status").value;
    const query = status ? `?is_active=${encodeURIComponent(status)}` : "";
    state.doctors = await api(`/doctors${query}`);
    renderDoctors();
    setConnection(true, "API подключён");
  } catch (error) { toast(`Не удалось загрузить врачей: ${error.message}`, true); }
}
function renderDoctors() {
  const q = ($("#doctors-search").value || "").toLowerCase();
  const items = state.doctors.filter(d => `${fullName(d)} ${d.phone || ""} ${d.email || ""}`.toLowerCase().includes(q));
  $("#doctors-table").innerHTML = items.map(d => `<tr>
    <td>${personMarkup(d, "doctor")}</td><td>${esc(d.phone || "—")}</td><td>${esc(d.email || "—")}</td><td>${statusPill(d.is_active)}</td>
    <td><div class="row-actions">
      <button class="action-btn" data-edit-doctor="${d.id}">Изменить</button>
      ${d.is_active ? `<button class="action-btn danger" data-deactivate-doctor="${d.id}">Деактивировать</button>` : `<button class="action-btn" data-activate-doctor="${d.id}">Активировать</button>`}
    </div></td>
  </tr>`).join("") || `<tr><td colspan="5"><div class="empty-state">Врачи не найдены</div></td></tr>`;
  $("#doctors-count").textContent = `Показано: ${items.length} из ${state.doctors.length}`;
}
function doctorFields(d = {}) {
  return [
    { name:"first_name", label:"Имя", value:d.first_name, required:true, maxlength:100 },
    { name:"last_name", label:"Фамилия", value:d.last_name, required:true, maxlength:100 },
    { name:"phone", label:"Телефон", value:d.phone, required:true, maxlength:20 },
    { name:"email", label:"Email", value:d.email || "", type:"email", placeholder:"name@example.com" }
  ];
}
function openDoctorForm(doctor) {
  showDialog(doctor ? "Редактировать врача" : "Новый врач", doctorFields(doctor), async values => {
    if (!values.email) values.email = null;
    if (doctor) await api(`/doctors/${doctor.id}`, { method:"PATCH", body:values });
    else await api("/doctors", { method:"POST", body:values });
    toast(doctor ? "Данные врача обновлены" : "Врач создан");
    await loadDoctors();
  });
}

async function loadServices() {
  try { state.services = await api("/services"); renderServices(); setConnection(true, "API подключён"); }
  catch (error) { toast(`Не удалось загрузить услуги: ${error.message}`, true); }
}
function renderServices() {
  const q = ($("#services-search").value || "").toLowerCase();
  const items = state.services.filter(s => `${s.name || ""} ${s.description || ""}`.toLowerCase().includes(q));
  $("#services-table").innerHTML = items.map(s => `<tr>
    <td><span class="person-name">${esc(s.name)}</span><span class="subtext">ID: ${esc(s.id)}</span></td>
    <td>${esc(s.description || "—")}</td><td><b>${money(s.price)}</b></td><td>${statusPill(s.is_active)}</td>
    <td><div class="row-actions">${s.is_active ? `<button class="action-btn" data-edit-service="${s.id}">Изменить</button><button class="action-btn danger" data-deactivate-service="${s.id}">Деактивировать</button>` : `<span class="subtext">Недоступна</span>`}</div></td>
  </tr>`).join("") || `<tr><td colspan="5"><div class="empty-state">Услуги не найдены</div></td></tr>`;
  $("#services-count").textContent = `Показано: ${items.length} из ${state.services.length}`;
}
function serviceFields(s = {}) {
  return [
    { name:"name", label:"Название", value:s.name, required:true, maxlength:255, full:true },
    { name:"description", label:"Описание", value:s.description || "", type:"textarea", full:true },
    { name:"price", label:"Стоимость", value:s.price ?? "", type:"number", min:0, step:"0.01", required:true }
  ];
}
function openServiceForm(service) {
  showDialog(service ? "Редактировать услугу" : "Новая услуга", serviceFields(service), async values => {
    values.price = Number(values.price);
    if (!values.description) values.description = null;
    if (service) await api(`/services/${service.id}`, { method:"PATCH", body:values });
    else await api("/services", { method:"POST", body:values });
    toast(service ? "Услуга обновлена" : "Услуга создана");
    await loadServices();
  });
}

async function loadAssignmentDoctors() {
  try {
    // Список врачей загружается без фильтра; в select показываем активных.
    const doctors = await api("/doctors?is_active=true");
    state.doctors = doctors;
    const select = $("#assignment-doctor-filter");
    const selected = state.currentDoctorId || select.value;
    select.innerHTML = `<option value="">Выберите врача для просмотра</option>` + doctors.map(d => `<option value="${esc(d.id)}">${esc(fullName(d))} · ID ${esc(d.id)}</option>`).join("");
    if (selected && doctors.some(d => String(d.id) === String(selected))) select.value = selected;
    if (select.value) { state.currentDoctorId = select.value; await loadAssignments(); }
    else {
      state.currentDoctorId = null;
      $("#assignments-empty").classList.remove("hidden");
      $("#assignments-table-wrap").classList.add("hidden");
    }
    setConnection(true, "API подключён");
  } catch (error) { toast(`Не удалось загрузить список врачей: ${error.message}`, true); }
}
async function loadAssignments() {
  const doctorId = $("#assignment-doctor-filter").value;
  if (!doctorId) return;
  state.currentDoctorId = doctorId;
  try {
    state.assignments = await api(`/doctors/${doctorId}/services`);
    renderAssignments();
  } catch (error) { toast(`Не удалось загрузить услуги врача: ${error.message}`, true); }
}
function renderAssignments() {
  $("#assignments-empty").classList.add("hidden");
  $("#assignments-table-wrap").classList.remove("hidden");
  $("#assignments-table").innerHTML = state.assignments.map(a => `<tr>
    <td><span class="person-name">${esc(a.name || `Услуга #${a.service_id}`)}</span><span class="subtext">ID услуги: ${esc(a.service_id)}</span></td>
    <td>${money(a.price)}</td><td>${esc(a.duration_minutes)} мин.</td>
    <td><div class="row-actions"><button class="action-btn" data-edit-assignment="${a.service_id}">Изменить время</button><button class="action-btn danger" data-remove-assignment="${a.service_id}">Убрать</button></div></td>
  </tr>`).join("") || `<tr><td colspan="4"><div class="empty-state">У этого врача пока нет активных услуг</div></td></tr>`;
}
async function openAssignmentForm(serviceId) {
  const doctorId = $("#assignment-doctor-filter").value;
  if (!doctorId) { toast("Сначала выберите врача", true); return; }
  try {
    if (!state.services.length) state.services = await api("/services");
    const activeServices = state.services.filter(s => s.is_active);
    if (!activeServices.length) { toast("Нет активных услуг для назначения", true); return; }
    const current = serviceId ? state.assignments.find(a => String(a.service_id) === String(serviceId)) : null;
    const fields = [
      { name:"serviceId", label:"Услуга", type:"select", required:true, value:serviceId || "", options:activeServices.map(s => ({ value:s.id, label:`${s.name} — ${money(s.price)}` })), hint:current ? "При редактировании услугу изменить нельзя." : "Выберите услугу из активного каталога." },
      { name:"durationMinutes", label:"Длительность приёма (минуты)", type:"number", min:1, step:1, required:true, value:current?.duration_minutes ?? 30 }
    ];
    if (current) fields[0].options = [{ value:current.service_id, label:current.name || `Услуга #${current.service_id}` }];
    showDialog(current ? "Изменить длительность" : "Назначить услугу врачу", fields, async values => {
      const payload = { durationMinutes:Number(values.durationMinutes) };
      if (current) await api(`/doctors/${doctorId}/services/${current.service_id}`, { method:"PATCH", body:payload });
      else await api(`/doctors/${doctorId}/services`, { method:"POST", body:{ serviceId:Number(values.serviceId), durationMinutes:Number(values.durationMinutes) } });
      toast(current ? "Длительность обновлена" : "Услуга назначена врачу");
      await loadAssignments();
    });
  } catch (error) { toast(error.message, true); }
}

function bindEvents() {
  $$(".nav-link").forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
  $$("[data-go]").forEach(button => button.addEventListener("click", () => setPage(button.dataset.go)));
  $("#add-patient").addEventListener("click", () => openPatientForm());
  $("#add-doctor").addEventListener("click", () => openDoctorForm());
  $("#add-service").addEventListener("click", () => openServiceForm());
  $("#add-assignment").addEventListener("click", () => openAssignmentForm());
  $("#refresh-patients").addEventListener("click", loadPatients);
  $("#refresh-doctors").addEventListener("click", loadDoctors);
  $("#refresh-services").addEventListener("click", loadServices);
  $("#refresh-assignments").addEventListener("click", loadAssignments);
  $("#patients-search").addEventListener("input", renderPatients);
  $("#doctors-search").addEventListener("input", renderDoctors);
  $("#services-search").addEventListener("input", renderServices);
  $("#doctors-status").addEventListener("change", loadDoctors);
  $("#assignment-doctor-filter").addEventListener("change", loadAssignments);
  $("#dialog-close").addEventListener("click", closeEntityDialog);
  $("#dialog-cancel").addEventListener("click", closeEntityDialog);
  $("#confirm-close").addEventListener("click", () => $("#confirm-dialog").close());
  $("#confirm-cancel").addEventListener("click", () => $("#confirm-dialog").close());

  document.addEventListener("click", event => {
    const t = event.target;
    if (t.dataset.editPatient) openPatientForm(state.patients.find(x => String(x.id) === t.dataset.editPatient));
    if (t.dataset.deletePatient) {
      const p = state.patients.find(x => String(x.id) === t.dataset.deletePatient);
      confirmAction("Удалить пациента?", `Пациент «${fullName(p)}» будет удалён. Если к нему привязаны приёмы, база данных может запретить удаление.`, async () => {
        await api(`/patients/${p.id}`, { method:"DELETE" }); toast("Пациент удалён"); await loadPatients();
      }, "Удалить");
    }
    if (t.dataset.editDoctor) openDoctorForm(state.doctors.find(x => String(x.id) === t.dataset.editDoctor));
    if (t.dataset.deactivateDoctor) {
      const d = state.doctors.find(x => String(x.id) === t.dataset.deactivateDoctor);
      confirmAction("Деактивировать врача?", `Врач «${fullName(d)}» станет недоступен для новых назначений.`, async () => {
        await api(`/doctors/${d.id}`, { method:"DELETE" }); toast("Врач деактивирован"); await loadDoctors();
      }, "Деактивировать");
    }
    if (t.dataset.activateDoctor) {
      const d = state.doctors.find(x => String(x.id) === t.dataset.activateDoctor);
      confirmAction("Активировать врача?", `Врач «${fullName(d)}» снова станет активным.`, async () => {
        await api(`/doctors/${d.id}/activate`, { method:"PATCH" }); toast("Врач активирован"); await loadDoctors();
      }, "Активировать");
    }
    if (t.dataset.editService) openServiceForm(state.services.find(x => String(x.id) === t.dataset.editService));
    if (t.dataset.deactivateService) {
      const s = state.services.find(x => String(x.id) === t.dataset.deactivateService);
      confirmAction("Деактивировать услугу?", `Услуга «${s.name}» станет недоступна для новых назначений.`, async () => {
        await api(`/services/${s.id}`, { method:"DELETE" }); toast("Услуга деактивирована"); await loadServices();
      }, "Деактивировать");
    }
    if (t.dataset.editAssignment) openAssignmentForm(t.dataset.editAssignment);
    if (t.dataset.removeAssignment) {
      const doctorId = $("#assignment-doctor-filter").value;
      const serviceId = t.dataset.removeAssignment;
      confirmAction("Убрать услугу у врача?", "Связь будет деактивирована, сама услуга останется в каталоге.", async () => {
        await api(`/doctors/${doctorId}/services/${serviceId}`, { method:"DELETE" }); toast("Услуга убрана у врача"); await loadAssignments();
      }, "Убрать");
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  bindEvents();
  await loadDashboard();
});
