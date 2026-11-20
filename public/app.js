const API = ""; // Фронтенд раздаётся тем же Express-сервером, поэтому используем относительные URL.
const state = { patients: [], doctors: [], services: [], assignments: [], schedules: [], appointments: [], currentDoctorId: null, currentScheduleDoctorId: null, currentAppointmentPatientId: "", appointmentServices: [] };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function getFriendlyErrorMessage(data, status) {
  const serverMessage = typeof data === "string"
    ? data
    : (data?.error || data?.message || "");

  const knownMessages = {
    "Schedule overlaps with an existing interval":
      "Нельзя сохранить интервал: выбранное время пересекается с другим рабочим интервалом этого врача. Измени день или время.",
    "Doctor not found or inactive":
      "Не удалось найти активного врача. Обнови список врачей и выбери другого.",
    "Doctor is inactive":
      "Нельзя выполнить действие: врач неактивен. Сначала активируй врача.",
    "Doctor not found": "Врач не найден. Обнови список и попробуй ещё раз.",
    "Schedule not found": "Рабочий интервал не найден. Возможно, его уже деактивировали.",
    "Patient not found": "Пациент не найден. Обнови список и попробуй ещё раз.",
    "Appointment not found": "Запись не найдена. Возможно, она была удалена или изменена.",
  };

  if (knownMessages[serverMessage]) return knownMessages[serverMessage];
  if (status === 409) return "Действие невозможно из-за конфликта с существующей записью. Проверь данные и попробуй ещё раз.";
  if (status === 404) return "Запрашиваемая запись не найдена. Обнови список и попробуй ещё раз.";
  if (status === 400) return "Проверь введённые данные: возможно, одно из полей заполнено неверно.";
  if (status >= 500) return "На сервере произошла ошибка. Попробуй ещё раз позже.";
  return serverMessage || `Не удалось выполнить действие (ошибка ${status}).`;
}

async function api(path, options = {}) {
  const config = { ...options, headers: { ...(options.headers || {}) } };
  if (config.body && typeof config.body !== "string") {
    config.headers["Content-Type"] = "application/json";
    config.body = JSON.stringify(config.body);
  }

  let response;
  try {
    response = await fetch(`${API}${path}`, config);
  } catch (error) {
    throw new Error("Не удалось связаться с сервером. Проверь, запущен ли сервер, и повтори попытку.");
  }

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(getFriendlyErrorMessage(data, response.status));
  }
  return data;
}

function toast(message, isError = false) {
  const node = document.createElement("div");
  node.className = `toast${isError ? " error" : ""}`;
  node.setAttribute("role", isError ? "alert" : "status");

  if (isError) {
    const title = document.createElement("strong");
    title.className = "toast-title";
    title.textContent = "Не удалось выполнить действие";
    const text = document.createElement("span");
    text.className = "toast-message";
    text.textContent = message;
    node.append(title, text);
  } else {
    node.textContent = message;
  }

  $("#toast-region").append(node);
  setTimeout(() => node.remove(), isError ? 6500 : 4200);
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
  const titles = { dashboard:"Обзор", patients:"Пациенты", doctors:"Врачи", services:"Услуги", assignments:"Услуги врачей", schedules:"Расписание врачей", appointments:"Записи пациентов" };
  $("#page-title").textContent = titles[page] || "Обзор";
  if (page === "patients") loadPatients();
  if (page === "doctors") loadDoctors();
  if (page === "services") loadServices();
  if (page === "assignments") loadAssignmentDoctors();
  if (page === "schedules") loadScheduleDoctors();
  if (page === "appointments") loadAppointmentsPage();
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
    const doctors = await api("/doctors/filter?is_active=true");
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

const WEEK_DAYS = [
  { value: 1, label: "Понедельник" },
  { value: 2, label: "Вторник" },
  { value: 3, label: "Среда" },
  { value: 4, label: "Четверг" },
  { value: 5, label: "Пятница" },
  { value: 6, label: "Суббота" },
  { value: 7, label: "Воскресенье" }
];

async function loadScheduleDoctors() {
  try {
    // Загружаем активных врачей и расписание каждого из них.
    const doctors = await api("/doctors/filter?is_active=true");
    state.doctors = doctors;

    const schedulesByDoctor = await Promise.all(
      doctors.map(async doctor => {
        const schedules = await api(`/doctors/${doctor.id}/schedules`);
        return schedules.map(schedule => ({ ...schedule, doctor_id: doctor.id }));
      })
    );

    state.schedules = schedulesByDoctor.flat();
    renderSchedules();
    setConnection(true, "API подключён");
  } catch (error) {
    toast(`Не удалось загрузить расписание врачей: ${error.message}`, true);
  }
}

function renderSchedules() {
  const container = $("#schedules-list");
  if (!state.doctors.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚕</div><b>Активные врачи не найдены</b><p>Добавьте или активируйте врача, чтобы назначить ему рабочее расписание.</p></div>`;
    $("#schedules-count").textContent = "Врачей: 0 · Интервалов: 0";
    return;
  }

  const dayName = day => WEEK_DAYS.find(item => item.value === Number(day))?.label || `День ${day}`;
  container.innerHTML = state.doctors.map(doctor => {
    const doctorSchedules = state.schedules
      .filter(item => String(item.doctor_id) === String(doctor.id))
      .sort((a, b) => Number(a.day_of_week) - Number(b.day_of_week) || String(a.start_time).localeCompare(String(b.start_time)));

    const rows = doctorSchedules.length
      ? doctorSchedules.map(item => {
          const active = item.is_active !== false;
          return `<div class="schedule-row ${active ? "" : "is-inactive"}">
            <div class="schedule-day">${esc(dayName(item.day_of_week))}</div>
            <div class="schedule-time">${esc(String(item.start_time).slice(0, 5))} <span>—</span> ${esc(String(item.end_time).slice(0, 5))}</div>
            <div class="schedule-status">${statusPill(active)}</div>
            <div class="schedule-actions">
              <button class="action-btn" data-edit-schedule="${esc(item.id)}">Изменить</button>
              ${active ? `<button class="action-btn danger" data-deactivate-schedule="${esc(item.id)}">Деактивировать</button>` : `<span class="subtext">Неактивен</span>`}
            </div>
          </div>`;
        }).join("")
      : `<div class="schedule-no-items">Рабочие интервалы пока не добавлены.</div>`;

    return `<article class="schedule-doctor-card">
      <div class="schedule-doctor-heading">
        <div class="person-cell">
          <span class="person-avatar">${esc(initials(doctor.first_name, doctor.last_name))}</span>
          <span><span class="person-name">${esc(fullName(doctor))}</span><span class="subtext">Врач · ID ${esc(doctor.id)}</span></span>
        </div>
        <span class="schedule-total">Интервалов: ${doctorSchedules.length}</span>
      </div>
      <div class="schedule-rows">${rows}</div>
    </article>`;
  }).join("");

  $("#schedules-count").textContent = `Врачей: ${state.doctors.length} · Интервалов: ${state.schedules.length}`;
}

function scheduleFields(schedule = null) {
  const fields = [];
  if (!schedule) {
    fields.push({
      name: "doctor_id", label: "Врач", type: "select", required: true, full: true,
      value: state.doctors[0]?.id ?? "",
      options: state.doctors.map(doctor => ({ value: doctor.id, label: `${fullName(doctor)} · ID ${doctor.id}` }))
    });
  }
  fields.push(
    { name: "day_of_week", label: "День недели", type: "select", required: true, value: schedule?.day_of_week ?? 1,
      options: WEEK_DAYS.map(day => ({ value: day.value, label: day.label })) },
    { name: "start_time", label: "Начало работы", type: "time", required: true, value: String(schedule?.start_time || "09:00").slice(0, 5) },
    { name: "end_time", label: "Окончание работы", type: "time", required: true, value: String(schedule?.end_time || "18:00").slice(0, 5) }
  );
  return fields;
}

function openScheduleForm(schedule = null) {
  if (!state.doctors.length) {
    toast("Нет активных врачей. Сначала добавьте или активируйте врача.", true);
    return;
  }

  const doctorId = schedule ? schedule.doctor_id : null;
  const doctor = schedule ? state.doctors.find(item => String(item.id) === String(doctorId)) : null;
  const title = schedule
    ? `Изменить интервал · ${doctor ? fullName(doctor) : `Врач №${doctorId}`}`
    : "Добавить рабочий интервал";

  showDialog(title, scheduleFields(schedule), async values => {
    const targetDoctorId = schedule ? doctorId : values.doctor_id;
    const payload = {
      day_of_week: Number(values.day_of_week),
      start_time: values.start_time,
      end_time: values.end_time
    };

    if (schedule) {
      // API принимает поля интервала непосредственно в req.body.
      await api(`/doctors/${targetDoctorId}/schedules/${schedule.id}`, { method: "PATCH", body: payload });
    } else {
      await api(`/doctors/${targetDoctorId}/schedules`, { method: "POST", body: payload });
    }

    toast(schedule ? "Рабочий интервал обновлён" : "Рабочий интервал добавлен");
    await loadScheduleDoctors();
  });
}

function formatAppointmentDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return `${new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", timeZone: "Europe/Moscow"
  }).format(date)} (МСК)`;
}

// datetime-local не содержит часовой пояс. API проекта принимает московское время.
function toMoscowInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Moscow", year: "numeric", month: "2-digit",
    day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const result = Object.fromEntries(parts.filter(p => p.type !== "literal").map(p => [p.type, p.value]));
  return `${result.year}-${result.month}-${result.day}T${result.hour}:${result.minute}`;
}

function toMoscowIso(value) {
  if (!value) throw new Error("Укажи дату и время приёма.");
  // Отправляем явный +03:00, не полагаясь на часовой пояс устройства.
  return `${value}:00+03:00`;
}

async function loadAppointmentServiceOptions() {
  const doctors = await api("/doctors/filter?is_active=true");
  const groups = await Promise.all(doctors.map(async doctor => {
    const services = await api(`/doctors/${encodeURIComponent(doctor.id)}/services`);
    return services.map(service => ({
      value: String(service.id),
      label: `${fullName(doctor)} — ${service.name} · ${service.duration_minutes} мин · ID ${service.id}`
    }));
  }));
  state.appointmentServices = groups.flat();
  return state.appointmentServices;
}

async function openAppointmentForm(appointment = null) {
  try {
    if (!state.patients.length) state.patients = await api("/patients");
    const services = await loadAppointmentServiceOptions();
    if (!state.patients.length) {
      toast("Сначала добавь хотя бы одного пациента.", true);
      return;
    }
    if (!services.length) {
      toast("Нет активных услуг у активных врачей. Сначала назначь врачу услугу.", true);
      return;
    }

    const fields = [
      {
        name: "patient_id", label: "Пациент", type: "select", required: true, full: true,
        value: appointment?.patient_id ?? state.patients[0].id,
        options: state.patients.map(patient => ({ value: patient.id, label: `${fullName(patient)} · ID ${patient.id}` }))
      },
      {
        name: "doctor_service_id", label: "Врач и услуга", type: "select", required: true, full: true,
        value: appointment?.doctor_service_id ?? services[0].value,
        options: services
      },
      {
        name: "starts_at", label: "Дата и время начала (МСК)", type: "datetime-local", required: true, full: true,
        value: appointment ? toMoscowInputValue(appointment.starts_at) : "",
        hint: "Время будет отправлено на сервер с часовым поясом +03:00. Окончание приёма рассчитает сервер."
      }
    ];

    showDialog(appointment ? `Перенести запись № ${appointment.id}` : "Новая запись на приём", fields, async values => {
      const payload = {
        doctor_service_id: String(values.doctor_service_id),
        starts_at: toMoscowIso(values.starts_at)
      };
      if (appointment) {
        await api(`/appointments/${encodeURIComponent(appointment.id)}`, { method: "PATCH", body: payload });
        toast("Запись обновлена");
      } else {
        payload.patient_id = String(values.patient_id);
        await api("/appointments", { method: "POST", body: payload });
        toast("Запись создана");
      }
      await loadAppointmentsPage();
    });
  } catch (error) {
    toast(`Не удалось подготовить форму записи: ${error.message}`, true);
  }
}

function openAppointmentStatusForm(appointment) {
  const statuses = [
    { value: "pending", label: "Ожидает подтверждения" },
    { value: "confirmed", label: "Подтверждена" },
    { value: "cancelled", label: "Отменена" },
    { value: "completed", label: "Завершена" }
  ];
  showDialog(`Статус записи № ${appointment.id}`, [{
    name: "status", label: "Новый статус", type: "select", required: true,
    value: appointment.status, options: statuses
  }], async values => {
    await api(`/appointments/${encodeURIComponent(appointment.id)}/status`, {
      method: "PATCH", body: { status: values.status }
    });
    toast("Статус записи изменён");
    await loadAppointments();
  });
}

function appointmentStatus(status) {
  const labels = {
    pending: "Ожидает подтверждения",
    confirmed: "Подтверждена",
    cancelled: "Отменена",
    completed: "Завершена"
  };
  const classes = {
    pending: "pending", confirmed: "confirmed",
    cancelled: "cancelled", completed: "completed"
  };
  return `<span class="appointment-status ${classes[status] || "unknown"}">${esc(labels[status] || status || "Не указан")}</span>`;
}

async function loadAppointmentsPage() {
  try {
    state.patients = await api("/patients");
    const select = $("#appointments-patient-filter");
    const selected = state.currentAppointmentPatientId || select.value;
    select.innerHTML = `<option value="">Все пациенты</option>` + state.patients
      .map(patient => `<option value="${esc(patient.id)}">${esc(fullName(patient))} · ID ${esc(patient.id)}</option>`)
      .join("");
    if (selected && state.patients.some(patient => String(patient.id) === String(selected))) {
      select.value = selected;
      state.currentAppointmentPatientId = selected;
    } else {
      select.value = "";
      state.currentAppointmentPatientId = "";
    }
    await loadAppointments();
  } catch (error) {
    toast(`Не удалось загрузить список пациентов: ${error.message}`, true);
  }
}

async function loadAppointments() {
  const patientId = $("#appointments-patient-filter").value;
  state.currentAppointmentPatientId = patientId;
  try {
    const path = patientId
      ? `/appointments/patient/${encodeURIComponent(patientId)}`
      : "/appointments";
    state.appointments = await api(path);
    renderAppointments();
    setConnection(true, "API подключён");
  } catch (error) {
    toast(`Не удалось загрузить записи: ${error.message}`, true);
    $("#appointments-table").innerHTML = `<tr><td colspan="7"><div class="empty-state">Не удалось загрузить записи</div></td></tr>`;
    $("#appointments-count").textContent = "";
  }
}

function renderAppointments() {
  const query = ($("#appointments-search").value || "").trim().toLowerCase();
  const patientById = new Map(state.patients.map(patient => [String(patient.id), patient]));
  const items = state.appointments.filter(appointment => {
    const patient = patientById.get(String(appointment.patient_id));
    const patientName = patient ? fullName(patient) : "";
    const haystack = [
      appointment.id, appointment.patient_id, patientName,
      appointment.doctor_service_id, appointment.status,
      appointment.starts_at, appointment.ends_at
    ].join(" ").toLowerCase();
    return haystack.includes(query);
  });

  $("#appointments-table").innerHTML = items.map(appointment => {
    const patient = patientById.get(String(appointment.patient_id));
    const patientLabel = patient ? fullName(patient) : `Пациент #${appointment.patient_id}`;
    return `<tr>
      <td><span class="person-name">№ ${esc(appointment.id)}</span></td>
      <td><span class="person-name">${esc(patientLabel)}</span><span class="subtext">ID: ${esc(appointment.patient_id)}</span></td>
      <td><span class="person-name">№ ${esc(appointment.doctor_service_id)}</span><span class="subtext">ID связи врача и услуги</span></td>
      <td class="date-cell">${esc(formatAppointmentDateTime(appointment.starts_at))}</td>
      <td class="date-cell">${esc(formatAppointmentDateTime(appointment.ends_at))}</td>
      <td>${appointmentStatus(appointment.status)}</td>
      <td><div class="row-actions">
        <button class="action-btn" data-view-appointment="${esc(appointment.id)}" data-patient-id="${esc(appointment.patient_id)}">Подробнее</button>
        ${appointment.status !== "cancelled" && appointment.status !== "completed" ? `<button class="action-btn" data-edit-appointment="${esc(appointment.id)}">Перенести</button>` : ""}
        ${appointment.status !== "cancelled" ? `<button class="action-btn" data-status-appointment="${esc(appointment.id)}">Статус</button>` : ""}
        ${appointment.status !== "cancelled" && appointment.status !== "completed" ? `<button class="action-btn danger" data-cancel-appointment="${esc(appointment.id)}">Отменить</button>` : ""}
      </div></td>
    </tr>`;
  }).join("") || `<tr><td colspan="7"><div class="empty-state">${query ? "По заданным условиям записи не найдены" : "Записей пока нет"}</div></td></tr>`;

  $("#appointments-count").textContent = `Показано: ${items.length} из ${state.appointments.length}`;
}

async function viewAppointment(patientId, appointmentId) {
  try {
    const appointment = await api(`/appointments/patient/${encodeURIComponent(patientId)}/${encodeURIComponent(appointmentId)}`);
    const patient = state.patients.find(item => String(item.id) === String(appointment.patient_id));
    $("#appointment-detail-title").textContent = `Запись № ${appointment.id}`;
    const details = [
      ["Пациент", patient ? `${fullName(patient)} · ID ${patient.id}` : `ID ${appointment.patient_id}`],
      ["Связь врача и услуги", appointment.doctor_service_id],
      ["Начало приёма", formatAppointmentDateTime(appointment.starts_at)],
      ["Окончание приёма", formatAppointmentDateTime(appointment.ends_at)],
      ["Статус", appointment.status]
    ];
    $("#appointment-detail-content").innerHTML = details.map(([label, value]) =>
      `<div class="appointment-detail-row"><span>${esc(label)}</span><b>${esc(value ?? "—")}</b></div>`
    ).join("");
    $("#appointment-detail-dialog").showModal();
  } catch (error) {
    toast(`Не удалось получить запись: ${error.message}`, true);
  }
}

function bindEvents() {
  $$(".nav-link").forEach(button => button.addEventListener("click", () => setPage(button.dataset.page)));
  $$("[data-go]").forEach(button => button.addEventListener("click", () => setPage(button.dataset.go)));
  $("#add-patient").addEventListener("click", () => openPatientForm());
  $("#add-doctor").addEventListener("click", () => openDoctorForm());
  $("#add-service").addEventListener("click", () => openServiceForm());
  $("#add-assignment").addEventListener("click", () => openAssignmentForm());
  $("#add-schedule").addEventListener("click", () => openScheduleForm());
  $("#refresh-patients").addEventListener("click", loadPatients);
  $("#refresh-doctors").addEventListener("click", loadDoctors);
  $("#refresh-services").addEventListener("click", loadServices);
  $("#refresh-assignments").addEventListener("click", loadAssignments);
  $("#refresh-schedules").addEventListener("click", loadScheduleDoctors);
  $("#refresh-appointments").addEventListener("click", loadAppointments);
  $("#add-appointment").addEventListener("click", () => openAppointmentForm());
  $("#appointments-patient-filter").addEventListener("change", loadAppointments);
  $("#appointments-search").addEventListener("input", renderAppointments);
  $("#appointment-detail-close").addEventListener("click", () => $("#appointment-detail-dialog").close());
  $("#appointment-detail-dismiss").addEventListener("click", () => $("#appointment-detail-dialog").close());
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
    if (t.dataset.viewAppointment) {
      viewAppointment(t.dataset.patientId, t.dataset.viewAppointment);
    }
    if (t.dataset.editAppointment) {
      const appointment = state.appointments.find(x => String(x.id) === t.dataset.editAppointment);
      if (appointment) openAppointmentForm(appointment);
    }
    if (t.dataset.statusAppointment) {
      const appointment = state.appointments.find(x => String(x.id) === t.dataset.statusAppointment);
      if (appointment) openAppointmentStatusForm(appointment);
    }
    if (t.dataset.cancelAppointment) {
      const appointment = state.appointments.find(x => String(x.id) === t.dataset.cancelAppointment);
      if (appointment) confirmAction(
        "Отменить запись?",
        `Запись № ${appointment.id} будет сохранена в базе, но получит статус «Отменена».`,
        async () => {
          await api(`/appointments/${encodeURIComponent(appointment.id)}`, { method: "DELETE" });
          toast("Запись отменена");
          await loadAppointments();
        },
        "Отменить запись"
      );
    }
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
    if (t.dataset.editSchedule) {
      const schedule = state.schedules.find(x => String(x.id) === t.dataset.editSchedule);
      if (schedule) openScheduleForm(schedule);
    }
    if (t.dataset.deactivateSchedule) {
      const schedule = state.schedules.find(x => String(x.id) === t.dataset.deactivateSchedule);
      confirmAction("Деактивировать интервал?", "Этот рабочий интервал будет помечен как неактивный.", async () => {
        await api(`/doctors/${schedule.doctor_id}/schedules/${schedule.id}`, { method: "DELETE" });
        toast("Рабочий интервал деактивирован");
        await loadScheduleDoctors();
      }, "Деактивировать");
    }
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
