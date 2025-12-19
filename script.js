// --------- ESTRUTURA DE DADOS E ESTADO ---------
const STORAGE_KEY = "organizador_faculdade_v2";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Estado inicial com alguns exemplos. Você pode editar depois direto no site.
const defaultState = {
  theme: "dark",
  subjects: [
    {
      id: "animacao3d",
      name: "Animação 3D",
      semester: 5,
      grades: { t1: null, p1: null, t2: null, p2: null },
      works: [
        { id: "animacao3d_w1", description: "", done: false, dueDate: null },
        { id: "animacao3d_w2", description: "", done: false, dueDate: null }
      ],
      exams: [
        { id: "animacao3d_e1", description: "", done: false, date: null },
        { id: "animacao3d_e2", description: "", done: false, date: null }
      ],
      lessons: [
        { id: "animacao3d_l1", title: "Princípios de animação", done: false },
        { id: "animacao3d_l2", title: "Ciclo de caminhada", done: false }
      ]
    },
    {
      id: "leveldesign",
      name: "Level Design",
      semester: 5,
      grades: { t1: null, p1: null, t2: null, p2: null },
      works: [
        { id: "leveldesign_w1", description: "", done: false, dueDate: null },
        { id: "leveldesign_w2", description: "", done: false, dueDate: null }
      ],
      exams: [
        { id: "leveldesign_e1", description: "", done: false, date: null },
        { id: "leveldesign_e2", description: "", done: false, date: null }
      ],
      lessons: [
        { id: "leveldesign_l1", title: "Kishotenketsu", done: false }
      ]
    }
  ],
  holidays: [
    { date: "2025-01-01", label: "Ano Novo" },
    { date: "2025-04-18", label: "Sexta-feira Santa" },
    { date: "2025-04-21", label: "Tiradentes" },
    { date: "2025-05-01", label: "Dia do Trabalhador" },
    { date: "2025-09-07", label: "Independência do Brasil" },
    { date: "2025-10-12", label: "Nossa Senhora Aparecida" },
    { date: "2025-11-02", label: "Finados" },
    { date: "2025-11-15", label: "Proclamação da República" },
    { date: "2025-12-25", label: "Natal" }
  ],
  importantDates: [
    { date: "2025-03-10", label: "Entrega de documentos" },
    { date: "2025-08-01", label: "Início do semestre" }
  ],
  timetable: {
    monday: [
      { time: "19:30 - 21:00", subject: "Programação para Jogos" },
      { time: "21:10 - 22:40", subject: "Animação 3D" }
    ],
    tuesday: [
      { time: "19:30 - 21:00", subject: "Level Design" }
    ],
    wednesday: [],
    thursday: [],
    friday: []
  }
};

let state = loadState();
let currentSemester = 5;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return clone(defaultState);
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error("Erro ao carregar estado:", e);
    return clone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// --------- ELEMENTOS GERAIS ---------
const globalSemesterSelect = document.getElementById("globalSemesterSelect");
const navButtons = document.querySelectorAll(".nav-btn");
const views = {
  capa: document.getElementById("view-capa"),
  notas: document.getElementById("view-notas"),
  trabalhos: document.getElementById("view-trabalhos"),
  provas: document.getElementById("view-provas"),
  materias: document.getElementById("view-materias"),
  backup: document.getElementById("view-backup")
};

const themeToggleBtn = document.getElementById("themeToggleBtn");

// --------- TEMA (CLARO / ESCURO) ---------
function applyTheme() {
  const theme = state.theme || "dark";
  if (theme === "light") {
    document.body.classList.add("light");
    themeToggleBtn.textContent = "Modo claro";
  } else {
    document.body.classList.remove("light");
    themeToggleBtn.textContent = "Modo escuro";
  }
}

themeToggleBtn.addEventListener("click", () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  saveState();
  applyTheme();
});

// --------- RESUMO (CAPA) ---------
const summarySubjectsEl = document.getElementById("summarySubjects");
const summaryWorksEl = document.getElementById("summaryWorks");
const summaryExamsEl = document.getElementById("summaryExams");
const summaryLessonsEl = document.getElementById("summaryLessons");
const semesterStatusContainer = document.getElementById("semesterStatusContainer");

function getSubjectsForCurrentSemester() {
  return state.subjects.filter(s => s.semester === currentSemester);
}

function computeSemesterStats() {
  const subjects = getSubjectsForCurrentSemester();
  let totalWorks = 0;
  let doneWorks = 0;
  let totalExams = 0;
  let doneExams = 0;
  let totalLessons = 0;
  let doneLessons = 0;

  subjects.forEach(s => {
    totalWorks += s.works.length;
    doneWorks += s.works.filter(w => w.done).length;

    totalExams += s.exams.length;
    doneExams += s.exams.filter(e => e.done).length;

    totalLessons += s.lessons.length;
    doneLessons += s.lessons.filter(l => l.done).length;
  });

  return {
    subjectsCount: subjects.length,
    totalWorks,
    doneWorks,
    totalExams,
    doneExams,
    totalLessons,
    doneLessons
  };
}

function updateSummary() {
  const stats = computeSemesterStats();
  summarySubjectsEl.textContent = stats.subjectsCount || "0";
  summaryWorksEl.textContent = `${stats.doneWorks}/${stats.totalWorks}`;
  summaryExamsEl.textContent = `${stats.doneExams}/${stats.totalExams}`;
  const progress = stats.totalLessons ? Math.round((stats.doneLessons / stats.totalLessons) * 100) : 0;
  summaryLessonsEl.textContent = `${progress}%`;
}

function renderSemesterStatus() {
  const stats = computeSemesterStats();
  const progressLessons = stats.totalLessons ? Math.round((stats.doneLessons / stats.totalLessons) * 100) : 0;
  const progressWorks = stats.totalWorks ? Math.round((stats.doneWorks / stats.totalWorks) * 100) : 0;
  const progressExams = stats.totalExams ? Math.round((stats.doneExams / stats.totalExams) * 100) : 0;

  semesterStatusContainer.innerHTML = `
    <div class="semester-status-row">
      <strong>Aulas estudadas:</strong> ${stats.doneLessons}/${stats.totalLessons} (${progressLessons}%)
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${progressLessons}%;"></div>
      </div>
    </div>
    <div class="semester-status-row">
      <strong>Trabalhos concluídos:</strong> ${stats.doneWorks}/${stats.totalWorks} (${progressWorks}%)
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${progressWorks}%;"></div>
      </div>
    </div>
    <div class="semester-status-row">
      <strong>Provas realizadas:</strong> ${stats.doneExams}/${stats.totalExams} (${progressExams}%)
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${progressExams}%;"></div>
      </div>
    </div>
  `;
}

// --------- CALENDÁRIO / CAPA ---------
const calendarBody = document.getElementById("calendarBody");
const calendarMonthLabel = document.getElementById("calendarMonthLabel");
const calendarSelectedInfo = document.getElementById("calendarSelectedInfo");
const prevMonthBtn = document.getElementById("prevMonthBtn");
const nextMonthBtn = document.getElementById("nextMonthBtn");
const holidayList = document.getElementById("holidayList");
const importantDatesList = document.getElementById("importantDatesList");
const timetableBody = document.getElementById("timetableBody");
const addImportantDateForm = document.getElementById("addImportantDateForm");
const importantDateInput = document.getElementById("importantDateInput");
const importantLabelInput = document.getElementById("importantLabelInput");
const addTimetableForm = document.getElementById("addTimetableForm");
const timetableDayInput = document.getElementById("timetableDayInput");
const timetableTimeInput = document.getElementById("timetableTimeInput");
const timetableSubjectInput = document.getElementById("timetableSubjectInput");
const upcomingList = document.getElementById("upcomingList");

let calendarYear;
let calendarMonth; // 0-11
let selectedDate = null;

function initCalendar() {
  const today = new Date();
  calendarYear = today.getFullYear();
  calendarMonth = today.getMonth();
  renderCalendar();
}

function renderCalendar() {
  const firstDay = new Date(calendarYear, calendarMonth, 1);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const prevMonthDays = new Date(calendarYear, calendarMonth, 0).getDate();

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  calendarMonthLabel.textContent = `${monthNames[calendarMonth]} de ${calendarYear}`;

  calendarBody.innerHTML = "";

  let day = 1;
  let nextMonthDay = 1;

  for (let week = 0; week < 6; week++) {
    const tr = document.createElement("tr");

    for (let dow = 0; dow < 7; dow++) {
      const td = document.createElement("td");
      const div = document.createElement("div");
      div.className = "calendar-day";

      let displayDay;
      let dateObj;
      let inCurrentMonth = true;

      if (week === 0 && dow < startDayOfWeek) {
        displayDay = prevMonthDays - (startDayOfWeek - dow - 1);
        inCurrentMonth = false;
        dateObj = new Date(calendarYear, calendarMonth - 1, displayDay);
        div.classList.add("other-month");
      } else if (day > daysInMonth) {
        displayDay = nextMonthDay++;
        inCurrentMonth = false;
        dateObj = new Date(calendarYear, calendarMonth + 1, displayDay);
        div.classList.add("other-month");
      } else {
        displayDay = day++;
        dateObj = new Date(calendarYear, calendarMonth, displayDay);
      }

      div.textContent = displayDay;

      const iso = dateToIso(dateObj);
      div.dataset.date = iso;

      const todayIso = dateToIso(new Date());
      if (iso === todayIso) {
        div.classList.add("today");
      }

      if (hasEventsOnDate(iso)) {
        div.classList.add("has-event");
      }

      div.addEventListener("click", () => {
        selectedDate = iso;
        renderSelectedDateInfo();
      });

      td.appendChild(div);
      tr.appendChild(td);
    }

    calendarBody.appendChild(tr);
  }

  renderSelectedDateInfo();
}

function dateToIso(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function hasEventsOnDate(iso) {
  const hasHoliday = state.holidays.some(h => h.date === iso);
  const hasImportant = state.importantDates.some(d => d.date === iso);
  const works = state.subjects.flatMap(s => s.works);
  const exams = state.subjects.flatMap(s => s.exams);
  const hasWork = works.some(w => w.dueDate === iso);
  const hasExam = exams.some(e => e.date === iso);
  return hasHoliday || hasImportant || hasWork || hasExam;
}

function renderSelectedDateInfo() {
  if (!selectedDate) {
    calendarSelectedInfo.innerHTML = "<strong>Selecione um dia para ver detalhes.</strong>";
    return;
  }

  const parts = selectedDate.split("-");
  const formatted = `${parts[2]}/${parts[1]}/${parts[0]}`;

  const events = [];

  state.holidays.forEach(h => {
    if (h.date === selectedDate) events.push({ type: "Feriado", label: h.label });
  });

  state.importantDates.forEach(d => {
    if (d.date === selectedDate) events.push({ type: "Importante", label: d.label });
  });

  state.subjects.forEach(s => {
    s.works.forEach(w => {
      if (w.dueDate === selectedDate) {
        events.push({ type: "Trabalho", label: `${s.name} - Trabalho` });
      }
    });
    s.exams.forEach(e => {
      if (e.date === selectedDate) {
        events.push({ type: "Prova", label: `${s.name} - Prova` });
      }
    });
  });

  if (events.length === 0) {
    calendarSelectedInfo.innerHTML = `<strong>${formatted}</strong><br>Nenhum evento cadastrado.`;
    return;
  }

  const listItems = events
    .map(ev => `<li><strong>${ev.type}:</strong> ${ev.label}</li>`)
    .join("");
  calendarSelectedInfo.innerHTML = `<strong>${formatted}</strong><ul>${listItems}</ul>`;
}

prevMonthBtn.addEventListener("click", () => {
  if (calendarMonth === 0) {
    calendarMonth = 11;
    calendarYear--;
  } else {
    calendarMonth--;
  }
  renderCalendar();
});

nextMonthBtn.addEventListener("click", () => {
  if (calendarMonth === 11) {
    calendarMonth = 0;
    calendarYear++;
  } else {
    calendarMonth++;
  }
  renderCalendar();
});

function renderHolidayList() {
  holidayList.innerHTML = "";
  const sorted = [...state.holidays].sort((a, b) => a.date.localeCompare(b.date));
  sorted.forEach(h => {
    const li = document.createElement("li");
    const [y, m, d] = h.date.split("-");
    li.innerHTML = `<span class="date">${d}/${m}</span>${h.label}`;
    holidayList.appendChild(li);
  });
}

function renderImportantDatesList() {
  importantDatesList.innerHTML = "";
  const sorted = [...state.importantDates].sort((a, b) => a.date.localeCompare(b.date));

  sorted.forEach(d => {
    const li = document.createElement("li");

    const [y, m, day] = d.date.split("-");
    const dateSpan = document.createElement("span");
    dateSpan.className = "date";
    dateSpan.textContent = `${day}/${m}`;

    const labelSpan = document.createElement("span");
    labelSpan.textContent = d.label;

    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "inline-delete-btn";
    delBtn.textContent = "Excluir";

    delBtn.addEventListener("click", () => {
      // remove essa data importante do estado
      state.importantDates = state.importantDates.filter(
        item => !(item.date === d.date && item.label === d.label)
      );
      saveState();
      renderImportantDatesList();
      renderUpcomingDeadlines();
      renderCalendar();
    });

    li.appendChild(dateSpan);
    li.appendChild(labelSpan);
    li.appendChild(delBtn);
    importantDatesList.appendChild(li);
  });
}

// adicionar nova data importante via formulário
addImportantDateForm.addEventListener("submit", evt => {
  evt.preventDefault();
  const date = importantDateInput.value;
  const label = importantLabelInput.value.trim();
  if (!date || !label) return;
  state.importantDates.push({ date, label });
  saveState();
  importantDateInput.value = "";
  importantLabelInput.value = "";
  renderImportantDatesList();
  renderCalendar();
  renderUpcomingDeadlines();
});

function renderTimetable() {
  timetableBody.innerHTML = "";
  const mapping = {
    monday: "Segunda",
    tuesday: "Terça",
    wednesday: "Quarta",
    thursday: "Quinta",
    friday: "Sexta"
  };

  Object.keys(mapping).forEach(key => {
    const dayName = mapping[key];
    const slots = state.timetable[key] || [];
    if (!slots.length) return;

    slots.forEach((slot, index) => {
      const tr = document.createElement("tr");

      const dayTd = document.createElement("td");
      dayTd.textContent = index === 0 ? dayName : "";

      const timeTd = document.createElement("td");
      timeTd.textContent = slot.time;

      const subjTd = document.createElement("td");
      const subjSpan = document.createElement("span");
      subjSpan.textContent = slot.subject;

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "inline-delete-btn";
      delBtn.textContent = "Excluir";

      delBtn.addEventListener("click", () => {
        // remove esse slot desse dia
        state.timetable[key].splice(index, 1);
        saveState();
        renderTimetable();
      });

      subjTd.appendChild(subjSpan);
      subjTd.appendChild(delBtn);

      tr.appendChild(dayTd);
      tr.appendChild(timeTd);
      tr.appendChild(subjTd);
      timetableBody.appendChild(tr);
    });
  });

  if (!timetableBody.hasChildNodes()) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "Nenhum horário cadastrado.";
    tr.appendChild(td);
    timetableBody.appendChild(tr);
  }
}

// adicionar novo horário via formulário
addTimetableForm.addEventListener("submit", evt => {
  evt.preventDefault();
  const dayKey = timetableDayInput.value;
  const time = timetableTimeInput.value.trim();
  const subj = timetableSubjectInput.value.trim();
  if (!dayKey || !time || !subj) return;
  if (!state.timetable[dayKey]) state.timetable[dayKey] = [];
  state.timetable[dayKey].push({ time, subject: subj });
  saveState();
  timetableDayInput.value = "";
  timetableTimeInput.value = "";
  timetableSubjectInput.value = "";
  renderTimetable();
});

// --------- PRÓXIMOS PRAZOS ---------
function renderUpcomingDeadlines() {
  upcomingList.innerHTML = "";
  const items = [];

  const todayIso = dateToIso(new Date());

  // Datas importantes
  state.importantDates.forEach(d => {
    if (d.date >= todayIso) {
      items.push({
        date: d.date,
        label: d.label,
        type: "Importante"
      });
    }
  });

  // Trabalhos
  state.subjects.forEach(s => {
    s.works.forEach(w => {
      if (w.dueDate && w.dueDate >= todayIso) {
        items.push({
          date: w.dueDate,
          label: `${s.name} - Trabalho`,
          type: "Trabalho"
        });
      }
    });
  });

  // Provas
  state.subjects.forEach(s => {
    s.exams.forEach(e => {
      if (e.date && e.date >= todayIso) {
        items.push({
          date: e.date,
          label: `${s.name} - Prova`,
          type: "Prova"
        });
      }
    });
  });

  items.sort((a, b) => a.date.localeCompare(b.date));

  const limited = items.slice(0, 8);

  if (!limited.length) {
    upcomingList.innerHTML = "<li>Nenhum prazo cadastrado a partir de hoje.</li>";
    return;
  }

  limited.forEach(it => {
    const li = document.createElement("li");
    const [y, m, d] = it.date.split("-");
    li.innerHTML = `<span class="date">${d}/${m}</span><strong>${it.type}:</strong> ${it.label}`;
    upcomingList.appendChild(li);
  });
}

// --------- NOTAS ---------
const gradesContainer = document.getElementById("gradesContainer");

function toNumber(val) {
  if (val === null || val === undefined || val === "") return 0;
  const num = Number(String(val).replace(",", "."));
  return isNaN(num) ? 0 : num;
}

function computeFinalGrade(grades) {
  const t1 = toNumber(grades.t1);
  const p1 = toNumber(grades.p1);
  const t2 = toNumber(grades.t2);
  const p2 = toNumber(grades.p2);
  const result = ((t1 + p1) * 2 + (t2 + p2) * 3) / 5;
  if (isNaN(result)) return null;
  return result;
}

function renderGrades() {
  gradesContainer.innerHTML = "";
  const subjects = getSubjectsForCurrentSemester();

  if (!subjects.length) {
    gradesContainer.innerHTML = "<p>Nenhuma matéria cadastrada para este semestre.</p>";
    return;
  }

  subjects.forEach(subject => {
    const card = document.createElement("div");
    card.className = "subject-card";

    const header = document.createElement("div");
    header.className = "subject-card-header";

    const nameSpan = document.createElement("div");
    nameSpan.className = "subject-name";
    nameSpan.textContent = subject.name;

    const badge = document.createElement("span");
    badge.className = "badge badge-semester";
    badge.textContent = `${subject.semester}º sem.`;

    header.appendChild(nameSpan);
    header.appendChild(badge);

    const gradesGrid = document.createElement("div");
    gradesGrid.className = "grades-grid";

    const fields = [
      { key: "t1", label: "Trabalho 1" },
      { key: "p1", label: "Prova 1" },
      { key: "t2", label: "Trabalho 2" },
      { key: "p2", label: "Prova 2" }
    ];

    fields.forEach(f => {
      const fieldDiv = document.createElement("div");
      fieldDiv.className = "grade-field";

      const label = document.createElement("label");
      label.textContent = f.label;

      const input = document.createElement("input");
      input.type = "number";
      input.step = "0.1";
      input.min = "0";
      input.max = "10";
      input.value = subject.grades[f.key] ?? "";
      input.addEventListener("input", () => {
        subject.grades[f.key] = input.value;
        saveState();
        renderGrades();
        updateSummary();
        renderSemesterStatus();
      });

      fieldDiv.appendChild(label);
      fieldDiv.appendChild(input);
      gradesGrid.appendChild(fieldDiv);
    });

    const finalGrade = computeFinalGrade(subject.grades);
    const finalDiv = document.createElement("div");
    finalDiv.className = "final-grade";

    if (finalGrade === null || isNaN(finalGrade)) {
      finalDiv.textContent = "Média final: -";
    } else {
      const rounded = finalGrade.toFixed(2);
      finalDiv.textContent = `Média final: ${rounded}`;
      const statusBadge = document.createElement("span");
      statusBadge.className =
        "badge " + (finalGrade >= 6 ? "badge-status-ok" : "badge-status-bad");
      statusBadge.textContent = finalGrade >= 6 ? "Aprovado (parcial)" : "Atenção";
      finalDiv.appendChild(statusBadge);
    }

    card.appendChild(header);
    card.appendChild(gradesGrid);
    card.appendChild(finalDiv);
    gradesContainer.appendChild(card);
  });
}

// controla as cores do seletor de dificuldade
function applyDifficultyClass(selectEl, difficulty) {
  selectEl.classList.remove("difficulty-facil", "difficulty-medio", "difficulty-dificil");

  if (difficulty === "facil") {
    selectEl.classList.add("difficulty-facil");
  } else if (difficulty === "medio") {
    selectEl.classList.add("difficulty-medio");
  } else if (difficulty === "dificil") {
    selectEl.classList.add("difficulty-dificil");
  }
}

// --------- TRABALHOS ---------
const worksPageContainer = document.getElementById("worksPageContainer");

// filtros da aba de trabalhos (os selects do HTML)
const workFilterIndex = document.getElementById("workFilterIndex");
const workFilterDifficulty = document.getElementById("workFilterDifficulty");
const workFilterDone = document.getElementById("workFilterDone");
const workFilterDelivered = document.getElementById("workFilterDelivered");

// lê os filtros atuais
function getWorkFilters() {
  return {
    index: workFilterIndex ? workFilterIndex.value : "all",
    difficulty: workFilterDifficulty ? workFilterDifficulty.value : "all",
    done: workFilterDone ? workFilterDone.value : "all",
    delivered: workFilterDelivered ? workFilterDelivered.value : "all",
  };
}

// controla as cores do seletor de dificuldade
function applyDifficultyClass(selectEl, difficulty) {
  selectEl.classList.remove("difficulty-facil", "difficulty-medio", "difficulty-dificil");

  if (difficulty === "facil") {
    selectEl.classList.add("difficulty-facil");
  } else if (difficulty === "medio") {
    selectEl.classList.add("difficulty-medio");
  } else if (difficulty === "dificil") {
    selectEl.classList.add("difficulty-dificil");
  }
}

// sempre que mudar algum filtro, redesenha a página de trabalhos
[workFilterIndex, workFilterDifficulty, workFilterDone, workFilterDelivered]
  .filter(Boolean)
  .forEach((el) => {
    el.addEventListener("change", () => {
      renderWorksPage();
    });
  });

function renderWorksPage() {
  worksPageContainer.innerHTML = "";
  const subjects = getSubjectsForCurrentSemester();

  if (!subjects.length) {
    worksPageContainer.innerHTML = "<p>Nenhuma matéria cadastrada para este semestre.</p>";
    return;
  }

  const filters = getWorkFilters();

  subjects.forEach((subject) => {
    const card = document.createElement("div");
    card.className = "subject-card";

    const header = document.createElement("div");
    header.className = "subject-card-header";

    const nameSpan = document.createElement("div");
    nameSpan.className = "subject-name";
    nameSpan.textContent = subject.name;

    const badge = document.createElement("span");
    badge.className = "badge badge-semester";
    badge.textContent = `${subject.semester}º sem.`;

    header.appendChild(nameSpan);
    header.appendChild(badge);

    const blocks = document.createElement("div");
    blocks.className = "two-columns";

    // percorre Trabalho 1 / Trabalho 2
    subject.works.forEach((work, index) => {
      // garante campos novos
      if (!work.difficulty) work.difficulty = "medio";
      if (work.delivered === undefined) work.delivered = false;

      // =========== APLICAÇÃO DOS FILTROS ===========

      // 1) filtro por Trabalho 1 / 2 / Todos
      if (filters.index !== "all" && Number(filters.index) !== index) {
        return;
      }

      // 2) filtro por dificuldade
      const diff = work.difficulty || "medio";
      if (filters.difficulty !== "all" && filters.difficulty !== diff) {
        return;
      }

      // 3) filtro por concluído / não concluído
      const isDone = !!work.done;
      if (filters.done === "done" && !isDone) return;
      if (filters.done === "not" && isDone) return;

      // 4) filtro por entregue / não entregue
      const isDelivered = !!work.delivered;
      if (filters.delivered === "delivered" && !isDelivered) return;
      if (filters.delivered === "not" && isDelivered) return;

      // =========== FIM DOS FILTROS ===========

      const wb = document.createElement("div");
      wb.className = "work-block";

      const title = document.createElement("h3");
      title.textContent = `Trabalho ${index + 1}`;

      const textarea = document.createElement("textarea");
      textarea.className = "textarea-small";
      textarea.placeholder = "O que o professor pediu?";
      textarea.value = work.description || "";
      textarea.addEventListener("input", () => {
        work.description = textarea.value;
        saveState();
      });

      const smallRow = document.createElement("div");
      smallRow.className = "small-row";

      // Data de entrega
      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = work.dueDate || "";
      dateInput.addEventListener("change", () => {
        work.dueDate = dateInput.value || null;
        saveState();
        renderCalendar();
        renderUpcomingDeadlines();
      });

      // seletor de dificuldade
      const diffSelect = document.createElement("select");
      diffSelect.className = "difficulty-select";

      const difficulties = [
        { value: "facil", label: "Fácil" },
        { value: "medio", label: "Médio" },
        { value: "dificil", label: "Difícil" },
      ];

      difficulties.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.value;
        opt.textContent = d.label;
        diffSelect.appendChild(opt);
      });

      diffSelect.value = work.difficulty || "medio";
      applyDifficultyClass(diffSelect, diffSelect.value);

      diffSelect.addEventListener("change", () => {
        work.difficulty = diffSelect.value;
        applyDifficultyClass(diffSelect, diffSelect.value);
        saveState();
      });

      // checkbox Concluído
      const checkboxLabel = document.createElement("label");
      checkboxLabel.className = "checkbox-label";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = !!work.done;
      cb.addEventListener("change", () => {
        work.done = cb.checked;
        saveState();
        updateSummary();
        renderSemesterStatus();
      });
      const span = document.createElement("span");
      span.textContent = "Concluído";
      checkboxLabel.appendChild(cb);
      checkboxLabel.appendChild(span);

      // checkbox Entregue
      const deliveredLabel = document.createElement("label");
      deliveredLabel.className = "checkbox-label";
      const deliveredCb = document.createElement("input");
      deliveredCb.type = "checkbox";
      deliveredCb.checked = !!work.delivered;
      deliveredCb.addEventListener("change", () => {
        work.delivered = deliveredCb.checked;
        saveState();
      });
      const deliveredSpan = document.createElement("span");
      deliveredSpan.textContent = "Entregue";
      deliveredLabel.appendChild(deliveredCb);
      deliveredLabel.appendChild(deliveredSpan);

      smallRow.appendChild(dateInput);
      smallRow.appendChild(diffSelect);
      smallRow.appendChild(checkboxLabel);
      smallRow.appendChild(deliveredLabel);

      wb.appendChild(title);
      wb.appendChild(textarea);
      wb.appendChild(smallRow);
      blocks.appendChild(wb);
    });

    // só mostra a matéria se sobrou algum trabalho depois dos filtros
    if (blocks.hasChildNodes()) {
      card.appendChild(header);
      card.appendChild(blocks);
      worksPageContainer.appendChild(card);
    }
  });

  // se nenhum trabalho passou pelos filtros:
  if (!worksPageContainer.hasChildNodes()) {
    worksPageContainer.innerHTML =
      "<p>Nenhum trabalho encontrado com os filtros selecionados.</p>";
  }
}

// --------- PROVAS ---------
const examsPageContainer = document.getElementById("examsPageContainer");

function renderExamsPage() {
  examsPageContainer.innerHTML = "";
  const subjects = getSubjectsForCurrentSemester();

  if (!subjects.length) {
    examsPageContainer.innerHTML = "<p>Nenhuma matéria cadastrada para este semestre.</p>";
    return;
  }

  subjects.forEach(subject => {
    const card = document.createElement("div");
    card.className = "subject-card";

    const header = document.createElement("div");
    header.className = "subject-card-header";

    const nameSpan = document.createElement("div");
    nameSpan.className = "subject-name";
    nameSpan.textContent = subject.name;

    const badge = document.createElement("span");
    badge.className = "badge badge-semester";
    badge.textContent = `${subject.semester}º sem.`;

    header.appendChild(nameSpan);
    header.appendChild(badge);

    const blocks = document.createElement("div");
    blocks.className = "two-columns";

    subject.exams.forEach((exam, index) => {
      const eb = document.createElement("div");
      eb.className = "exam-block";

      const title = document.createElement("h3");
      title.textContent = `Prova ${index + 1}`;

      const textarea = document.createElement("textarea");
      textarea.className = "textarea-small";
      textarea.placeholder = "Conteúdo da prova";
      textarea.value = exam.description || "";
      textarea.addEventListener("input", () => {
        exam.description = textarea.value;
        saveState();
      });

      const smallRow = document.createElement("div");
      smallRow.className = "small-row";

      const dateInput = document.createElement("input");
      dateInput.type = "date";
      dateInput.value = exam.date || "";
      dateInput.addEventListener("change", () => {
        exam.date = dateInput.value || null;
        saveState();
        renderCalendar();
        renderUpcomingDeadlines();
      });

      const checkboxLabel = document.createElement("label");
      checkboxLabel.className = "checkbox-label";
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = exam.done;
      cb.addEventListener("change", () => {
        exam.done = cb.checked;
        saveState();
        updateSummary();
        renderSemesterStatus();
      });
      const span = document.createElement("span");
      span.textContent = "Realizada";

      checkboxLabel.appendChild(cb);
      checkboxLabel.appendChild(span);

      smallRow.appendChild(dateInput);
      smallRow.appendChild(checkboxLabel);

      eb.appendChild(title);
      eb.appendChild(textarea);
      eb.appendChild(smallRow);
      blocks.appendChild(eb);
    });

    card.appendChild(header);
    card.appendChild(blocks);
    examsPageContainer.appendChild(card);
  });
}

// --------- MATÉRIAS / AULAS ---------
const addSubjectForm = document.getElementById("addSubjectForm");
const subjectNameInput = document.getElementById("subjectNameInput");
const subjectSemesterInput = document.getElementById("subjectSemesterInput");
const subjectsManager = document.getElementById("subjectsManager");

addSubjectForm.addEventListener("submit", evt => {
  evt.preventDefault();
  const name = subjectNameInput.value.trim();
  const sem = Number(subjectSemesterInput.value);
  if (!name || !sem) return;

  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "_") + "_" + Date.now();

  state.subjects.push({
    id,
    name,
    semester: sem,
    grades: { t1: null, p1: null, t2: null, p2: null },
    works: [
      { id: id + "_w1", description: "", done: false, dueDate: null },
      { id: id + "_w2", description: "", done: false, dueDate: null }
    ],
    exams: [
      { id: id + "_e1", description: "", done: false, date: null },
      { id: id + "_e2", description: "", done: false, date: null }
    ],
    lessons: []
  });

  saveState();
  subjectNameInput.value = "";
  subjectSemesterInput.value = "";
  renderSubjectsManager();
  renderAll();
});

function renderSubjectsManager() {
  subjectsManager.innerHTML = "";

  // 👇 agora usamos só as matérias do semestre atual
  const subjects = getSubjectsForCurrentSemester();

  // Se não tiver nenhuma matéria para ESTE semestre
  if (!subjects || !subjects.length) {
    subjectsManager.innerHTML = "<p>Nenhuma matéria cadastrada para este semestre ainda.</p>";
    return;
  }

  const sorted = [...subjects].sort((a, b) => {
    if (a.semester !== b.semester) return a.semester - b.semester;
    return a.name.localeCompare(b.name);
  });

  sorted.forEach(subject => {
    const card = document.createElement("div");
    card.className = "subject-card";

    const header = document.createElement("div");
    header.className = "subject-card-header";

    // Nome da matéria (lado esquerdo)
    const left = document.createElement("div");
    left.className = "subject-name";
    left.textContent = subject.name;

    // Lado direito: semestre + botões de ação
    const right = document.createElement("div");
    right.className = "subject-actions";

    const badge = document.createElement("span");
    badge.className = "badge badge-semester";
    badge.textContent = `${subject.semester}º sem.`;
    right.appendChild(badge);

    // BOTÃO EDITAR MATÉRIA
    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.addEventListener("click", () => {
      const newName = prompt("Novo nome da matéria:", subject.name);
      if (newName === null) return; // cancelou
      const trimmed = newName.trim();
      if (!trimmed) return;

      const newSemStr = prompt(
        "Novo semestre (ex.: 1, 2, 3, 4, 5):",
        String(subject.semester)
      );
      if (newSemStr === null) return;

      const newSem = Number(newSemStr);
      if (!newSem || newSem < 1 || newSem > 10) {
        alert("Semestre inválido. Use um número entre 1 e 10.");
        return;
      }

      subject.name = trimmed;
      subject.semester = newSem;
      saveState();
      // Recalcula tudo (notas, trabalhos, provas, capa etc.)
      renderAll();
    });
    right.appendChild(editBtn);

    // BOTÃO EXCLUIR MATÉRIA
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Excluir";
    deleteBtn.addEventListener("click", () => {
      const ok = confirm(
        `Tem certeza que deseja excluir a matéria "${subject.name}" e TODOS os dados ligados a ela (notas, trabalhos, provas e aulas)?`
      );
      if (!ok) return;

      // Remove a matéria inteira do estado
      state.subjects = state.subjects.filter(s => s.id !== subject.id);
      saveState();
      renderAll();
    });
    right.appendChild(deleteBtn);

    header.appendChild(left);
    header.appendChild(right);

    // PROGRESSO DAS AULAS
    const lessonsList = document.createElement("ul");
    lessonsList.className = "lessons-list";

    const total = subject.lessons.length;
    const done = subject.lessons.filter(l => l.done).length;
    const percent = total ? Math.round((done / total) * 100) : 0;

    const progressWrapper = document.createElement("div");
    progressWrapper.className = "progress-bar-wrapper";
    progressWrapper.innerHTML = `
      <div class="progress-bar-track">
        <div class="progress-bar-fill" style="width:${percent}%;"></div>
      </div>
      <div style="font-size:0.78rem;margin-top:2px;color:var(--text-muted);">
        Progresso: ${done}/${total} (${percent}%)
      </div>
    `;

    // LISTA DE AULAS
    subject.lessons.forEach(lesson => {
      const li = document.createElement("li");

      const main = document.createElement("div");
      main.className = "lesson-main";

      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.checked = lesson.done;
      cb.addEventListener("change", () => {
        lesson.done = cb.checked;
        saveState();
        renderSubjectsManager();
        updateSummary();
        renderSemesterStatus();
      });

      const span = document.createElement("span");
      span.textContent = lesson.title;

      main.appendChild(cb);
      main.appendChild(span);

      const actions = document.createElement("div");
      actions.className = "lesson-actions";
      const delBtn = document.createElement("button");
      delBtn.textContent = "Excluir";
      delBtn.addEventListener("click", () => {
        subject.lessons = subject.lessons.filter(l => l.id !== lesson.id);
        saveState();
        renderSubjectsManager();
        updateSummary();
        renderSemesterStatus();
      });
      actions.appendChild(delBtn);

      li.appendChild(main);
      li.appendChild(actions);
      lessonsList.appendChild(li);
    });

    // LINHA PARA ADICIONAR NOVA AULA
    const addRow = document.createElement("div");
    addRow.className = "add-lesson-row";
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = "Título da aula/unidade";
    const btn = document.createElement("button");
    btn.textContent = "Adicionar";
    btn.addEventListener("click", () => {
      const title = input.value.trim();
      if (!title) return;
      const id = subject.id + "_l_" + Date.now();
      subject.lessons.push({ id, title, done: false });
      input.value = "";
      saveState();
      renderSubjectsManager();
      updateSummary();
      renderSemesterStatus();
    });
    addRow.appendChild(input);
    addRow.appendChild(btn);

    card.appendChild(header);
    card.appendChild(progressWrapper);
    card.appendChild(lessonsList);
    card.appendChild(addRow);

    subjectsManager.appendChild(card);
  });
}

// --------- BACKUP ---------
const downloadBackupBtn = document.getElementById("downloadBackupBtn");
const restoreBackupBtn = document.getElementById("restoreBackupBtn");
const backupFileInput = document.getElementById("backupFileInput");
const backupStatus = document.getElementById("backupStatus");

downloadBackupBtn.addEventListener("click", () => {
  try {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    a.href = url;
    a.download = `backup_faculdade_${y}-${m}-${d}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    backupStatus.textContent = "Backup baixado com sucesso. Guarde esse arquivo em um lugar seguro.";
  } catch (e) {
    console.error(e);
    backupStatus.textContent = "Erro ao gerar backup.";
  }
});

restoreBackupBtn.addEventListener("click", () => {
  const file = backupFileInput.files[0];
  if (!file) {
    backupStatus.textContent = "Selecione um arquivo de backup (.json) primeiro.";
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed = JSON.parse(e.target.result);
      if (!parsed || typeof parsed !== "object" || !parsed.subjects) {
        backupStatus.textContent = "Arquivo inválido. Parece que não é um backup deste site.";
        return;
      }
      state = parsed;
      saveState();
      applyTheme();
      renderAll();
      backupStatus.textContent = "Backup restaurado com sucesso!";
    } catch (err) {
      console.error(err);
      backupStatus.textContent = "Erro ao ler arquivo de backup.";
    }
  };
  reader.readAsText(file, "utf-8");
});

// --------- NAVEGAÇÃO / ALTERAÇÃO DE SEMESTRE ---------
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const viewName = btn.dataset.view;
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    Object.keys(views).forEach(name => {
      views[name].classList.toggle("active", name === viewName);
    });
  });
});

globalSemesterSelect.addEventListener("change", () => {
  currentSemester = Number(globalSemesterSelect.value);
  renderAll();
});

// --------- RENDERIZAÇÃO GERAL ---------
function renderAll() {
  updateSummary();
  renderSemesterStatus();
  renderCalendar();
  renderHolidayList();
  renderImportantDatesList();
  renderTimetable();
  renderUpcomingDeadlines();
  renderGrades();
  renderWorksPage();
  renderExamsPage();
  renderSubjectsManager();
}

// Inicialização
applyTheme();
initCalendar();
renderHolidayList();
renderImportantDatesList();
renderTimetable();
renderUpcomingDeadlines();
renderAll();
