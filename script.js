// --------- ESTRUTURA DE DADOS E ESTADO ---------
const STORAGE_KEY = "organizador_faculdade_v2";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Estado inicial vazio: cada pessoa preenche os próprios dados no site.
const defaultState = {
  theme: "dark",

  // salva o semestre atual escolhido no topo
  currentSemester: 1,
  totalSemesters: 8,
  courseName: "",
  profile: {
    name: "",
    nickname: ""
  },

  // Fórmula da média: (T1 + P1) × peso1 + (T2 + P2) × peso2, dividido por (peso1 + peso2)
  gradeConfig: {
    weight1: 2,
    weight2: 3,
    passingGrade: 6
  },

  // aparência: cor principal e estilo do fundo
  appearance: {
    accent: "#6d63e8",
    background: "padrao"
  },

  // controle de faltas: desligado por padrão (nem toda faculdade controla)
  attendance: {
    enabled: false,
    minPercent: 75
  },

  // data (ISO) do último backup baixado
  lastBackupAt: null,

  subjects: [],

  importantDatesBySemester: {},

  timetableBySemester: {}
};


// =====================================================
// CARREGAMENTO E SALVAMENTO
// =====================================================

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return clone(defaultState);
    }

    const parsed = JSON.parse(raw);

    return parsed;

  } catch (e) {

    console.error(
      "Erro ao carregar estado:",
      e
    );

    return clone(defaultState);
  }
}


let state = loadState();

let currentSemester =
  Number(
    state.currentSemester || 5
  );


function saveState() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(state)
  );

  // avisa a sincronização na nuvem (sync.js), se estiver ativa
  if (window.cloudSync && typeof window.cloudSync.notifyChange === "function") {
    window.cloudSync.notifyChange();
  }
}


// Troca todos os dados pelos que vieram da nuvem (usado pelo sync.js)
function replaceStateFromCloud(parsed) {
  state = parsed;

  ensureSemesterMaps();
  ensureConfigState();

  currentSemester = Number(state.currentSemester || 1);

  if (currentSemester > state.totalSemesters) {
    currentSemester = state.totalSemesters;
  }

  state.currentSemester = currentSemester;

  migrateLegacyDataIfNeeded();
  saveState();
  applyTheme();
  renderAll();
}


// =====================================================
// HELPERS DE SEMESTRE + MIGRAÇÃO
// =====================================================

function ensureSemesterMaps() {

  if (!state.currentSemester) {
    state.currentSemester =
      currentSemester || 5;
  }

  if (!state.importantDatesBySemester) {
    state.importantDatesBySemester = {};
  }

  if (!state.timetableBySemester) {
    state.timetableBySemester = {};
  }
}


function getSemesterKey() {
  return String(currentSemester);
}


function getImportantDatesForCurrentSemester() {

  ensureSemesterMaps();

  const sem = getSemesterKey();

  return (
    state.importantDatesBySemester[sem] ||
    []
  );
}


function getTimetableForCurrentSemester() {

  ensureSemesterMaps();

  const sem = getSemesterKey();

  const base =
    state.timetableBySemester[sem] ||
    {};

  return {

    monday:
      base.monday || [],

    tuesday:
      base.tuesday || [],

    wednesday:
      base.wednesday || [],

    thursday:
      base.thursday || [],

    friday:
      base.friday || []

  };
}


function setTimetableForCurrentSemester(
  newTable
) {

  ensureSemesterMaps();

  const sem = getSemesterKey();

  state.timetableBySemester[sem] =
    newTable;
}


// =====================================================
// MIGRAÇÃO DE DADOS ANTIGOS
// =====================================================

function migrateLegacyDataIfNeeded() {

  ensureSemesterMaps();


  // importantDates antigo -> semestre atual

  if (
    Array.isArray(
      state.importantDates
    )
  ) {

    const semKey =
      String(
        state.currentSemester ||
        currentSemester ||
        5
      );


    if (
      !state
        .importantDatesBySemester[
          semKey
        ]
    ) {

      state
        .importantDatesBySemester[
          semKey
        ] =
        state.importantDates;

    }


    delete state.importantDates;
  }


  // timetable antigo -> semestre atual

  if (
    state.timetable &&
    typeof state.timetable === "object"
  ) {

    const semKey =
      String(
        state.currentSemester ||
        currentSemester ||
        5
      );


    if (
      !state
        .timetableBySemester[
          semKey
        ]
    ) {

      state
        .timetableBySemester[
          semKey
        ] =
        state.timetable;

    }


    delete state.timetable;
  }


  saveState();
}


// =====================================================
// CONFIGURAÇÃO
// =====================================================

function ensureConfigState() {

  if (
    !state.totalSemesters ||
    state.totalSemesters < 1
  ) {
    state.totalSemesters = 5;
  }


  if (
    typeof state.courseName !==
    "string"
  ) {
    state.courseName = "";
  }

  if (!state.profile || typeof state.profile !== "object") {
    // Migração para instalações anteriores que ainda não tinham Perfil.
    state.profile = { name: "", nickname: "" };
  }

  if (!state.attendance || typeof state.attendance !== "object") {
    state.attendance = { enabled: false, minPercent: 75 };
  }

  if (!state.gradeConfig || typeof state.gradeConfig !== "object") {
    state.gradeConfig = { weight1: 2, weight2: 3, passingGrade: 6 };
  }

  if (typeof state.profile.name !== "string") {
    state.profile.name = "";
  }

  if (typeof state.profile.nickname !== "string") {
    state.profile.nickname = "";
  }


  if (!state.currentSemester) {
    state.currentSemester =
      currentSemester || 1;
  }
}


function renderSemesterOptions() {

  ensureConfigState();


  if (globalSemesterSelect) {

    const previousValue =
      String(
        currentSemester ||
        state.currentSemester ||
        1
      );


    globalSemesterSelect.innerHTML =
      "";


    for (
      let i = 1;
      i <= state.totalSemesters;
      i++
    ) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        String(i);

      option.textContent =
        `${i}º semestre`;

      globalSemesterSelect.appendChild(
        option
      );
    }


    const allowed =
      [
        ...globalSemesterSelect.options
      ].some(
        opt =>
          opt.value ===
          previousValue
      );


    globalSemesterSelect.value =
      allowed
        ? previousValue
        : "1";
  }


  if (subjectSemesterInput) {

    const previousValue =
      subjectSemesterInput.value;


    subjectSemesterInput.innerHTML =
      `<option value="">Semestre</option>`;


    for (
      let i = 1;
      i <= state.totalSemesters;
      i++
    ) {

      const option =
        document.createElement(
          "option"
        );

      option.value =
        String(i);

      option.textContent =
        `${i}º`;

      subjectSemesterInput.appendChild(
        option
      );
    }


    const allowed =
      [
        ...subjectSemesterInput.options
      ].some(
        opt =>
          opt.value ===
          previousValue
      );


    if (allowed) {
      subjectSemesterInput.value =
        previousValue;
    }
  }
}


function renderConfigFields() {

  if (profileNameInput) {
    profileNameInput.value = state.profile?.name || "";
  }

  if (profileNicknameInput) {
    profileNicknameInput.value = state.profile?.nickname || "";
  }

  if (courseNameInput) {

    courseNameInput.value =
      state.courseName || "";
  }


  if (totalSemestersInput) {

    totalSemestersInput.value =
      String(
        state.totalSemesters || 5
      );
  }
}


// =====================================================
// ELEMENTOS GERAIS
// =====================================================

const globalSemesterSelect =
  document.getElementById(
    "globalSemesterSelect"
  );


const navButtons =
  document.querySelectorAll(
    ".nav-btn"
  );


const views = {

  capa:
    document.getElementById(
      "view-capa"
    ),

  notas:
    document.getElementById(
      "view-notas"
    ),

  trabalhos:
    document.getElementById(
      "view-trabalhos"
    ),

  provas:
    document.getElementById(
      "view-provas"
    ),

  materias:
    document.getElementById(
      "view-materias"
    ),

  ajuda:
    document.getElementById(
      "view-ajuda"
    ),

  config:
    document.getElementById(
      "view-config"
    ),

  noticias:
    document.getElementById(
      "view-noticias"
    )

};


const themeToggleBtn =
  document.getElementById(
    "themeToggleBtn"
  );


const courseNameInput =
  document.getElementById(
    "courseNameInput"
  );


const totalSemestersInput =
  document.getElementById(
    "totalSemestersInput"
  );


const saveConfigBtn =
  document.getElementById(
    "saveConfigBtn"
  );


const configStatus =
  document.getElementById(
    "configStatus"
  );

const profileNameInput = document.getElementById("profileNameInput");
const profileNicknameInput = document.getElementById("profileNicknameInput");
const saveProfileBtn = document.getElementById("saveProfileBtn");
const profileStatus = document.getElementById("profileStatus");
const welcomeGreeting = document.getElementById("welcomeGreeting");
const welcomeDateWeekday = document.getElementById("welcomeDateWeekday");
const welcomeDateDay = document.getElementById("welcomeDateDay");
const welcomeDateMonth = document.getElementById("welcomeDateMonth");
const pageHeaderTitle = document.getElementById("pageHeaderTitle");




// =====================================================
// NOVO RESUMO DOS SEMESTRES
// =====================================================

const summarySemesterSelect =
  document.getElementById(
    "summarySemesterSelect"
  );


const generateSemesterSummaryBtn =
  document.getElementById(
    "generateSemesterSummaryBtn"
  );


const printSemesterSummaryBtn =
  document.getElementById(
    "printSemesterSummaryBtn"
  );


const semesterSummaryPage =
  document.getElementById(
    "semesterSummaryPage"
  );


const semesterSummaryTitle =
  document.getElementById(
    "semesterSummaryTitle"
  );


const semesterSummaryCourse =
  document.getElementById(
    "semesterSummaryCourse"
  );


const semesterSummaryStats =
  document.getElementById(
    "semesterSummaryStats"
  );


const semesterSummaryContent =
  document.getElementById(
    "semesterSummaryContent"
  );


const closeSemesterSummaryBtn =
  document.getElementById(
    "closeSemesterSummaryBtn"
  );


const semesterPrintReport =
  document.getElementById(
    "semesterPrintReport"
  );


const semesterSummaryTabs =
  document.querySelectorAll(
    ".semester-summary-tab"
  );


// =====================================================
// FILTROS
// =====================================================

const gradeFilterPart =
  document.getElementById(
    "gradePartFilter"
  );


const examFilterSubject =
  document.getElementById(
    "examFilterSubject"
  );


const examFilterStatus =
  document.getElementById(
    "examFilterDone"
  );


const subjectFilterInput =
  document.getElementById(
    "subjectsFilterInput"
  );


// =====================================================
// TEMA
// =====================================================

function applyTheme() {

  const theme =
    state.theme || "dark";


  if (theme === "light") {

    document.body.classList.add(
      "light"
    );


    if (themeToggleBtn) {
      themeToggleBtn.textContent =
        "🌙 Modo escuro";
      themeToggleBtn.title =
        "Mudar para o modo escuro";
    }

  } else {

    document.body.classList.remove(
      "light"
    );


    if (themeToggleBtn) {
      themeToggleBtn.textContent =
        "☀️ Modo claro";
      themeToggleBtn.title =
        "Mudar para o modo claro";
    }
  }

  applyAppearance();
}


if (themeToggleBtn) {

  themeToggleBtn.addEventListener(
    "click",
    () => {

      state.theme =
        state.theme === "light"
          ? "dark"
          : "light";


      saveState();

      applyTheme();
    }
  );
}


// =====================================================
// SALVAR CONFIGURAÇÃO
// =====================================================

if (saveConfigBtn) {

  saveConfigBtn.addEventListener(
    "click",
    () => {

      const courseName =
        courseNameInput
          ? courseNameInput.value.trim()
          : "";


      const totalSemesters =
        totalSemestersInput
          ? Number(
              totalSemestersInput.value
            )
          : 0;


      if (
        !totalSemesters ||
        totalSemesters < 1 ||
        totalSemesters > 20
      ) {

        if (configStatus) {

          configStatus.textContent =
            "Informe uma quantidade válida de semestres entre 1 e 20.";
        }

        return;
      }


      state.courseName =
        courseName;


      state.totalSemesters =
        totalSemesters;


      if (
        currentSemester >
        state.totalSemesters
      ) {

        currentSemester =
          state.totalSemesters;


        state.currentSemester =
          currentSemester;
      }


      state.subjects.forEach(
        subject => {

          if (
            subject.semester >
            state.totalSemesters
          ) {

            subject.semester =
              state.totalSemesters;
          }
        }
      );


      saveState();

      renderSemesterOptions();

      renderConfigFields();

      renderAll();


      if (configStatus) {

        configStatus.textContent =
          "Configuração salva com sucesso.";
      }
    }
  );
}


// =====================================================
// PERFIL E SAUDAÇÃO
// =====================================================

function getDisplayName() {
  const nickname = state.profile?.nickname?.trim();
  const name = state.profile?.name?.trim();
  return nickname || name || "estudante";
}

function getGreetingByHour(hour) {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function renderProfileGreeting() {
  const now = new Date();
  const displayName = getDisplayName();

  if (welcomeGreeting) {
    welcomeGreeting.textContent = `${getGreetingByHour(now.getHours())}, ${displayName}!`;
  }

  if (welcomeDateWeekday) {
    welcomeDateWeekday.textContent = now.toLocaleDateString("pt-BR", { weekday: "long" });
  }

  if (welcomeDateDay) {
    welcomeDateDay.textContent = String(now.getDate()).padStart(2, "0");
  }

  if (welcomeDateMonth) {
    welcomeDateMonth.textContent = now.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  }
}

if (saveProfileBtn) {
  saveProfileBtn.addEventListener("click", () => {
    state.profile = {
      name: profileNameInput ? profileNameInput.value.trim() : "",
      nickname: profileNicknameInput ? profileNicknameInput.value.trim() : ""
    };

    saveState();
    renderConfigFields();
    renderProfileGreeting();
    renderNotices();

    if (profileStatus) {
      profileStatus.textContent = "Perfil salvo com sucesso.";
    }
  });
}

// =====================================================
// RESUMO DOS SEMESTRES
// VERSÃO NOVA — ÚNICA
// =====================================================

let selectedSummarySemester =
  null;


let currentSummaryTab =
  "overview";


function populateSummarySemesterSelect() {

  if (!summarySemesterSelect) {
    return;
  }


  const previousValue =
    summarySemesterSelect.value;


  const total =
    Number(
      state.totalSemesters
    ) || 5;


  summarySemesterSelect.innerHTML = `

    <option value="">
      Selecione o semestre
    </option>

  `;


  for (
    let i = 1;
    i <= total;
    i++
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      String(i);


    option.textContent =
      `${i}º semestre`;


    summarySemesterSelect.appendChild(
      option
    );
  }


  if (
    previousValue &&
    Number(previousValue) <= total
  ) {

    summarySemesterSelect.value =
      previousValue;
  }
}


function formatSummaryDate(date) {

  if (!date) {
    return "-";
  }


  const [
    year,
    month,
    day
  ] =
    date.split("-");


  return (
    `${day}/${month}/${year}`
  );
}


function getDifficultyLabel(value) {

  if (value === "facil") {
    return "Fácil";
  }


  if (value === "dificil") {
    return "Difícil";
  }


  return "Médio";
}


function getSemesterSummaryData(
  semesterNumber
) {

  const semester =
    Number(
      semesterNumber
    );


  const subjects =
    state.subjects.filter(
      subject =>
        Number(
          subject.semester
        ) === semester
    );


  const key =
    String(
      semester
    );


  const importantDates =
    state
      .importantDatesBySemester?.[
        key
      ] || [];


  const timetable =
    state
      .timetableBySemester?.[
        key
      ] || {};


  let totalWorks = 0;

  let doneWorks = 0;

  let deliveredWorks = 0;

  let totalExams = 0;

  let doneExams = 0;

  let totalLessons = 0;

  let doneLessons = 0;


  subjects.forEach(
    subject => {

      const works =
        subject.works || [];


      const exams =
        subject.exams || [];


      const lessons =
        subject.lessons || [];


      totalWorks +=
        works.length;


      doneWorks +=
        works.filter(
          work =>
            work.done
        ).length;


      deliveredWorks +=
        works.filter(
          work =>
            work.delivered
        ).length;


      totalExams +=
        exams.length;


      doneExams +=
        exams.filter(
          exam =>
            exam.done
        ).length;


      totalLessons +=
        lessons.length;


      doneLessons +=
        lessons.filter(
          lesson =>
            lesson.done
        ).length;
    }
  );


  const studyProgress =
    totalLessons
      ? Math.round(
          (
            doneLessons /
            totalLessons
          ) * 100
        )
      : 0;


  return {

    semester,

    subjects,

    importantDates,

    timetable,

    totalWorks,

    doneWorks,

    deliveredWorks,

    totalExams,

    doneExams,

    totalLessons,

    doneLessons,

    studyProgress

  };
}


// =====================================================
// CARDS DE ESTATÍSTICAS DO RESUMO
// =====================================================

function renderSummaryStats(data) {

  if (!semesterSummaryStats) {
    return;
  }


  semesterSummaryStats.innerHTML = `

    <div class="semester-summary-stat">

      <span>
        Matérias
      </span>

      <strong>
        ${data.subjects.length}
      </strong>

    </div>


    <div class="semester-summary-stat">

      <span>
        Trabalhos concluídos
      </span>

      <strong>
        ${data.doneWorks}/${data.totalWorks}
      </strong>

    </div>


    <div class="semester-summary-stat">

      <span>
        Trabalhos entregues
      </span>

      <strong>
        ${data.deliveredWorks}/${data.totalWorks}
      </strong>

    </div>


    <div class="semester-summary-stat">

      <span>
        Provas realizadas
      </span>

      <strong>
        ${data.doneExams}/${data.totalExams}
      </strong>

    </div>


    <div class="semester-summary-stat">

      <span>
        Progresso de estudo
      </span>

      <strong>
        ${data.studyProgress}%
      </strong>

    </div>

  `;
}


// =====================================================
// VISÃO GERAL DO RESUMO
// =====================================================

function renderSummaryOverview(data) {

  if (!semesterSummaryContent) {
    return;
  }


  const subjectNames =
    data.subjects.length
      ? data.subjects
          .map(
            subject => `

              <span
                class="summary-subject-chip"
              >
                ${subject.name}
              </span>

            `
          )
          .join("")
      : `

        <p
          class="semester-summary-muted"
        >
          Nenhuma matéria cadastrada.
        </p>

      `;


  semesterSummaryContent.innerHTML = `

    <section
      class="summary-tab-section"
    >

      <div
        class="summary-section-title"
      >

        <div>

          <h3>
            Visão geral
          </h3>

          <p>
            Acompanhamento acadêmico
            do semestre.
          </p>

        </div>

      </div>


      <div
        class="summary-progress-card"
      >

        <div
          class="summary-progress-header"
        >

          <strong>
            Progresso de estudo
          </strong>

          <span>

            ${data.doneLessons}/
            ${data.totalLessons}
            conteúdos

          </span>

        </div>


        <div
          class="summary-big-progress"
        >

          <div
            style="
              width:
              ${data.studyProgress}%;
            "
          >
          </div>

        </div>


        <span
          class="summary-progress-percent"
        >

          ${data.studyProgress}%

        </span>

      </div>


      <div
        class="summary-overview-grid"
      >

        <div
          class="summary-overview-card"
        >

          <h4>
            📚 Matérias
          </h4>

          <div
            class="summary-subject-chips"
          >

            ${subjectNames}

          </div>

        </div>


        <div
          class="summary-overview-card"
        >

          <h4>
            📋 Trabalhos
          </h4>

          <p>

            <strong>
              ${data.doneWorks}
            </strong>

            concluídos de

            <strong>
              ${data.totalWorks}
            </strong>

          </p>

          <p>

            <strong>
              ${data.deliveredWorks}
            </strong>

            entregues

          </p>

        </div>


        <div
          class="summary-overview-card"
        >

          <h4>
            📝 Provas
          </h4>

          <p>

            <strong>
              ${data.doneExams}
            </strong>

            realizadas de

            <strong>
              ${data.totalExams}
            </strong>

          </p>

        </div>

      </div>

    </section>

  `;
}

// =====================================================
// NOTAS DO RESUMO
// =====================================================

function renderSummaryGrades(data) {

  if (!semesterSummaryContent) {
    return;
  }

  let html = "";

  data.subjects.forEach(subject => {

    const grades =
      subject.grades || {};

    const finalGrade =
      computeFinalGrade(grades);

    const finalText =
      finalGrade !== null &&
      !isNaN(finalGrade)
        ? finalGrade.toFixed(2)
        : "-";

    const gradeClass =
      finalGrade !== null &&
      !isNaN(finalGrade) &&
      finalGrade >= getGradeConfig().passingGrade
        ? "summary-grade-approved"
        : "summary-grade-warning";

    html += `

      <div class="summary-grade-card">

        <div class="summary-grade-header">

          <h4>
            ${subject.name}
          </h4>

          <div
            class="
              summary-grade-final
              ${gradeClass}
            "
          >
            ${finalText}
          </div>

        </div>


        <div class="summary-grade-grid">
          ${summaryGradeItemsHtml(grades)}
        </div>

      </div>

    `;
  });


  semesterSummaryContent.innerHTML = `

    <section
      class="summary-tab-section"
    >

      <div
        class="summary-section-title"
      >

        <div>

          <h3>
            Notas
          </h3>

          <p>
            Resultado das avaliações
            do semestre.
          </p>

        </div>

      </div>


      <div
        class="summary-content-list"
      >

        ${
          html ||
          `
            <p
              class="semester-summary-muted"
            >
              Nenhuma matéria cadastrada.
            </p>
          `
        }

      </div>

    </section>

  `;
}


// =====================================================
// TRABALHOS DO RESUMO
// =====================================================

function renderSummaryWorks(data) {

  if (!semesterSummaryContent) {
    return;
  }

  let html = "";

  data.subjects.forEach(subject => {

    const works =
      subject.works || [];

    works.forEach(
      (work, index) => {

        html += `

          <div
            class="summary-task-card"
          >

            <div
              class="summary-task-header"
            >

              <div>

                <span
                  class="summary-task-subject"
                >
                  ${subject.name}
                </span>

                <h4>
                  Trabalho ${index + 1}
                </h4>

              </div>


              <span
                class="
                  summary-status-badge
                  ${
                    work.done
                      ? "summary-status-done"
                      : work.inProgress
                        ? "summary-status-progress"
                        : "summary-status-pending"
                  }
                "
              >

                ${
                  work.done
                    ? "Concluído"
                    : work.inProgress
                      ? "Em andamento"
                      : "Pendente"
                }

              </span>

            </div>


            <p
              class="summary-description"
            >

              ${
                work.description ||
                "Nenhuma descrição cadastrada."
              }

            </p>


            <div
              class="summary-task-footer"
            >

              <span>

                📅

                ${
                  work.dueDate
                    ? formatSummaryDate(
                        work.dueDate
                      )
                    : "Sem data"
                }

              </span>


              <span>

                ${
                  work.delivered
                    ? "📤 Entregue"
                    : "📥 Não entregue"
                }

              </span>


              <span>

                Dificuldade:

                ${
                  getDifficultyLabel(
                    work.difficulty
                  )
                }

              </span>

            </div>

          </div>

        `;
      }
    );
  });


  semesterSummaryContent.innerHTML = `

    <section
      class="summary-tab-section"
    >

      <div
        class="summary-section-title"
      >

        <div>

          <h3>
            Trabalhos
          </h3>

          <p>
            Atividades e entregas
            do semestre.
          </p>

        </div>

      </div>


      <div
        class="summary-content-list"
      >

        ${
          html ||
          `
            <p
              class="semester-summary-muted"
            >
              Nenhum trabalho cadastrado.
            </p>
          `
        }

      </div>

    </section>

  `;
}


// =====================================================
// PROVAS DO RESUMO
// =====================================================

function renderSummaryExams(data) {

  if (!semesterSummaryContent) {
    return;
  }

  let html = "";

  data.subjects.forEach(subject => {

    const exams =
      subject.exams || [];

    exams.forEach(
      (exam, index) => {

        html += `

          <div
            class="summary-task-card"
          >

            <div
              class="summary-task-header"
            >

              <div>

                <span
                  class="summary-task-subject"
                >
                  ${subject.name}
                </span>

                <h4>
                  Prova ${index + 1}
                </h4>

              </div>


              <span
                class="
                  summary-status-badge
                  ${
                    exam.done
                      ? "summary-status-done"
                      : "summary-status-pending"
                  }
                "
              >

                ${
                  exam.done
                    ? "Realizada"
                    : "Pendente"
                }

              </span>

            </div>


            <p
              class="summary-description"
            >

              ${
                exam.description ||
                "Nenhum conteúdo cadastrado."
              }

            </p>


            <div
              class="summary-task-footer"
            >

              <span>

                📅

                ${
                  exam.date
                    ? formatSummaryDate(
                        exam.date
                      )
                    : "Sem data"
                }

              </span>

            </div>

          </div>

        `;
      }
    );
  });


  semesterSummaryContent.innerHTML = `

    <section
      class="summary-tab-section"
    >

      <div
        class="summary-section-title"
      >

        <div>

          <h3>
            Provas
          </h3>

          <p>
            Avaliações do semestre.
          </p>

        </div>

      </div>


      <div
        class="summary-content-list"
      >

        ${
          html ||
          `
            <p
              class="semester-summary-muted"
            >
              Nenhuma prova cadastrada.
            </p>
          `
        }

      </div>

    </section>

  `;
}


// =====================================================
// MATÉRIAS DO RESUMO
// =====================================================

function renderSummarySubjects(data) {

  if (!semesterSummaryContent) {
    return;
  }

  let html = "";

  data.subjects.forEach(subject => {

    const lessons =
      subject.lessons || [];

    const done =
      lessons.filter(
        lesson =>
          lesson.done
      ).length;

    const percent =
      lessons.length
        ? Math.round(
            (
              done /
              lessons.length
            ) * 100
          )
        : 0;


    const lessonHtml =
      lessons.length
        ? lessons
            .map(
              lesson => `

                <li
                  class="
                    ${
                      lesson.done
                        ? "summary-lesson-done"
                        : ""
                    }
                  "
                >

                  <span>
                    ${
                      lesson.done
                        ? "✓"
                        : "○"
                    }
                  </span>

                  ${lesson.title}

                </li>

              `
            )
            .join("")
        : `

          <li>
            Nenhum conteúdo cadastrado.
          </li>

        `;


    html += `

      <div
        class="summary-subject-card"
      >

        <div
          class="summary-subject-header"
        >

          <div>

            <h4>
              ${subject.name}
            </h4>

          </div>


          <strong>
            ${percent}%
          </strong>

        </div>


        <div
          class="summary-small-progress"
        >

          <div
            style="
              width:${percent}%;
            "
          >
          </div>

        </div>


        <p
          class="summary-subject-progress-text"
        >

          ${done}/${lessons.length}
          conteúdos estudados

        </p>


        <ul
          class="summary-lessons-list"
        >

          ${lessonHtml}

        </ul>

      </div>

    `;
  });


  semesterSummaryContent.innerHTML = `

    <section
      class="summary-tab-section"
    >

      <div
        class="summary-section-title"
      >

        <div>

          <h3>
            Matérias
          </h3>

          <p>
            Conteúdos estudados
            durante o semestre.
          </p>

        </div>

      </div>


      <div
        class="summary-content-list"
      >

        ${
          html ||
          `
            <p
              class="semester-summary-muted"
            >
              Nenhuma matéria cadastrada.
            </p>
          `
        }

      </div>

    </section>

  `;
}


// =====================================================
// CALENDÁRIO DO RESUMO
// =====================================================

function renderSummaryCalendar(data) {

  if (!semesterSummaryContent) {
    return;
  }

  let datesHtml = "";


  [...data.importantDates]
    .sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    )
    .forEach(item => {

      datesHtml += `

        <div
          class="summary-date-item"
        >

          <div
            class="summary-date-box"
          >

            ${
              formatSummaryDate(
                item.date
              )
            }

          </div>

          <span>
            ${item.label}
          </span>

        </div>

      `;
    });


  if (!datesHtml) {

    datesHtml = `

      <p
        class="semester-summary-muted"
      >
        Nenhuma data importante cadastrada.
      </p>

    `;
  }


  const dayNames = {

    monday:
      "Segunda",

    tuesday:
      "Terça",

    wednesday:
      "Quarta",

    thursday:
      "Quinta",

    friday:
      "Sexta"

  };


  let timetableHtml = "";


  Object.keys(
    dayNames
  ).forEach(day => {

    const classes =
      data.timetable[day] || [];


    classes.forEach(item => {

      timetableHtml += `

        <tr>

          <td>
            ${dayNames[day]}
          </td>

          <td>
            ${item.time}
          </td>

          <td>
            ${item.subject}
          </td>

        </tr>

      `;
    });
  });


  if (!timetableHtml) {

    timetableHtml = `

      <tr>

        <td colspan="3">
          Nenhum horário cadastrado.
        </td>

      </tr>

    `;
  }


  semesterSummaryContent.innerHTML = `

    <section
      class="summary-tab-section"
    >

      <div
        class="summary-section-title"
      >

        <div>

          <h3>
            Calendário
          </h3>

          <p>
            Datas importantes e
            horário das aulas.
          </p>

        </div>

      </div>


      <div
        class="summary-calendar-grid"
      >

        <div
          class="summary-overview-card"
        >

          <h4>
            📅 Datas importantes
          </h4>


          <div
            class="summary-dates-list"
          >

            ${datesHtml}

          </div>

        </div>


        <div
          class="summary-overview-card"
        >

          <h4>
            🕐 Horário das aulas
          </h4>


          <div
            class="
              semester-summary-table-wrapper
            "
          >

            <table
              class="
                semester-summary-table
              "
            >

              <thead>

                <tr>

                  <th>
                    Dia
                  </th>

                  <th>
                    Horário
                  </th>

                  <th>
                    Matéria
                  </th>

                </tr>

              </thead>


              <tbody>

                ${timetableHtml}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </section>

  `;
}


// =====================================================
// CONTROLE DAS ABAS DO RESUMO
// =====================================================

function renderCurrentSummaryTab() {

  if (
    !selectedSummarySemester
  ) {
    return;
  }


  const data =
    getSemesterSummaryData(
      selectedSummarySemester
    );


  if (
    currentSummaryTab ===
    "grades"
  ) {

    renderSummaryGrades(
      data
    );

  } else if (
    currentSummaryTab ===
    "works"
  ) {

    renderSummaryWorks(
      data
    );

  } else if (
    currentSummaryTab ===
    "exams"
  ) {

    renderSummaryExams(
      data
    );

  } else if (
    currentSummaryTab ===
    "subjects"
  ) {

    renderSummarySubjects(
      data
    );

  } else if (
    currentSummaryTab ===
    "calendar"
  ) {

    renderSummaryCalendar(
      data
    );

  } else {

    renderSummaryOverview(
      data
    );
  }
}


semesterSummaryTabs.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        semesterSummaryTabs.forEach(
          tab => {

            tab.classList.remove(
              "active"
            );
          }
        );


        button.classList.add(
          "active"
        );


        currentSummaryTab =
          button.dataset.summaryTab;


        renderCurrentSummaryTab();
      }
    );
  }
);


// =====================================================
// BOTÃO VISUALIZAR RESUMO
// =====================================================

if (
  generateSemesterSummaryBtn
) {

  generateSemesterSummaryBtn
    .addEventListener(
      "click",
      () => {

        const semester =
          Number(
            summarySemesterSelect
              ? summarySemesterSelect.value
              : 0
          );


        if (!semester) {

          alert(
            "Selecione um semestre primeiro."
          );

          return;
        }


        selectedSummarySemester =
          semester;


        currentSummaryTab =
          "overview";


        semesterSummaryTabs.forEach(
          tab => {

            tab.classList.toggle(
              "active",
              tab.dataset.summaryTab ===
                "overview"
            );
          }
        );


        const data =
          getSemesterSummaryData(
            semester
          );


        if (
          semesterSummaryTitle
        ) {

          semesterSummaryTitle.textContent =
            `${semester}º Semestre`;
        }


        if (
          semesterSummaryCourse
        ) {

          semesterSummaryCourse.textContent =
            state.courseName ||
            "Curso não informado";
        }


        renderSummaryStats(
          data
        );


        renderSummaryOverview(
          data
        );


        if (
          semesterSummaryPage
        ) {

          semesterSummaryPage
            .classList.remove(
              "hidden"
            );


          semesterSummaryPage
            .scrollIntoView({

              behavior:
                "smooth",

              block:
                "start"

            });
        }
      }
    );
}


// =====================================================
// BOTÃO FECHAR RESUMO
// =====================================================

if (
  closeSemesterSummaryBtn
) {

  closeSemesterSummaryBtn
    .addEventListener(
      "click",
      () => {

        if (
          semesterSummaryPage
        ) {

          semesterSummaryPage
            .classList.add(
              "hidden"
            );
        }
      }
    );
}


// =====================================================
// RELATÓRIO PARA IMPRESSÃO / PDF
// =====================================================

function generatePrintReport(
  semesterNumber
) {

  if (!semesterPrintReport) {
    return;
  }


  const data =
    getSemesterSummaryData(
      semesterNumber
    );


  let gradesHtml = "";

  let worksHtml = "";

  let examsHtml = "";

  let subjectsHtml = "";

  let datesHtml = "";

  let timetableHtml = "";


  // -------------------------
  // NOTAS
  // -------------------------

  data.subjects.forEach(
    subject => {

      const grades =
        subject.grades || {};


      const final =
        computeFinalGrade(
          grades
        );


      gradesHtml += `

        <div
          class="print-item"
        >

          <strong>
            ${subject.name}
          </strong>

          <p>
            ${printGradeItemsText(grades)}
          </p>

          <p>

            Média:

            ${
              final !== null &&
              !isNaN(final)
                ? final.toFixed(2)
                : "-"
            }

          </p>

        </div>

      `;
    }
  );


  // -------------------------
  // TRABALHOS
  // -------------------------

  data.subjects.forEach(
    subject => {

      const works =
        subject.works || [];


      works.forEach(
        (work, index) => {

          worksHtml += `

            <div
              class="print-item"
            >

              <strong>

                ${subject.name}
                —
                Trabalho ${index + 1}

              </strong>


              <p>

                ${
                  work.description ||
                  "Sem descrição."
                }

              </p>


              <p>

                Data:

                ${
                  work.dueDate
                    ? formatSummaryDate(
                        work.dueDate
                      )
                    : "Sem data"
                }

                ·

                ${
                  work.done
                    ? "Concluído"
                    : work.inProgress
                      ? "Em andamento"
                      : "Pendente"
                }

                ·

                ${
                  work.delivered
                    ? "Entregue"
                    : "Não entregue"
                }

              </p>

            </div>

          `;
        }
      );
    }
  );


  // -------------------------
  // PROVAS
  // -------------------------

  data.subjects.forEach(
    subject => {

      const exams =
        subject.exams || [];


      exams.forEach(
        (exam, index) => {

          examsHtml += `

            <div
              class="print-item"
            >

              <strong>

                ${subject.name}
                —
                Prova ${index + 1}

              </strong>


              <p>

                ${
                  exam.description ||
                  "Sem conteúdo cadastrado."
                }

              </p>


              <p>

                ${
                  exam.date
                    ? formatSummaryDate(
                        exam.date
                      )
                    : "Sem data"
                }

                ·

                ${
                  exam.done
                    ? "Realizada"
                    : "Pendente"
                }

              </p>

            </div>

          `;
        }
      );
    }
  );


  // -------------------------
  // MATÉRIAS
  // -------------------------

  data.subjects.forEach(
    subject => {

      const lessons =
        subject.lessons || [];


      subjectsHtml += `

        <div
          class="print-item"
        >

          <strong>
            ${subject.name}
          </strong>


          <ul>

            ${
              lessons.length
                ? lessons
                    .map(
                      lesson => `

                        <li>

                          ${
                            lesson.done
                              ? "✓"
                              : "○"
                          }

                          ${lesson.title}

                        </li>

                      `
                    )
                    .join("")
                : `

                  <li>
                    Nenhum conteúdo cadastrado.
                  </li>

                `
            }

          </ul>

        </div>

      `;
    }
  );


  // -------------------------
  // DATAS IMPORTANTES
  // -------------------------

  [...data.importantDates]
    .sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    )
    .forEach(item => {

      datesHtml += `

        <li>

          <strong>
            ${
              formatSummaryDate(
                item.date
              )
            }
          </strong>

          —
          ${item.label}

        </li>

      `;
    });


  if (!datesHtml) {

    datesHtml = `

      <li>
        Nenhuma data importante cadastrada.
      </li>

    `;
  }


  // -------------------------
  // HORÁRIO
  // -------------------------

  const printDayNames = {

    monday:
      "Segunda",

    tuesday:
      "Terça",

    wednesday:
      "Quarta",

    thursday:
      "Quinta",

    friday:
      "Sexta"

  };


  Object.keys(
    printDayNames
  ).forEach(day => {

    const classes =
      data.timetable[day] || [];


    classes.forEach(item => {

      timetableHtml += `

        <tr>

          <td>
            ${printDayNames[day]}
          </td>

          <td>
            ${item.time}
          </td>

          <td>
            ${item.subject}
          </td>

        </tr>

      `;
    });
  });


  if (!timetableHtml) {

    timetableHtml = `

      <tr>

        <td colspan="3">
          Nenhum horário cadastrado.
        </td>

      </tr>

    `;
  }


  // -------------------------
  // MONTA O RELATÓRIO
  // -------------------------

  semesterPrintReport.innerHTML = `

    <div
      class="print-report-header"
    >

      <h1>
        Organizador da Faculdade
      </h1>

      <h2>
        ${data.semester}º Semestre
      </h2>

      <p>

        ${
          state.courseName ||
          "Curso não informado"
        }

      </p>

    </div>


    <section>

      <h2>
        Visão geral
      </h2>

      <p>

        Matérias:
        ${data.subjects.length}

      </p>

      <p>

        Trabalhos concluídos:
        ${data.doneWorks}/${data.totalWorks}

      </p>

      <p>

        Trabalhos entregues:
        ${data.deliveredWorks}/${data.totalWorks}

      </p>

      <p>

        Provas realizadas:
        ${data.doneExams}/${data.totalExams}

      </p>

      <p>

        Progresso de estudo:
        ${data.studyProgress}%

      </p>

    </section>


    <section>

      <h2>
        Notas
      </h2>

      ${
        gradesHtml ||
        "<p>Nenhuma nota cadastrada.</p>"
      }

    </section>


    <section>

      <h2>
        Trabalhos
      </h2>

      ${
        worksHtml ||
        "<p>Nenhum trabalho cadastrado.</p>"
      }

    </section>


    <section>

      <h2>
        Provas
      </h2>

      ${
        examsHtml ||
        "<p>Nenhuma prova cadastrada.</p>"
      }

    </section>


    <section>

      <h2>
        Matérias e conteúdos
      </h2>

      ${
        subjectsHtml ||
        "<p>Nenhuma matéria cadastrada.</p>"
      }

    </section>


    <section>

      <h2>
        Datas importantes
      </h2>

      <ul>
        ${datesHtml}
      </ul>

    </section>


    <section>

      <h2>
        Horário das aulas
      </h2>

      <table
        class="semester-summary-table"
      >

        <thead>

          <tr>

            <th>
              Dia
            </th>

            <th>
              Horário
            </th>

            <th>
              Matéria
            </th>

          </tr>

        </thead>

        <tbody>
          ${timetableHtml}
        </tbody>

      </table>

    </section>

  `;
}


// =====================================================
// BOTÃO GERAR PDF
// =====================================================

if (
  printSemesterSummaryBtn
) {

  printSemesterSummaryBtn
    .addEventListener(
      "click",
      () => {

        const semester =
          Number(
            summarySemesterSelect
              ? summarySemesterSelect.value
              : 0
          );


        if (!semester) {

          alert(
            "Selecione o semestre que deseja gerar em PDF."
          );

          return;
        }


        generatePrintReport(
          semester
        );


        window.print();
      }
    );
}

// =====================================================
// RESUMO DA CAPA
// =====================================================

const summarySubjectsEl =
  document.getElementById("summarySubjects");

const summaryWorksEl =
  document.getElementById("summaryWorks");

const summaryExamsEl =
  document.getElementById("summaryExams");

const summaryLessonsEl =
  document.getElementById("summaryLessons");

const semesterStatusContainer =
  document.getElementById("semesterStatusContainer");


function getSubjectsForCurrentSemester() {

  return state.subjects.filter(
    subject =>
      Number(subject.semester) ===
      Number(currentSemester)
  );
}


function computeSemesterStats() {

  const subjects =
    getSubjectsForCurrentSemester();

  let totalWorks = 0;
  let doneWorks = 0;

  let totalExams = 0;
  let doneExams = 0;

  let totalLessons = 0;
  let doneLessons = 0;


  subjects.forEach(subject => {

    const works =
      subject.works || [];

    const exams =
      subject.exams || [];

    const lessons =
      subject.lessons || [];


    totalWorks +=
      works.length;

    doneWorks +=
      works.filter(
        work => work.done
      ).length;


    totalExams +=
      exams.length;

    doneExams +=
      exams.filter(
        exam => exam.done
      ).length;


    totalLessons +=
      lessons.length;

    doneLessons +=
      lessons.filter(
        lesson => lesson.done
      ).length;
  });


  return {

    subjectsCount:
      subjects.length,

    totalWorks,

    doneWorks,

    totalExams,

    doneExams,

    totalLessons,

    doneLessons

  };
}


function updateSummary() {

  const stats =
    computeSemesterStats();


  if (summarySubjectsEl) {

    summarySubjectsEl.textContent =
      stats.subjectsCount || "0";
  }


  if (summaryWorksEl) {

    summaryWorksEl.textContent =
      `${stats.doneWorks}/${stats.totalWorks}`;
  }


  if (summaryExamsEl) {

    summaryExamsEl.textContent =
      `${stats.doneExams}/${stats.totalExams}`;
  }


  const progress =
    stats.totalLessons
      ? Math.round(
          (
            stats.doneLessons /
            stats.totalLessons
          ) * 100
        )
      : 0;


  if (summaryLessonsEl) {

    summaryLessonsEl.textContent =
      `${progress}%`;
  }
}


function renderSemesterStatus() {

  if (!semesterStatusContainer) {
    return;
  }


  const stats =
    computeSemesterStats();


  const progressLessons =
    stats.totalLessons
      ? Math.round(
          (
            stats.doneLessons /
            stats.totalLessons
          ) * 100
        )
      : 0;


  const progressWorks =
    stats.totalWorks
      ? Math.round(
          (
            stats.doneWorks /
            stats.totalWorks
          ) * 100
        )
      : 0;


  const progressExams =
    stats.totalExams
      ? Math.round(
          (
            stats.doneExams /
            stats.totalExams
          ) * 100
        )
      : 0;


  semesterStatusContainer.innerHTML = `

    <div class="semester-status-row">

      <strong>
        Aulas estudadas:
      </strong>

      ${stats.doneLessons}/${stats.totalLessons}
      (${progressLessons}%)

      <div class="progress-bar-track">

        <div
          class="progress-bar-fill"
          style="
            width:${progressLessons}%;
          "
        >
        </div>

      </div>

    </div>


    <div class="semester-status-row">

      <strong>
        Trabalhos concluídos:
      </strong>

      ${stats.doneWorks}/${stats.totalWorks}
      (${progressWorks}%)

      <div class="progress-bar-track">

        <div
          class="progress-bar-fill"
          style="
            width:${progressWorks}%;
          "
        >
        </div>

      </div>

    </div>


    <div class="semester-status-row">

      <strong>
        Provas realizadas:
      </strong>

      ${stats.doneExams}/${stats.totalExams}
      (${progressExams}%)

      <div class="progress-bar-track">

        <div
          class="progress-bar-fill"
          style="
            width:${progressExams}%;
          "
        >
        </div>

      </div>

    </div>

  `;
}


// =====================================================
// CALENDÁRIO / CAPA
// =====================================================

const calendarBody =
  document.getElementById("calendarBody");

const calendarMonthLabel =
  document.getElementById("calendarMonthLabel");

const calendarSelectedInfo =
  document.getElementById("calendarSelectedInfo");

const prevMonthBtn =
  document.getElementById("prevMonthBtn");

const nextMonthBtn =
  document.getElementById("nextMonthBtn");

const holidayList =
  document.getElementById("holidayList");

const importantDatesList =
  document.getElementById("importantDatesList");

const timetableBody =
  document.getElementById("timetableBody");

const addImportantDateForm =
  document.getElementById("addImportantDateForm");

const importantDateInput =
  document.getElementById("importantDateInput");

const importantLabelInput =
  document.getElementById("importantLabelInput");

const addTimetableForm =
  document.getElementById("addTimetableForm");

const timetableDayInput =
  document.getElementById("timetableDayInput");

const timetableTimeInput =
  document.getElementById("timetableTimeInput");

const timetableSubjectInput =
  document.getElementById("timetableSubjectInput");

const upcomingList =
  document.getElementById("upcomingList");


let calendarYear;

let calendarMonth;

let selectedDate =
  null;


function initCalendar() {

  const today =
    new Date();

  calendarYear =
    today.getFullYear();

  calendarMonth =
    today.getMonth();

  renderCalendar();
}


function dateToIso(date) {

  const year =
    date.getFullYear();

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      "0"
    );

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      "0"
    );


  return (
    `${year}-${month}-${day}`
  );
}


// =====================================================
// FERIADOS DO BRASIL
// =====================================================

function easterDate(year) {

  const a =
    year % 19;

  const b =
    Math.floor(
      year / 100
    );

  const c =
    year % 100;

  const d =
    Math.floor(
      b / 4
    );

  const e =
    b % 4;

  const f =
    Math.floor(
      (b + 8) / 25
    );

  const g =
    Math.floor(
      (b - f + 1) / 3
    );

  const h =
    (
      19 * a +
      b -
      d -
      g +
      15
    ) % 30;

  const i =
    Math.floor(
      c / 4
    );

  const k =
    c % 4;

  const l =
    (
      32 +
      2 * e +
      2 * i -
      h -
      k
    ) % 7;

  const m =
    Math.floor(
      (
        a +
        11 * h +
        22 * l
      ) / 451
    );

  const month =
    Math.floor(
      (
        h +
        l -
        7 * m +
        114
      ) / 31
    ) - 1;

  const day =
    (
      (
        h +
        l -
        7 * m +
        114
      ) % 31
    ) + 1;


  return new Date(
    year,
    month,
    day
  );
}


function getBrazilHolidays(year) {

  const fixed = [

    {
      date:
        `${year}-01-01`,
      label:
        "Ano Novo"
    },

    {
      date:
        `${year}-04-21`,
      label:
        "Tiradentes"
    },

    {
      date:
        `${year}-05-01`,
      label:
        "Dia do Trabalhador"
    },

    {
      date:
        `${year}-09-07`,
      label:
        "Independência do Brasil"
    },

    {
      date:
        `${year}-10-12`,
      label:
        "Nossa Senhora Aparecida"
    },

    {
      date:
        `${year}-11-02`,
      label:
        "Finados"
    },

    {
      date:
        `${year}-11-15`,
      label:
        "Proclamação da República"
    },

    {
      date:
        `${year}-11-20`,
      label:
        "Dia da Consciência Negra"
    },

    {
      date:
        `${year}-12-25`,
      label:
        "Natal"
    }

  ];


  const easter =
    easterDate(year);


  const goodFriday =
    new Date(easter);

  goodFriday.setDate(
    easter.getDate() - 2
  );


  const carnival =
    new Date(easter);

  carnival.setDate(
    easter.getDate() - 47
  );


  const corpusChristi =
    new Date(easter);

  corpusChristi.setDate(
    easter.getDate() + 60
  );


  const movable = [

    {
      date:
        dateToIso(
          carnival
        ),
      label:
        "Carnaval"
    },

    {
      date:
        dateToIso(
          goodFriday
        ),
      label:
        "Sexta-feira Santa"
    },

    {
      date:
        dateToIso(
          easter
        ),
      label:
        "Páscoa"
    },

    {
      date:
        dateToIso(
          corpusChristi
        ),
      label:
        "Corpus Christi"
    }

  ];


  return [
    ...fixed,
    ...movable
  ].sort(
    (a, b) =>
      a.date.localeCompare(
        b.date
      )
  );
}


// =====================================================
// EVENTOS NO CALENDÁRIO
// =====================================================

function hasEventsOnDate(iso) {

  const year =
    Number(
      iso.slice(
        0,
        4
      )
    );


  const holidays =
    getBrazilHolidays(
      year
    );


  const hasHoliday =
    holidays.some(
      holiday =>
        holiday.date === iso
    );


  const important =
    getImportantDatesForCurrentSemester();


  const hasImportant =
    important.some(
      item =>
        item.date === iso
    );


  const subjects =
    getSubjectsForCurrentSemester();


  const works =
    subjects.flatMap(
      subject =>
        subject.works || []
    );


  const exams =
    subjects.flatMap(
      subject =>
        subject.exams || []
    );


  const hasWork =
    works.some(
      work =>
        work.dueDate === iso
    );


  const hasExam =
    exams.some(
      exam =>
        exam.date === iso
    );


  return (
    hasHoliday ||
    hasImportant ||
    hasWork ||
    hasExam
  );
}


// =====================================================
// DESENHAR CALENDÁRIO
// =====================================================

function renderCalendar() {

  if (
    !calendarBody ||
    calendarYear === undefined ||
    calendarMonth === undefined
  ) {
    return;
  }


  const firstDay =
    new Date(
      calendarYear,
      calendarMonth,
      1
    );


  const startDayOfWeek =
    firstDay.getDay();


  const daysInMonth =
    new Date(
      calendarYear,
      calendarMonth + 1,
      0
    ).getDate();


  const prevMonthDays =
    new Date(
      calendarYear,
      calendarMonth,
      0
    ).getDate();


  const monthNames = [

    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro"

  ];


  if (calendarMonthLabel) {

    calendarMonthLabel.textContent =
      `${monthNames[calendarMonth]} de ${calendarYear}`;
  }


  calendarBody.innerHTML =
    "";


  let day =
    1;

  let nextMonthDay =
    1;


  for (
    let week = 0;
    week < 6;
    week++
  ) {

    const tr =
      document.createElement(
        "tr"
      );


    for (
      let dow = 0;
      dow < 7;
      dow++
    ) {

      const td =
        document.createElement(
          "td"
        );


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "calendar-day";


      let displayDay;

      let dateObj;


      if (
        week === 0 &&
        dow < startDayOfWeek
      ) {

        displayDay =
          prevMonthDays -
          (
            startDayOfWeek -
            dow -
            1
          );


        dateObj =
          new Date(
            calendarYear,
            calendarMonth - 1,
            displayDay
          );


        div.classList.add(
          "other-month"
        );

      } else if (
        day >
        daysInMonth
      ) {

        displayDay =
          nextMonthDay++;


        dateObj =
          new Date(
            calendarYear,
            calendarMonth + 1,
            displayDay
          );


        div.classList.add(
          "other-month"
        );

      } else {

        displayDay =
          day++;


        dateObj =
          new Date(
            calendarYear,
            calendarMonth,
            displayDay
          );
      }


      div.textContent =
        displayDay;


      const iso =
        dateToIso(
          dateObj
        );


      div.dataset.date =
        iso;


      const todayIso =
        dateToIso(
          new Date()
        );


      if (
        iso === todayIso
      ) {

        div.classList.add(
          "today"
        );
      }


      if (
        hasEventsOnDate(
          iso
        )
      ) {

        div.classList.add(
          "has-event"
        );
      }


      div.addEventListener(
        "click",
        () => {

          selectedDate =
            iso;

          renderSelectedDateInfo();
        }
      );


      td.appendChild(
        div
      );


      tr.appendChild(
        td
      );
    }


    calendarBody.appendChild(
      tr
    );
  }


  renderSelectedDateInfo();

  renderHolidayList();
}


// =====================================================
// INFORMAÇÕES DO DIA SELECIONADO
// =====================================================

function renderSelectedDateInfo() {

  if (
    !calendarSelectedInfo
  ) {
    return;
  }


  if (!selectedDate) {

    calendarSelectedInfo.innerHTML =
      "<strong>Selecione um dia para ver detalhes.</strong>";

    return;
  }


  const parts =
    selectedDate.split(
      "-"
    );


  const formatted =
    `${parts[2]}/${parts[1]}/${parts[0]}`;


  const events =
    [];


  getBrazilHolidays(
    Number(
      selectedDate.slice(
        0,
        4
      )
    )
  ).forEach(
    holiday => {

      if (
        holiday.date ===
        selectedDate
      ) {

        events.push({

          type:
            "Feriado",

          label:
            holiday.label

        });
      }
    }
  );


  getImportantDatesForCurrentSemester()
    .forEach(
      item => {

        if (
          item.date ===
          selectedDate
        ) {

          events.push({

            type:
              "Importante",

            label:
              item.label

          });
        }
      }
    );


  getSubjectsForCurrentSemester()
    .forEach(
      subject => {

        (subject.works || [])
          .forEach(
            (work, index) => {

              if (
                work.dueDate ===
                selectedDate
              ) {

                events.push({

                  type:
                    "Trabalho",

                  label:
                    `${subject.name} - Trabalho ${index + 1}`

                });
              }
            }
          );


        (subject.exams || [])
          .forEach(
            (exam, index) => {

              if (
                exam.date ===
                selectedDate
              ) {

                events.push({

                  type:
                    "Prova",

                  label:
                    `${subject.name} - Prova ${index + 1}`

                });
              }
            }
          );
      }
    );


  if (
    events.length === 0
  ) {

    calendarSelectedInfo.innerHTML =
      `<strong>${formatted}</strong><br>Nenhum evento cadastrado.`;

    return;
  }


  const listItems =
    events
      .map(
        event => `

          <li>

            <strong>
              ${event.type}:
            </strong>

            ${event.label}

          </li>

        `
      )
      .join("");


  calendarSelectedInfo.innerHTML = `

    <strong>
      ${formatted}
    </strong>

    <ul>
      ${listItems}
    </ul>

  `;
}


// =====================================================
// NAVEGAÇÃO DOS MESES
// =====================================================

if (prevMonthBtn) {

  prevMonthBtn.addEventListener(
    "click",
    () => {

      if (
        calendarMonth === 0
      ) {

        calendarMonth =
          11;

        calendarYear--;

      } else {

        calendarMonth--;
      }


      renderCalendar();
    }
  );
}


if (nextMonthBtn) {

  nextMonthBtn.addEventListener(
    "click",
    () => {

      if (
        calendarMonth === 11
      ) {

        calendarMonth =
          0;

        calendarYear++;

      } else {

        calendarMonth++;
      }


      renderCalendar();
    }
  );
}


// =====================================================
// LISTA DE FERIADOS
// =====================================================

function renderHolidayList() {

  if (!holidayList) {
    return;
  }


  holidayList.innerHTML =
    "";


  const holidays =
    getBrazilHolidays(
      calendarYear
    );


  holidays.forEach(
    holiday => {

      const [
        ,
        month,
        day
      ] =
        holiday.date.split(
          "-"
        );


      const li =
        document.createElement(
          "li"
        );


      li.innerHTML = `

        <span class="date">
          ${day}/${month}
        </span>

        ${holiday.label}

      `;


      holidayList.appendChild(
        li
      );
    }
  );
}


// =====================================================
// DATAS IMPORTANTES
// =====================================================

function renderImportantDatesList() {

  if (
    !importantDatesList
  ) {
    return;
  }


  importantDatesList.innerHTML =
    "";


  const sorted =
    [
      ...getImportantDatesForCurrentSemester()
    ].sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );


  if (!sorted.length) {

    importantDatesList.innerHTML =
      "<li>Nenhuma data importante cadastrada.</li>";

    return;
  }


  sorted.forEach(
    item => {

      const li =
        document.createElement(
          "li"
        );


      const [
        ,
        month,
        day
      ] =
        item.date.split(
          "-"
        );


      const dateSpan =
        document.createElement(
          "span"
        );


      dateSpan.className =
        "date";


      dateSpan.textContent =
        `${day}/${month}`;


      const labelSpan =
        document.createElement(
          "span"
        );


      labelSpan.textContent =
        item.label;


      const deleteBtn =
        document.createElement(
          "button"
        );


      deleteBtn.type =
        "button";


      deleteBtn.className =
        "inline-delete-btn";


      deleteBtn.textContent =
        "Excluir";


      deleteBtn.addEventListener(
        "click",
        () => {

          const semesterKey =
            getSemesterKey();


          state
            .importantDatesBySemester[
              semesterKey
            ] =
            (
              state
                .importantDatesBySemester[
                  semesterKey
                ] || []
            ).filter(
              current =>
                !(
                  current.date ===
                    item.date &&
                  current.label ===
                    item.label
                )
            );


          saveState();

          renderImportantDatesList();

          renderUpcomingDeadlines();

          renderCalendar();
        }
      );


      li.appendChild(
        dateSpan
      );


      li.appendChild(
        labelSpan
      );


      li.appendChild(
        deleteBtn
      );


      importantDatesList.appendChild(
        li
      );
    }
  );
}


if (addImportantDateForm) {

  addImportantDateForm
    .addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const date =
          importantDateInput
            ? importantDateInput.value
            : "";


        const label =
          importantLabelInput
            ? importantLabelInput.value.trim()
            : "";


        if (
          !date ||
          !label
        ) {

          return;
        }


        const semesterKey =
          getSemesterKey();


        if (
          !state
            .importantDatesBySemester[
              semesterKey
            ]
        ) {

          state
            .importantDatesBySemester[
              semesterKey
            ] = [];
        }


        state
          .importantDatesBySemester[
            semesterKey
          ].push({

            date,

            label

          });


        saveState();


        importantDateInput.value =
          "";

        importantLabelInput.value =
          "";


        renderImportantDatesList();

        renderCalendar();

        renderUpcomingDeadlines();
      }
    );
}


// =====================================================
// HORÁRIO DAS AULAS
// =====================================================

function renderTimetable() {

  if (!timetableBody) {
    return;
  }


  timetableBody.innerHTML =
    "";


  const mapping = {

    monday:
      "Segunda",

    tuesday:
      "Terça",

    wednesday:
      "Quarta",

    thursday:
      "Quinta",

    friday:
      "Sexta"

  };


  const table =
    getTimetableForCurrentSemester();


  Object.keys(
    mapping
  ).forEach(
    key => {

      const dayName =
        mapping[key];


      const slots =
        table[key] || [];


      if (
        !slots.length
      ) {

        return;
      }


      slots.forEach(
        (slot, index) => {

          const tr =
            document.createElement(
              "tr"
            );


          const dayTd =
            document.createElement(
              "td"
            );


          dayTd.textContent =
            index === 0
              ? dayName
              : "";


          const timeTd =
            document.createElement(
              "td"
            );


          timeTd.textContent =
            slot.time;


          const subjectTd =
            document.createElement(
              "td"
            );


          const subjectSpan =
            document.createElement(
              "span"
            );


          subjectSpan.textContent =
            slot.subject;


          const deleteBtn =
            document.createElement(
              "button"
            );


          deleteBtn.type =
            "button";


          deleteBtn.className =
            "inline-delete-btn";


          deleteBtn.textContent =
            "Excluir";


          deleteBtn.addEventListener(
            "click",
            () => {

              const updated =
                getTimetableForCurrentSemester();


              updated[key].splice(
                index,
                1
              );


              setTimetableForCurrentSemester(
                updated
              );


              saveState();

              renderTimetable();
            }
          );


          subjectTd.appendChild(
            subjectSpan
          );


          subjectTd.appendChild(
            deleteBtn
          );


          tr.appendChild(
            dayTd
          );


          tr.appendChild(
            timeTd
          );


          tr.appendChild(
            subjectTd
          );


          timetableBody.appendChild(
            tr
          );
        }
      );
    }
  );


  if (
    !timetableBody.hasChildNodes()
  ) {

    const tr =
      document.createElement(
        "tr"
      );


    const td =
      document.createElement(
        "td"
      );


    td.colSpan =
      3;


    td.textContent =
      "Nenhum horário cadastrado.";


    tr.appendChild(
      td
    );


    timetableBody.appendChild(
      tr
    );
  }
}


if (addTimetableForm) {

  addTimetableForm
    .addEventListener(
      "submit",
      event => {

        event.preventDefault();


        const dayKey =
          timetableDayInput
            ? timetableDayInput.value
            : "";


        const time =
          timetableTimeInput
            ? timetableTimeInput.value.trim()
            : "";


        const subject =
          timetableSubjectInput
            ? timetableSubjectInput.value.trim()
            : "";


        if (
          !dayKey ||
          !time ||
          !subject
        ) {

          return;
        }


        const updated =
          getTimetableForCurrentSemester();


        updated[
          dayKey
        ].push({

          time,

          subject

        });


        setTimetableForCurrentSemester(
          updated
        );


        saveState();


        timetableDayInput.value =
          "";

        timetableTimeInput.value =
          "";

        timetableSubjectInput.value =
          "";


        renderTimetable();
      }
    );
}


// =====================================================
// PRÓXIMOS PRAZOS
// =====================================================

function renderUpcomingDeadlines() {

  if (!upcomingList) {
    return;
  }


  upcomingList.innerHTML =
    "";


  const items =
    [];


  const todayIso =
    dateToIso(
      new Date()
    );


  getImportantDatesForCurrentSemester()
    .forEach(
      item => {

        if (
          item.date >=
          todayIso
        ) {

          items.push({

            date:
              item.date,

            label:
              item.label,

            type:
              "Importante"

          });
        }
      }
    );


  getSubjectsForCurrentSemester()
    .forEach(
      subject => {

        (subject.works || [])
          .forEach(
            (work, index) => {

              if (
                work.dueDate &&
                work.dueDate >=
                  todayIso
              ) {

                items.push({

                  date:
                    work.dueDate,

                  label:
                    `${subject.name} - Trabalho ${index + 1}`,

                  type:
                    "Trabalho"

                });
              }
            }
          );


        (subject.exams || [])
          .forEach(
            (exam, index) => {

              if (
                exam.date &&
                exam.date >=
                  todayIso
              ) {

                items.push({

                  date:
                    exam.date,

                  label:
                    `${subject.name} - Prova ${index + 1}`,

                  type:
                    "Prova"

                });
              }
            }
          );
      }
    );


  items.sort(
    (a, b) =>
      a.date.localeCompare(
        b.date
      )
  );


  const limited =
    items.slice(
      0,
      8
    );


  if (
    !limited.length
  ) {

    upcomingList.innerHTML =
      "<li>Nenhum prazo cadastrado a partir de hoje.</li>";

    return;
  }


  limited.forEach(
    item => {

      const [
        ,
        month,
        day
      ] =
        item.date.split(
          "-"
        );


      const li =
        document.createElement(
          "li"
        );


      li.innerHTML = `

        <span class="date">
          ${day}/${month}
        </span>

        <strong>
          ${item.type}:
        </strong>

        ${item.label}

      `;


      upcomingList.appendChild(
        li
      );
    }
  );
}


// =====================================================
// NOTAS
// =====================================================

const gradesContainer =
  document.getElementById("gradesContainer");


function toNumber(value) {

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {

    return 0;
  }


  const number =
    Number(
      String(value)
        .replace(
          ",",
          "."
        )
    );


  return isNaN(number)
    ? 0
    : number;
}


// =====================================================
// CÁLCULO DA MÉDIA
// =====================================================

function isGradeFilled(value) {
  return (
    value !== null &&
    value !== undefined &&
    String(value).trim() !== ""
  );
}


// =====================================================
// MODELO DE NOTAS FLEXÍVEL
// A média é feita por PERÍODOS (partes, bimestres, trimestres…).
// Cada período tem um peso e uma ou mais avaliações.
//   combine "soma":  nota do período = soma das avaliações (ex.: trabalho + prova = 10)
//   combine "media": nota do período = média das avaliações
// Média final = soma(nota do período × peso) ÷ soma dos pesos
// =====================================================

const GRADE_PRESETS = {
  faculdade: {
    name: "Faculdade · 2 partes (trabalho + prova)",
    periods: [
      { id: "part1", name: "Parte 1", weight: 2, combine: "soma",
        items: [{ id: "t1", name: "Trabalho 1" }, { id: "p1", name: "Prova 1" }] },
      { id: "part2", name: "Parte 2", weight: 3, combine: "soma",
        items: [{ id: "t2", name: "Trabalho 2" }, { id: "p2", name: "Prova 2" }] }
    ]
  },
  bimestral: {
    name: "Escola · 4 bimestres",
    periods: [1, 2, 3, 4].map(n => ({
      id: `b${n}`, name: `${n}º bimestre`, weight: 1, combine: "media",
      items: [{ id: `b${n}_1`, name: "Nota" }]
    }))
  },
  trimestral: {
    name: "Escola · 3 trimestres",
    periods: [1, 2, 3].map(n => ({
      id: `tr${n}`, name: `${n}º trimestre`, weight: 1, combine: "media",
      items: [{ id: `tr${n}_1`, name: "Nota" }]
    }))
  },
  semestral: {
    name: "2 semestres / 2 etapas",
    periods: [1, 2].map(n => ({
      id: `s${n}`, name: `${n}º semestre`, weight: 1, combine: "media",
      items: [{ id: `s${n}_1`, name: "Nota" }]
    }))
  }
};

function clonePeriods(periods) {
  return JSON.parse(JSON.stringify(periods));
}

function sanitizePeriods(periods) {
  if (!Array.isArray(periods)) return null;
  const usedIds = new Set();
  const clean = periods
    .filter(p => p && Array.isArray(p.items))
    .map((p, pi) => {
      const items = p.items
        .filter(it => it && String(it.id || "").trim())
        .map(it => ({ id: String(it.id), name: String(it.name || "Avaliação").slice(0, 40) }))
        .filter(it => !usedIds.has(it.id) && usedIds.add(it.id));
      const weight = Number(p.weight);
      return {
        id: String(p.id || `per${pi + 1}`),
        name: String(p.name || `Período ${pi + 1}`).slice(0, 40),
        weight: weight >= 0 ? weight : 1,
        combine: p.combine === "soma" ? "soma" : "media",
        items
      };
    })
    .filter(p => p.items.length);
  return clean.length ? clean : null;
}

function getGradeConfig() {
  const cfg = state.gradeConfig || {};
  const passingGrade = Number(cfg.passingGrade);

  let periods = sanitizePeriods(cfg.periods);

  // configuração antiga (só pesos 1 e 2) → modelo faculdade com os pesos dela
  if (!periods) {
    periods = clonePeriods(GRADE_PRESETS.faculdade.periods);
    const w1 = Number(cfg.weight1);
    const w2 = Number(cfg.weight2);
    if (w1 >= 0) periods[0].weight = w1;
    if (w2 > 0) periods[1].weight = w2;
  }

  return {
    preset: cfg.preset || "faculdade",
    periods,
    passingGrade: passingGrade >= 0 && passingGrade <= 10 ? passingGrade : 6
  };
}

function getAllGradeItems() {
  return getGradeConfig().periods.flatMap(p => p.items);
}

function formatGrade(value) {
  return Number(value)
    .toFixed(2)
    .replace(".", ",");
}

function fmtNumber(n) {
  return String(Math.round(Number(n) * 100) / 100).replace(".", ",");
}

function getFormulaText() {
  const { periods, passingGrade } = getGradeConfig();
  const totalWeight = periods.reduce((s, p) => s + p.weight, 0);
  const allEqual = periods.every(p => p.weight === periods[0].weight);

  const partText = p => {
    const names = p.items.map(i => i.name);
    if (names.length === 1) return names[0] === "Nota" ? p.name : `${p.name} (${names[0]})`;
    return p.combine === "soma"
      ? `(${names.join(" + ")})`
      : `média de ${p.name} (${names.join(", ")})`;
  };

  let text;
  if (allEqual) {
    text = `Média simples de ${periods.map(partText).join(", ")}`;
  } else {
    text = periods.map(p => `${partText(p)} × ${fmtNumber(p.weight)}`).join(" + ") +
      `, tudo dividido por ${fmtNumber(totalWeight)}`;
  }

  return `${text}. Média para passar: ${fmtNumber(passingGrade)}.`;
}

// nota de um período; null se nada lançado nele
function periodGrade(period, grades) {
  const filled = period.items.filter(it => isGradeFilled(grades[it.id]));
  if (!filled.length) return null;
  const sum = filled.reduce((s, it) => s + toNumber(grades[it.id]), 0);
  if (period.combine === "soma") return sum;
  return sum / filled.length;
}

function isPeriodComplete(period, grades) {
  return period.items.every(it => isGradeFilled(grades[it.id]));
}

// Média com o que já foi lançado (só períodos que têm nota).
// Retorna null quando nenhuma nota foi lançada.
function computeFinalGrade(grades) {
  if (!grades) return null;

  const { periods } = getGradeConfig();
  let weighted = 0;
  let weights = 0;

  periods.forEach(p => {
    const g = periodGrade(p, grades);
    if (g === null) return;
    weighted += g * p.weight;
    weights += p.weight;
  });

  if (!weights) {
    // períodos com peso 0 e nota lançada
    return periods.some(p => periodGrade(p, grades) !== null) ? 0 : null;
  }

  const result = weighted / weights;
  return isNaN(result) ? null : result;
}

function isGradeComplete(grades) {
  return (
    !!grades &&
    getGradeConfig().periods.every(p => isPeriodComplete(p, grades))
  );
}

// Situação da matéria e quanto falta para passar.
function getGradeStatus(grades) {
  grades = grades || {};

  const { periods, passingGrade } = getGradeConfig();
  const final = computeFinalGrade(grades);
  const passText = fmtNumber(passingGrade);

  if (final === null) {
    return { final: null, label: "Sem notas", kind: "empty", hint: "", complete: false };
  }

  const totalWeight = periods.reduce((s, p) => s + p.weight, 0);
  const target = passingGrade * totalWeight;

  if (isGradeComplete(grades)) {
    const ok = final >= passingGrade - 1e-9;
    return {
      final,
      complete: true,
      kind: ok ? "ok" : "bad",
      label: ok ? "Aprovado(a)" : "Abaixo da média",
      hint: ok ? "" : `Faltaram ${formatGrade(passingGrade - final)} pontos para a média ${passText}.`
    };
  }

  const done = periods.filter(p => isPeriodComplete(p, grades));
  const open = periods.filter(p => !isPeriodComplete(p, grades));
  const doneWeighted = done.reduce((s, p) => s + periodGrade(p, grades) * p.weight, 0);

  if (!done.length) {
    const first = open[0];
    return {
      final,
      complete: false,
      kind: "partial",
      label: "Parcial",
      hint: `Complete ${first.name} (${first.items.map(i => i.name).join(", ")}) para ver quanto precisa no restante.`
    };
  }

  const openWeight = open.reduce((s, p) => s + p.weight, 0);

  // períodos que faltam não contam (peso 0): resultado já está definido
  if (!openWeight) {
    const ok = doneWeighted / totalWeight >= passingGrade - 1e-9;
    return { final, complete: false, kind: ok ? "ok" : "bad", label: ok ? "Média garantida" : "Atenção", hint: "" };
  }

  // nota média necessária nos períodos que faltam
  const neededPeriod = (target - doneWeighted) / openWeight;

  if (neededPeriod <= 0) {
    return {
      final, complete: false, kind: "ok", label: "Média garantida",
      hint: "Mesmo tirando 0 no que falta, você já passa. 🎉"
    };
  }

  if (neededPeriod > 10 + 1e-9) {
    return {
      final, complete: false, kind: "bad", label: "Atenção",
      hint: `Seria preciso ${formatGrade(neededPeriod)} no que falta, acima do máximo de 10. Converse com o(a) professor(a) sobre recuperação.`
    };
  }

  // só um período aberto: dá para dizer exatamente o que falta nele
  let hint;
  if (open.length === 1) {
    const p = open[0];
    const missing = p.items.filter(it => !isGradeFilled(grades[it.id]));
    const known = p.items.filter(it => isGradeFilled(grades[it.id]));
    const knownSum = known.reduce((s, it) => s + toNumber(grades[it.id]), 0);

    let need;
    if (p.combine === "soma") {
      need = neededPeriod - knownSum;
    } else {
      need = (neededPeriod * p.items.length - knownSum) / missing.length;
    }

    const what =
      p.items.length === 1
        ? `no ${p.name}`.replace(/^no (Parte|Etapa|Avalia)/, "na $1")
        : missing.length === 1
        ? `em ${missing[0].name}`
        : p.combine === "soma"
          ? `em ${p.name} (${missing.map(i => i.name).join(" + ")} somados)`
          : `de média em ${p.name} (${missing.map(i => i.name).join(", ")})`;

    if (need <= 0) {
      return {
        final, complete: false, kind: "ok", label: "Média garantida",
        hint: "Mesmo tirando 0 no que falta, você já passa. 🎉"
      };
    }

    hint = `Você precisa de ${formatGrade(need)} ${what} para chegar à média ${passText}.`;
  } else {
    hint = `Você precisa de média ${formatGrade(neededPeriod)} em ${open.map(p => p.name).join(", ")} para chegar à média ${passText}.`;
  }

  return { final, complete: false, kind: "partial", label: "Parcial", hint };
}


function renderGrades() {

  syncGradeFilterOptions();


  if (!gradesContainer) {
    return;
  }


  gradesContainer.innerHTML =
    "";


  const subjects =
    getSubjectsForCurrentSemester();


  const selectedPart =
    gradeFilterPart
      ? gradeFilterPart.value
      : "all";


  if (
    !subjects.length
  ) {

    gradesContainer.innerHTML =
      "<p>Nenhuma matéria cadastrada para este semestre.</p>";

    return;
  }


  subjects.forEach(
    subject => {

      if (!subject.grades) {
        subject.grades = {};
      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "subject-card";


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "subject-card-header";


      const nameSpan =
        document.createElement(
          "div"
        );


      nameSpan.className =
        "subject-name";


      nameSpan.textContent =
        subject.name;


      const badge =
        document.createElement(
          "span"
        );


      badge.className =
        "badge badge-semester";


      badge.textContent =
        `${subject.semester}º sem.`;


      header.appendChild(
        nameSpan
      );


      header.appendChild(
        badge
      );


      const gradesGrid =
        document.createElement(
          "div"
        );


      gradesGrid.className =
        "grades-grid";


      const gradePeriods =
        getGradeConfig().periods;

      const fields =
        gradePeriods.flatMap(period =>
          period.items.map((item, index) => ({
            key: item.id,
            label:
              period.items.length === 1
                ? (item.name === "Nota" ? period.name : `${period.name} · ${item.name}`)
                : item.name,
            part: period.id,
            periodName: period.name,
            periodWeight: period.weight,
            periodCombine: period.combine,
            periodSize: period.items.length,
            firstOfPeriod: index === 0
          }))
        );


      fields.forEach(
        field => {

          if (
            selectedPart !==
              "all" &&
            selectedPart !==
              field.part
          ) {

            return;
          }

          // título de cada período (Parte 1, 1º bimestre…)
          if (field.firstOfPeriod && gradePeriods.length > 1 && field.periodSize > 1) {
            const periodTitle = document.createElement("div");
            periodTitle.className = "grade-period-title";
            periodTitle.textContent =
              field.periodName +
              (gradePeriods.some(p => p.weight !== gradePeriods[0].weight)
                ? ` · peso ${fmtNumber(field.periodWeight)}`
                : "") +
              (field.periodCombine === "soma" && field.periodSize > 1
                ? " · as notas somam até 10"
                : "");
            gradesGrid.appendChild(periodTitle);
          }


          const fieldDiv =
            document.createElement(
              "div"
            );


          fieldDiv.className =
            "grade-field";


          const label =
            document.createElement(
              "label"
            );


          label.textContent =
            field.label;


          const input =
            document.createElement(
              "input"
            );


          input.type =
            "number";

          input.step =
            "0.1";

          input.min =
            "0";

          input.max =
            "10";


          input.value =
            subject
              .grades[
                field.key
              ] ?? "";


          input.addEventListener(
            "input",
            () => {

              subject
                .grades[
                  field.key
                ] =
                input.value;


              saveState();

              updateFinal();

              updateSummary();

              renderSemesterStatus();
            }
          );


          fieldDiv.appendChild(
            label
          );


          fieldDiv.appendChild(
            input
          );


          gradesGrid.appendChild(
            fieldDiv
          );
        }
      );


      const finalDiv =
        document.createElement(
          "div"
        );

      finalDiv.className =
        "final-grade";

      const updateFinal = () => {
        const info = getGradeStatus(subject.grades);

        finalDiv.innerHTML = "";

        const line = document.createElement("div");
        line.className = "final-grade-line";

        const value = document.createElement("span");
        value.textContent =
          `${info.complete || info.final === null ? "Média final" : "Média até agora"}: ${info.final === null ? "—" : formatGrade(info.final)}`;
        line.appendChild(value);

        if (info.kind !== "empty") {
          const statusBadge = document.createElement("span");
          statusBadge.className =
            "badge " +
            (info.kind === "ok"
              ? "badge-status-ok"
              : info.kind === "bad"
                ? "badge-status-bad"
                : "badge-status-partial");
          statusBadge.textContent = info.label;
          line.appendChild(statusBadge);
        }

        finalDiv.appendChild(line);

        if (info.hint) {
          const hint = document.createElement("p");
          hint.className = "grade-hint";
          hint.textContent = info.hint;
          finalDiv.appendChild(hint);
        }
      };

      updateFinal();


      card.appendChild(
        header
      );


      card.appendChild(
        gradesGrid
      );


      card.appendChild(
        finalDiv
      );


      gradesContainer.appendChild(
        card
      );
    }
  );
}


// =====================================================
// DIFICULDADE DOS TRABALHOS
// =====================================================

function applyDifficultyClass(
  selectElement,
  difficulty
) {

  selectElement.classList.remove(
    "difficulty-facil",
    "difficulty-medio",
    "difficulty-dificil"
  );


  if (
    difficulty ===
    "facil"
  ) {

    selectElement.classList.add(
      "difficulty-facil"
    );

  } else if (
    difficulty ===
    "medio"
  ) {

    selectElement.classList.add(
      "difficulty-medio"
    );

  } else if (
    difficulty ===
    "dificil"
  ) {

    selectElement.classList.add(
      "difficulty-dificil"
    );
  }
}


// =====================================================
// TRABALHOS
// =====================================================

const worksPageContainer =
  document.getElementById("worksPageContainer");

const workFilterIndex =
  document.getElementById("workFilterIndex");

const workFilterDifficulty =
  document.getElementById("workFilterDifficulty");

const workFilterProgress =
  document.getElementById("workFilterProgress");

const workFilterDone =
  document.getElementById("workFilterDone");

const workFilterDelivered =
  document.getElementById("workFilterDelivered");


function getWorkFilters() {

  return {

    index:
      workFilterIndex
        ? workFilterIndex.value
        : "all",

    difficulty:
      workFilterDifficulty
        ? workFilterDifficulty.value
        : "all",

    progress:
      workFilterProgress
        ? workFilterProgress.value
        : "all",

    done:
      workFilterDone
        ? workFilterDone.value
        : "all",

    delivered:
      workFilterDelivered
        ? workFilterDelivered.value
        : "all"

  };
}


[
  workFilterIndex,
  workFilterDifficulty,
  workFilterProgress,
  workFilterDone,
  workFilterDelivered

]
  .filter(Boolean)
  .forEach(
    element => {

      element.addEventListener(
        "change",
        () => {

          renderWorksPage();
        }
      );
    }
  );


function renderWorksPage() {

  if (!worksPageContainer) {
    return;
  }


  worksPageContainer.innerHTML =
    "";


  const subjects =
    getSubjectsForCurrentSemester();


  if (
    !subjects.length
  ) {

    worksPageContainer.innerHTML =
      "<p>Nenhuma matéria cadastrada para este semestre.</p>";

    return;
  }


  const filters =
    getWorkFilters();


  subjects.forEach(
    subject => {

      if (!subject.works) {

        subject.works =
          [];
      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "subject-card";


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "subject-card-header";


      const nameSpan =
        document.createElement(
          "div"
        );


      nameSpan.className =
        "subject-name";


      nameSpan.textContent =
        subject.name;


      const badge =
        document.createElement(
          "span"
        );


      badge.className =
        "badge badge-semester";


      badge.textContent =
        `${subject.semester}º sem.`;


      header.appendChild(
        nameSpan
      );


      header.appendChild(
        badge
      );


      const blocks =
        document.createElement(
          "div"
        );


      blocks.className =
        "two-columns";


      subject.works.forEach(
        (work, index) => {

          if (
            !work.difficulty
          ) {

            work.difficulty =
              "medio";
          }


          if (
            work.delivered ===
            undefined
          ) {

            work.delivered =
              false;
          }


          if (
            work.inProgress ===
            undefined
          ) {

            work.inProgress =
              false;
          }


          if (
            filters.index !==
              "all" &&
            Number(
              filters.index
            ) !== index
          ) {

            return;
          }


          if (
            filters.difficulty !==
              "all" &&
            filters.difficulty !==
              work.difficulty
          ) {

            return;
          }


          if (
            filters.progress ===
              "progress" &&
            !work.inProgress
          ) {

            return;
          }


          if (
            filters.progress ===
              "not" &&
            work.inProgress
          ) {

            return;
          }


          if (
            filters.done ===
              "done" &&
            !work.done
          ) {

            return;
          }


          if (
            filters.done ===
              "not" &&
            work.done
          ) {

            return;
          }


          if (
            filters.delivered ===
              "delivered" &&
            !work.delivered
          ) {

            return;
          }


          if (
            filters.delivered ===
              "not" &&
            work.delivered
          ) {

            return;
          }


          const block =
            document.createElement(
              "div"
            );


          block.className =
            "work-block";


          const title =
            document.createElement(
              "h3"
            );


          title.textContent =
            `Trabalho ${index + 1}`;


          const textarea =
            document.createElement(
              "textarea"
            );


          textarea.className =
            "textarea-small";


          textarea.placeholder =
            "O que o professor pediu?";


          textarea.value =
            work.description || "";


          textarea.addEventListener(
            "input",
            () => {

              work.description =
                textarea.value;


              saveState();
            }
          );


          const smallRow =
            document.createElement(
              "div"
            );


          smallRow.className =
            "small-row";


          const dateInput =
            document.createElement(
              "input"
            );


          dateInput.type =
            "date";


          dateInput.value =
            work.dueDate || "";


          dateInput.addEventListener(
            "change",
            () => {

              work.dueDate =
                dateInput.value ||
                null;


              saveState();

              renderCalendar();

              renderUpcomingDeadlines();
            }
          );


          const difficultySelect =
            document.createElement(
              "select"
            );


          difficultySelect.className =
            "difficulty-select";


          [

            {
              value:
                "facil",
              label:
                "Fácil"
            },

            {
              value:
                "medio",
              label:
                "Médio"
            },

            {
              value:
                "dificil",
              label:
                "Difícil"
            }

          ].forEach(
            difficulty => {

              const option =
                document.createElement(
                  "option"
                );


              option.value =
                difficulty.value;


              option.textContent =
                difficulty.label;


              difficultySelect.appendChild(
                option
              );
            }
          );


          difficultySelect.value =
            work.difficulty ||
            "medio";


          applyDifficultyClass(
            difficultySelect,
            difficultySelect.value
          );


          difficultySelect.addEventListener(
            "change",
            () => {

              work.difficulty =
                difficultySelect.value;


              applyDifficultyClass(
                difficultySelect,
                difficultySelect.value
              );


              saveState();
            }
          );


          const progressLabel =
            document.createElement(
              "label"
            );


          progressLabel.className =
            "checkbox-label checkbox-progress";


          const progressCheckbox =
            document.createElement(
              "input"
            );


          progressCheckbox.type =
            "checkbox";


          progressCheckbox.checked =
            Boolean(
              work.inProgress
            );


          const progressSpan =
            document.createElement(
              "span"
            );


          progressSpan.textContent =
            "Em andamento";


          progressLabel.appendChild(
            progressCheckbox
          );


          progressLabel.appendChild(
            progressSpan
          );


          const doneLabel =
            document.createElement(
              "label"
            );


          doneLabel.className =
            "checkbox-label";


          const doneCheckbox =
            document.createElement(
              "input"
            );


          doneCheckbox.type =
            "checkbox";


          doneCheckbox.checked =
            Boolean(
              work.done
            );


          progressCheckbox.addEventListener(
            "change",
            () => {

              work.inProgress =
                progressCheckbox.checked;


              if (
                progressCheckbox.checked
              ) {

                work.done =
                  false;

                doneCheckbox.checked =
                  false;
              }


              saveState();

              updateSummary();

              renderSemesterStatus();
            }
          );


          doneCheckbox.addEventListener(
            "change",
            () => {

              work.done =
                doneCheckbox.checked;


              if (
                doneCheckbox.checked
              ) {

                work.inProgress =
                  false;

                progressCheckbox.checked =
                  false;
              }


              saveState();

              updateSummary();

              renderSemesterStatus();
            }
          );


          const doneSpan =
            document.createElement(
              "span"
            );


          doneSpan.textContent =
            "Concluído";


          doneLabel.appendChild(
            doneCheckbox
          );


          doneLabel.appendChild(
            doneSpan
          );


          const deliveredLabel =
            document.createElement(
              "label"
            );


          deliveredLabel.className =
            "checkbox-label";


          const deliveredCheckbox =
            document.createElement(
              "input"
            );


          deliveredCheckbox.type =
            "checkbox";


          deliveredCheckbox.checked =
            Boolean(
              work.delivered
            );


          deliveredCheckbox.addEventListener(
            "change",
            () => {

              work.delivered =
                deliveredCheckbox.checked;


              saveState();
            }
          );


          const deliveredSpan =
            document.createElement(
              "span"
            );


          deliveredSpan.textContent =
            "Entregue";


          deliveredLabel.appendChild(
            deliveredCheckbox
          );


          deliveredLabel.appendChild(
            deliveredSpan
          );


          smallRow.appendChild(
            dateInput
          );


          smallRow.appendChild(
            difficultySelect
          );


          smallRow.appendChild(
            progressLabel
          );


          smallRow.appendChild(
            doneLabel
          );


          smallRow.appendChild(
            deliveredLabel
          );


          block.appendChild(
            title
          );


          block.appendChild(
            textarea
          );


          block.appendChild(
            smallRow
          );


          blocks.appendChild(
            block
          );
        }
      );


      if (
        blocks.hasChildNodes()
      ) {

        card.appendChild(
          header
        );


        card.appendChild(
          blocks
        );


        worksPageContainer.appendChild(
          card
        );
      }
    }
  );


  if (
    !worksPageContainer.hasChildNodes()
  ) {

    worksPageContainer.innerHTML =
      "<p>Nenhum trabalho encontrado com os filtros selecionados.</p>";
  }
}


// =====================================================
// PROVAS
// =====================================================

const examsPageContainer =
  document.getElementById("examsPageContainer");


function populateExamSubjectFilter() {

  if (
    !examFilterSubject
  ) {

    return;
  }


  const subjects =
    getSubjectsForCurrentSemester();


  const previousValue =
    examFilterSubject.value ||
    "all";


  examFilterSubject.innerHTML =
    "";


  const allOption =
    document.createElement(
      "option"
    );


  allOption.value =
    "all";


  allOption.textContent =
    "Todas as matérias";


  examFilterSubject.appendChild(
    allOption
  );


  subjects.forEach(
    subject => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        subject.id;


      option.textContent =
        subject.name;


      examFilterSubject.appendChild(
        option
      );
    }
  );


  const stillExists =
    [
      ...examFilterSubject.options
    ].some(
      option =>
        option.value ===
        previousValue
    );


  examFilterSubject.value =
    stillExists
      ? previousValue
      : "all";
}


function renderExamsPage() {

  if (
    !examsPageContainer
  ) {

    return;
  }


  examsPageContainer.innerHTML =
    "";


  const subjects =
    getSubjectsForCurrentSemester();


  const selectedSubjectId =
    examFilterSubject
      ? examFilterSubject.value
      : "all";


  const selectedStatus =
    examFilterStatus
      ? examFilterStatus.value
      : "all";


  if (
    !subjects.length
  ) {

    examsPageContainer.innerHTML =
      "<p>Nenhuma matéria cadastrada para este semestre.</p>";

    return;
  }


  subjects.forEach(
    subject => {

      if (
        selectedSubjectId !==
          "all" &&
        subject.id !==
          selectedSubjectId
      ) {

        return;
      }


      const exams =
        subject.exams || [];


      const filteredExams =
        exams.filter(
          exam => {

            if (
              selectedStatus ===
              "done"
            ) {

              return Boolean(
                exam.done
              );
            }


            if (
              selectedStatus ===
              "not"
            ) {

              return !exam.done;
            }


            return true;
          }
        );


      if (
        !filteredExams.length
      ) {

        return;
      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "subject-card";


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "subject-card-header";


      const nameSpan =
        document.createElement(
          "div"
        );


      nameSpan.className =
        "subject-name";


      nameSpan.textContent =
        subject.name;


      const badge =
        document.createElement(
          "span"
        );


      badge.className =
        "badge badge-semester";


      badge.textContent =
        `${subject.semester}º sem.`;


      header.appendChild(
        nameSpan
      );


      header.appendChild(
        badge
      );


      const blocks =
        document.createElement(
          "div"
        );


      blocks.className =
        "two-columns";


      exams.forEach(
        (exam, index) => {

          if (
            selectedStatus ===
              "done" &&
            !exam.done
          ) {

            return;
          }


          if (
            selectedStatus ===
              "not" &&
            exam.done
          ) {

            return;
          }


          const block =
            document.createElement(
              "div"
            );


          block.className =
            "exam-block";


          const title =
            document.createElement(
              "h3"
            );


          title.textContent =
            `Prova ${index + 1}`;


          const textarea =
            document.createElement(
              "textarea"
            );


          textarea.className =
            "textarea-small";


          textarea.placeholder =
            "Conteúdo da prova";


          textarea.value =
            exam.description || "";


          textarea.addEventListener(
            "input",
            () => {

              exam.description =
                textarea.value;


              saveState();
            }
          );


          const smallRow =
            document.createElement(
              "div"
            );


          smallRow.className =
            "small-row";


          const dateInput =
            document.createElement(
              "input"
            );


          dateInput.type =
            "date";


          dateInput.value =
            exam.date || "";


          dateInput.addEventListener(
            "change",
            () => {

              exam.date =
                dateInput.value ||
                null;


              saveState();

              renderCalendar();

              renderUpcomingDeadlines();
            }
          );


          const checkboxLabel =
            document.createElement(
              "label"
            );


          checkboxLabel.className =
            "checkbox-label";


          const checkbox =
            document.createElement(
              "input"
            );


          checkbox.type =
            "checkbox";


          checkbox.checked =
            Boolean(
              exam.done
            );


          checkbox.addEventListener(
            "change",
            () => {

              exam.done =
                checkbox.checked;


              saveState();

              updateSummary();

              renderSemesterStatus();

              renderExamsPage();
            }
          );


          const span =
            document.createElement(
              "span"
            );


          span.textContent =
            "Realizada";


          checkboxLabel.appendChild(
            checkbox
          );


          checkboxLabel.appendChild(
            span
          );


          smallRow.appendChild(
            dateInput
          );


          smallRow.appendChild(
            checkboxLabel
          );


          block.appendChild(
            title
          );


          block.appendChild(
            textarea
          );


          block.appendChild(
            smallRow
          );


          blocks.appendChild(
            block
          );
        }
      );


      if (
        blocks.hasChildNodes()
      ) {

        card.appendChild(
          header
        );


        card.appendChild(
          blocks
        );


        examsPageContainer.appendChild(
          card
        );
      }
    }
  );


  if (
    !examsPageContainer.hasChildNodes()
  ) {

    examsPageContainer.innerHTML =
      "<p>Nenhuma prova encontrada com os filtros selecionados.</p>";
  }
}


// =====================================================
// MATÉRIAS / AULAS
// =====================================================

const addSubjectForm =
  document.getElementById("addSubjectForm");

const subjectNameInput =
  document.getElementById("subjectNameInput");

const subjectSemesterInput =
  document.getElementById("subjectSemesterInput");

const subjectsManager =
  document.getElementById("subjectsManager");


if (addSubjectForm) {

  addSubjectForm.addEventListener(
    "submit",
    event => {

      event.preventDefault();


      const name =
        subjectNameInput
          ? subjectNameInput.value.trim()
          : "";


      const semester =
        subjectSemesterInput
          ? Number(
              subjectSemesterInput.value
            )
          : 0;


      if (
        !name ||
        !semester
      ) {

        return;
      }


      const id =
        name
          .toLowerCase()
          .normalize("NFD")
          .replace(
            /[\u0300-\u036f]/g,
            ""
          )
          .replace(
            /[^a-z0-9]+/g,
            "_"
          ) +
        "_" +
        Date.now();


      state.subjects.push({

        id,

        name,

        semester,

        grades: {

          t1:
            null,

          p1:
            null,

          t2:
            null,

          p2:
            null

        },

        works: [

          {
            id:
              id + "_w1",

            description:
              "",

            done:
              false,

            inProgress:
              false,

            delivered:
              false,

            difficulty:
              "medio",

            dueDate:
              null
          },

          {
            id:
              id + "_w2",

            description:
              "",

            done:
              false,

            inProgress:
              false,

            delivered:
              false,

            difficulty:
              "medio",

            dueDate:
              null
          }

        ],

        exams: [

          {
            id:
              id + "_e1",

            description:
              "",

            done:
              false,

            date:
              null
          },

          {
            id:
              id + "_e2",

            description:
              "",

            done:
              false,

            date:
              null
          }

        ],

        lessons:
          []

      });


      saveState();


      subjectNameInput.value =
        "";

      subjectSemesterInput.value =
        "";


      renderAll();
    }
  );
}


function renderSubjectsManager() {

  if (
    !subjectsManager
  ) {

    return;
  }


  subjectsManager.innerHTML =
    "";


  const subjects =
    getSubjectsForCurrentSemester();


  const nameFilter =
    subjectFilterInput
      ? subjectFilterInput.value
          .trim()
          .toLowerCase()
      : "";


  const filteredSubjects =
    subjects.filter(
      subject =>
        !nameFilter ||
        subject.name
          .toLowerCase()
          .includes(
            nameFilter
          )
    );


  if (
    !filteredSubjects.length
  ) {

    subjectsManager.innerHTML =
      "<p>Nenhuma matéria encontrada com o filtro selecionado.</p>";

    return;
  }


  const sorted =
    [
      ...filteredSubjects
    ].sort(
      (a, b) =>
        a.name.localeCompare(
          b.name
        )
    );


  sorted.forEach(
    subject => {

      if (
        !subject.lessons
      ) {

        subject.lessons =
          [];
      }


      const card =
        document.createElement(
          "div"
        );


      card.className =
        "subject-card";


      const header =
        document.createElement(
          "div"
        );


      header.className =
        "subject-card-header";


      const left =
        document.createElement(
          "div"
        );


      left.className =
        "subject-name";


      left.textContent =
        subject.name;


      const right =
        document.createElement(
          "div"
        );


      right.className =
        "subject-actions";


      const badge =
        document.createElement(
          "span"
        );


      badge.className =
        "badge badge-semester";


      badge.textContent =
        `${subject.semester}º sem.`;


      right.appendChild(
        badge
      );


      const editBtn =
        document.createElement(
          "button"
        );


      editBtn.type =
        "button";


      editBtn.textContent =
        "Editar";


      editBtn.addEventListener(
        "click",
        () => {

          const newName =
            prompt(
              "Novo nome da matéria:",
              subject.name
            );


          if (
            newName === null
          ) {

            return;
          }


          const trimmed =
            newName.trim();


          if (!trimmed) {
            return;
          }


          const newSemesterString =
            prompt(
              `Novo semestre (1 a ${state.totalSemesters}):`,
              String(
                subject.semester
              )
            );


          if (
            newSemesterString ===
            null
          ) {

            return;
          }


          const newSemester =
            Number(
              newSemesterString
            );


          if (
            !newSemester ||
            newSemester < 1 ||
            newSemester >
              state.totalSemesters
          ) {

            alert(
              `Semestre inválido. Use um número entre 1 e ${state.totalSemesters}.`
            );

            return;
          }


          subject.name =
            trimmed;


          subject.semester =
            newSemester;


          saveState();

          renderAll();
        }
      );


      right.appendChild(
        editBtn
      );


      const deleteBtn =
        document.createElement(
          "button"
        );


      deleteBtn.type =
        "button";


      deleteBtn.textContent =
        "Excluir";


      deleteBtn.addEventListener(
        "click",
        () => {

          const ok =
            confirm(
              `Tem certeza que deseja excluir a matéria "${subject.name}" e TODOS os dados ligados a ela?`
            );


          if (!ok) {
            return;
          }


          state.subjects =
            state.subjects.filter(
              current =>
                current.id !==
                subject.id
            );



          saveState();

          renderAll();
        }
      );


      right.appendChild(
        deleteBtn
      );


      header.appendChild(
        left
      );


      header.appendChild(
        right
      );


      const total =
        subject.lessons.length;


      const done =
        subject.lessons.filter(
          lesson =>
            lesson.done
        ).length;


      const percent =
        total
          ? Math.round(
              (
                done /
                total
              ) * 100
            )
          : 0;


      const progressWrapper =
        document.createElement(
          "div"
        );


      progressWrapper.className =
        "progress-bar-wrapper";


      progressWrapper.innerHTML = `

        <div class="progress-bar-track">

          <div
            class="progress-bar-fill"
            style="
              width:${percent}%;
            "
          >
          </div>

        </div>


        <div
          style="
            font-size:0.78rem;
            margin-top:2px;
            color:var(--text-muted);
          "
        >

          Progresso:
          ${done}/${total}
          (${percent}%)

        </div>

      `;


      const lessonsList =
        document.createElement(
          "ul"
        );


      lessonsList.className =
        "lessons-list";


      subject.lessons.forEach(
        lesson => {

          const li =
            document.createElement(
              "li"
            );


          const main =
            document.createElement(
              "div"
            );


          main.className =
            "lesson-main";


          const checkbox =
            document.createElement(
              "input"
            );


          checkbox.type =
            "checkbox";


          checkbox.checked =
            Boolean(
              lesson.done
            );


          checkbox.addEventListener(
            "change",
            () => {

              lesson.done =
                checkbox.checked;


              saveState();

              renderSubjectsManager();

              updateSummary();

              renderSemesterStatus();
            }
          );


          const span =
            document.createElement(
              "span"
            );


          span.textContent =
            lesson.title;


          main.appendChild(
            checkbox
          );


          main.appendChild(
            span
          );


          const actions =
            document.createElement(
              "div"
            );


          actions.className =
            "lesson-actions";


          const deleteLessonBtn =
            document.createElement(
              "button"
            );


          deleteLessonBtn.type =
            "button";


          deleteLessonBtn.textContent =
            "Excluir";


          deleteLessonBtn.addEventListener(
            "click",
            () => {

              subject.lessons =
                subject.lessons.filter(
                  current =>
                    current.id !==
                    lesson.id
                );


              saveState();

              renderSubjectsManager();

              updateSummary();

              renderSemesterStatus();
            }
          );


          actions.appendChild(
            deleteLessonBtn
          );


          li.appendChild(
            main
          );


          li.appendChild(
            actions
          );


          lessonsList.appendChild(
            li
          );
        }
      );


      const addRow =
        document.createElement(
          "div"
        );


      addRow.className =
        "add-lesson-row";


      const input =
        document.createElement(
          "input"
        );


      input.type =
        "text";


      input.placeholder =
        "Título da aula/unidade";


      const addBtn =
        document.createElement(
          "button"
        );


      addBtn.type =
        "button";


      addBtn.textContent =
        "Adicionar";


      const addLesson =
        () => {

          const title =
            input.value.trim();


          if (!title) {
            return;
          }


          const id =
            subject.id +
            "_l_" +
            Date.now();


          subject.lessons.push({

            id,

            title,

            done:
              false

          });


          input.value =
            "";


          saveState();

          renderSubjectsManager();

          updateSummary();

          renderSemesterStatus();
        };


      addBtn.addEventListener(
        "click",
        addLesson
      );


      input.addEventListener(
        "keydown",
        event => {

          if (
            event.key ===
            "Enter"
          ) {

            event.preventDefault();

            addLesson();
          }
        }
      );


      addRow.appendChild(
        input
      );


      addRow.appendChild(
        addBtn
      );


      card.appendChild(
        header
      );


      card.appendChild(
        progressWrapper
      );


      card.appendChild(
        lessonsList
      );


      card.appendChild(
        addRow
      );


      if (isAttendanceEnabled()) {
        card.appendChild(
          buildAttendanceBox(subject)
        );
      }


      subjectsManager.appendChild(
        card
      );
    }
  );
}


// =====================================================
// BACKUP
// =====================================================

const downloadBackupBtn =
  document.getElementById("downloadBackupBtn");

const restoreBackupBtn =
  document.getElementById("restoreBackupBtn");

const backupFileInput =
  document.getElementById("backupFileInput");

const backupStatus =
  document.getElementById("backupStatus");


if (downloadBackupBtn) {

  downloadBackupBtn.addEventListener(
    "click",
    () => {

      try {

        const dataString =
          JSON.stringify(
            state,
            null,
            2
          );


        const blob =
          new Blob(
            [
              dataString
            ],
            {
              type:
                "application/json"
            }
          );


        const url =
          URL.createObjectURL(
            blob
          );


        const link =
          document.createElement(
            "a"
          );


        const now =
          new Date();


        const year =
          now.getFullYear();


        const month =
          String(
            now.getMonth() + 1
          ).padStart(
            2,
            "0"
          );


        const day =
          String(
            now.getDate()
          ).padStart(
            2,
            "0"
          );


        link.href =
          url;


        link.download =
          `backup_faculdade_${year}-${month}-${day}.json`;


        document.body.appendChild(
          link
        );


        link.click();


        document.body.removeChild(
          link
        );


        URL.revokeObjectURL(
          url
        );


        state.lastBackupAt =
          new Date().toISOString();

        state.backupSnoozeUntil =
          null;

        saveState();

        renderBackupInfo();

        renderNotices();

        if (backupStatus) {

          backupStatus.textContent =
            "Backup baixado com sucesso. Guarde esse arquivo em um lugar seguro.";
        }

      } catch (error) {

        console.error(
          error
        );


        if (backupStatus) {

          backupStatus.textContent =
            "Erro ao gerar backup.";
        }
      }
    }
  );
}


if (restoreBackupBtn) {

  restoreBackupBtn.addEventListener(
    "click",
    () => {

      const file =
        backupFileInput &&
        backupFileInput.files
          ? backupFileInput.files[0]
          : null;


      if (!file) {

        if (backupStatus) {

          backupStatus.textContent =
            "Selecione um arquivo de backup (.json) primeiro.";
        }

        return;
      }


      const reader =
        new FileReader();


      reader.onload =
        event => {

          try {

            const parsed =
              JSON.parse(
                event.target.result
              );


            if (
              !parsed ||
              typeof parsed !==
                "object" ||
              !Array.isArray(
                parsed.subjects
              )
            ) {

              if (backupStatus) {

                backupStatus.textContent =
                  "Arquivo inválido. Parece que não é um backup deste site.";
              }

              return;
            }


            state =
              parsed;


            ensureSemesterMaps();

            ensureConfigState();


            currentSemester =
              Number(
                state.currentSemester ||
                1
              );


            if (
              currentSemester >
              state.totalSemesters
            ) {

              currentSemester =
                state.totalSemesters;
            }


            state.currentSemester =
              currentSemester;


            migrateLegacyDataIfNeeded();

            saveState();

            applyTheme();

            renderAll();


            if (backupStatus) {

              backupStatus.textContent =
                "Backup restaurado com sucesso!";
            }

          } catch (error) {

            console.error(
              error
            );


            if (backupStatus) {

              backupStatus.textContent =
                "Erro ao ler arquivo de backup.";
            }
          }
        };


      reader.readAsText(
        file,
        "utf-8"
      );
    }
  );
}


// =====================================================
// EVENTOS DOS FILTROS
// =====================================================

if (gradeFilterPart) {

  gradeFilterPart.addEventListener(
    "change",
    renderGrades
  );
}


if (examFilterSubject) {

  examFilterSubject.addEventListener(
    "change",
    renderExamsPage
  );
}


if (examFilterStatus) {

  examFilterStatus.addEventListener(
    "change",
    renderExamsPage
  );
}


if (subjectFilterInput) {

  subjectFilterInput.addEventListener(
    "input",
    renderSubjectsManager
  );
}


// =====================================================
// NAVEGAÇÃO PRINCIPAL
// =====================================================

navButtons.forEach(
  button => {

    button.addEventListener(
      "click",
      () => {

        const viewName =
          button.dataset.view;


        navButtons.forEach(
          currentButton => {

            currentButton.classList.remove(
              "active"
            );
          }
        );


        button.classList.add(
          "active"
        );


        if (pageHeaderTitle) {
          const labels = {
            capa: "Capa",
            materias: "Matérias",
            trabalhos: "Trabalhos",
            provas: "Provas",
            notas: "Notas",
            noticias: "Notícias",
            ajuda: "Ajuda",
            config: "Configuração"
          };
          pageHeaderTitle.textContent = labels[viewName] || "Organizador";
        }


        Object.keys(
          views
        ).forEach(
          name => {

            if (
              views[name]
            ) {

              views[
                name
              ].classList.toggle(
                "active",
                name ===
                  viewName
              );
            }
          }
        );



        if (
          viewName ===
          "config"
        ) {

          populateSummarySemesterSelect();
          renderConfigFields();
        }
      }
    );
  }
);


// =====================================================
// ALTERAÇÃO DO SEMESTRE GLOBAL
// =====================================================

if (globalSemesterSelect) {

  globalSemesterSelect.addEventListener(
    "change",
    () => {

      currentSemester =
        Number(
          globalSemesterSelect.value
        );


      state.currentSemester =
        currentSemester;


      selectedDate =
        null;


      saveState();

      renderAll();
    }
  );
}


// =====================================================
// RENDERIZAÇÃO GERAL
// =====================================================

function renderAll() {

  ensureConfigState();

  // Atualiza primeiro a área pessoal da Capa. Assim nome e data aparecem
  // mesmo se algum bloco acadêmico antigo precisar de ajuste durante a renderização.
  renderProfileGreeting();

  ensureSemesterMaps();

  renderSemesterOptions();

  renderConfigFields();

  populateSummarySemesterSelect();


  if (globalSemesterSelect) {

    globalSemesterSelect.value =
      String(
        currentSemester
      );
  }


  populateExamSubjectFilter();


  updateSummary();

  renderSemesterStatus();

  renderCalendar();

  renderImportantDatesList();

  renderTimetable();

  renderUpcomingDeadlines();

  renderGrades();

  renderWorksPage();

  renderExamsPage();

  renderSubjectsManager();

  renderFormulaTexts();

  renderGradeConfigFields();

  renderBackupInfo();

  renderAttendanceConfigFields();

  renderAppearanceControls();

  renderInstallCard();

  renderTodayPanel();

  renderNotices();

  renderNewsIfVisible();


  // Se o resumo estiver aberto,
  // atualiza os dados dele também.

  if (
    selectedSummarySemester &&
    semesterSummaryPage &&
    !semesterSummaryPage.classList.contains(
      "hidden"
    )
  ) {

    const summaryData =
      getSemesterSummaryData(
        selectedSummarySemester
      );


    if (semesterSummaryTitle) {

      semesterSummaryTitle.textContent =
        `${selectedSummarySemester}º Semestre`;
    }


    if (semesterSummaryCourse) {

      semesterSummaryCourse.textContent =
        state.courseName ||
        "Curso não informado";
    }


    renderSummaryStats(
      summaryData
    );


    renderCurrentSummaryTab();
  }
}


// =====================================================
// FÓRMULA DAS NOTAS (CONFIGURAÇÃO) — modelos e editor
// =====================================================

const gradePresetSelect = document.getElementById("gradePresetSelect");
const gradePeriodsEditor = document.getElementById("gradePeriodsEditor");
const addGradePeriodBtn = document.getElementById("addGradePeriodBtn");
const gradePassingInput = document.getElementById("gradePassingInput");
const formulaPreview = document.getElementById("formulaPreview");
const saveGradeConfigBtn = document.getElementById("saveGradeConfigBtn");
const gradeConfigStatus = document.getElementById("gradeConfigStatus");

let gradeDraft = null;

function newGradeId(prefix) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

// ---------- listas usadas no resumo e no PDF ----------

function syncGradeFilterOptions() {
  if (!gradeFilterPart) return;
  const { periods } = getGradeConfig();
  const wanted = ["all", ...periods.map(p => p.id)].join("|");
  if (gradeFilterPart.dataset.sig === wanted) return;

  const current = gradeFilterPart.value;
  gradeFilterPart.innerHTML = "";

  const all = document.createElement("option");
  all.value = "all";
  all.textContent = "Todas as notas";
  gradeFilterPart.appendChild(all);

  periods.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.id;
    opt.textContent = `Somente ${p.name} (${p.items.map(i => i.name).join(" + ")})`;
    gradeFilterPart.appendChild(opt);
  });

  gradeFilterPart.value = periods.some(p => p.id === current) ? current : "all";
  gradeFilterPart.dataset.sig = wanted;
}

function summaryGradeItemsHtml(grades) {
  grades = grades || {};
  return getAllGradeItems()
    .map(it => `
          <div>
            <span>${escapeHtml(it.name)}</span>
            <strong>${isGradeFilled(grades[it.id]) ? escapeHtml(String(grades[it.id]).replace(".", ",")) : "-"}</strong>
          </div>`)
    .join("");
}

function printGradeItemsText(grades) {
  grades = grades || {};
  return getGradeConfig()
    .periods.map(p =>
      p.items
        .map(it => `${escapeHtml(p.items.length > 1 || it.name !== "Nota" ? it.name : p.name)}: ${isGradeFilled(grades[it.id]) ? escapeHtml(String(grades[it.id]).replace(".", ",")) : "-"}`)
        .join(" | ")
    )
    .join(" | ");
}

// ---------- editor ----------

function draftToText() {
  const passing = Number(String(gradePassingInput ? gradePassingInput.value : "").replace(",", "."));
  const saved = state.gradeConfig;
  state.gradeConfig = { periods: gradeDraft, passingGrade: passing >= 0 && passing <= 10 ? passing : 6 };
  const text = getFormulaText();
  state.gradeConfig = saved;
  return text;
}

function updateFormulaPreview() {
  if (!formulaPreview || !gradeDraft) return;
  formulaPreview.textContent = draftToText();
}

function orphanedGradeWarning(periods) {
  const ids = new Set(periods.flatMap(p => p.items.map(i => i.id)));
  const affected = (state.subjects || []).filter(sub =>
    Object.entries(sub.grades || {}).some(([k, v]) => !ids.has(k) && isGradeFilled(v))
  );
  if (!affected.length) return "";
  return ` Atenção: ${affected.length} ${affected.length === 1 ? "matéria tem" : "matérias têm"} notas lançadas que não aparecem neste modelo. Elas continuam guardadas e voltam se você retornar ao modelo anterior.`;
}

function renderGradePeriodsEditor() {
  if (!gradePeriodsEditor || !gradeDraft) return;
  gradePeriodsEditor.innerHTML = "";

  gradeDraft.forEach((period, pIndex) => {
    const box = document.createElement("div");
    box.className = "gp-period";

    const head = document.createElement("div");
    head.className = "gp-period-head";
    head.innerHTML = `
      <label class="gp-field gp-name"><span>Período</span><input type="text" maxlength="40" /></label>
      <label class="gp-field gp-weight"><span>Peso</span><input type="number" min="0" max="100" step="0.5" /></label>
      <label class="gp-field gp-combine"><span>Juntar avaliações</span>
        <select>
          <option value="media">Média entre elas</option>
          <option value="soma">Somar (ex.: trabalho + prova = 10)</option>
        </select>
      </label>
      <button type="button" class="gp-remove-period ghost-btn" aria-label="Remover ${escapeHtml(period.name)}">Remover</button>
    `;

    const [nameInput, weightInput, combineSelect] = head.querySelectorAll("input, select");
    nameInput.value = period.name;
    weightInput.value = period.weight;
    combineSelect.value = period.combine;

    nameInput.addEventListener("input", () => { period.name = nameInput.value || `Período ${pIndex + 1}`; markCustom(); });
    weightInput.addEventListener("input", () => {
      const w = Number(String(weightInput.value).replace(",", "."));
      period.weight = w >= 0 ? w : 0;
      markCustom();
    });
    combineSelect.addEventListener("change", () => { period.combine = combineSelect.value; markCustom(); });

    const removePeriodBtn = head.querySelector(".gp-remove-period");
    removePeriodBtn.disabled = gradeDraft.length <= 1;
    removePeriodBtn.addEventListener("click", () => {
      gradeDraft.splice(pIndex, 1);
      markCustom();
      renderGradePeriodsEditor();
    });

    const items = document.createElement("div");
    items.className = "gp-items";

    period.items.forEach((item, iIndex) => {
      const chip = document.createElement("div");
      chip.className = "gp-item";
      chip.innerHTML = `
        <input type="text" maxlength="40" aria-label="Nome da avaliação" />
        <button type="button" class="gp-remove-item" aria-label="Remover avaliação">×</button>
      `;
      const input = chip.querySelector("input");
      input.value = item.name;
      input.addEventListener("input", () => { item.name = input.value || "Avaliação"; markCustom(); });

      const rm = chip.querySelector("button");
      rm.disabled = period.items.length <= 1;
      rm.addEventListener("click", () => {
        period.items.splice(iIndex, 1);
        markCustom();
        renderGradePeriodsEditor();
      });
      items.appendChild(chip);
    });

    const addItem = document.createElement("button");
    addItem.type = "button";
    addItem.className = "gp-add-item";
    addItem.textContent = "+ avaliação";
    addItem.addEventListener("click", () => {
      period.items.push({ id: newGradeId(period.id), name: `Avaliação ${period.items.length + 1}` });
      markCustom();
      renderGradePeriodsEditor();
    });
    items.appendChild(addItem);

    box.append(head, items);
    gradePeriodsEditor.appendChild(box);
  });

  updateFormulaPreview();
}

function markCustom() {
  if (gradePresetSelect) gradePresetSelect.value = "personalizado";
  updateFormulaPreview();
}

function renderGradeConfigFields() {
  const cfg = getGradeConfig();
  gradeDraft = clonePeriods(cfg.periods);

  if (gradePresetSelect) {
    if (!gradePresetSelect.options.length) {
      Object.entries(GRADE_PRESETS).forEach(([key, preset]) => {
        const opt = document.createElement("option");
        opt.value = key;
        opt.textContent = preset.name;
        gradePresetSelect.appendChild(opt);
      });
      const custom = document.createElement("option");
      custom.value = "personalizado";
      custom.textContent = "Personalizado";
      gradePresetSelect.appendChild(custom);
    }
    gradePresetSelect.value = GRADE_PRESETS[cfg.preset] ? cfg.preset : "personalizado";
  }

  if (gradePassingInput) gradePassingInput.value = cfg.passingGrade;
  renderGradePeriodsEditor();
}

function renderFormulaTexts() {
  const text = getFormulaText();
  document.querySelectorAll(".formula-text").forEach(el => {
    el.textContent = text;
  });
}

if (gradePresetSelect) {
  gradePresetSelect.addEventListener("change", () => {
    const preset = GRADE_PRESETS[gradePresetSelect.value];
    if (!preset) return;
    gradeDraft = clonePeriods(preset.periods);
    renderGradePeriodsEditor();
    if (gradeConfigStatus) {
      gradeConfigStatus.textContent =
        "Modelo carregado. Ajuste se quiser e clique em Salvar fórmula." + orphanedGradeWarning(gradeDraft);
    }
  });
}

if (addGradePeriodBtn) {
  addGradePeriodBtn.addEventListener("click", () => {
    const id = newGradeId("per");
    gradeDraft.push({
      id,
      name: `Período ${gradeDraft.length + 1}`,
      weight: 1,
      combine: "media",
      items: [{ id: newGradeId(id), name: "Nota" }]
    });
    markCustom();
    renderGradePeriodsEditor();
  });
}

if (gradePassingInput) {
  gradePassingInput.addEventListener("input", updateFormulaPreview);
}

if (saveGradeConfigBtn) {
  saveGradeConfigBtn.addEventListener("click", () => {
    const passing = Number(String(gradePassingInput ? gradePassingInput.value : "").replace(",", "."));
    const periods = sanitizePeriods(gradeDraft);

    if (!(passing >= 0 && passing <= 10)) {
      if (gradeConfigStatus) gradeConfigStatus.textContent = "A média para passar precisa ficar entre 0 e 10.";
      return;
    }
    if (!periods || !periods.some(p => p.weight > 0)) {
      if (gradeConfigStatus) gradeConfigStatus.textContent = "Inclua pelo menos um período com peso maior que 0.";
      return;
    }

    state.gradeConfig = {
      preset: gradePresetSelect ? gradePresetSelect.value : "personalizado",
      periods,
      passingGrade: passing
    };
    saveState();
    renderAll();

    if (gradeConfigStatus) {
      gradeConfigStatus.textContent =
        "Fórmula salva. As médias já foram recalculadas." + orphanedGradeWarning(periods);
    }
  });
}


// =====================================================
// NAVEGAÇÃO AUXILIAR + AVISOS (BOAS-VINDAS E BACKUP)
// =====================================================

const appNotices = document.getElementById("appNotices");
const lastBackupInfo = document.getElementById("lastBackupInfo");
const BACKUP_REMINDER_DAYS = 14;

function goToView(viewName) {
  const btn = document.querySelector(`.nav-btn[data-view="${viewName}"]`);
  if (btn) {
    btn.click();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

document.querySelectorAll(".go-config-link").forEach(link => {
  link.addEventListener("click", event => {
    event.preventDefault();
    goToView("config");
  });
});

function daysSince(iso) {
  if (!iso) return null;
  const then = new Date(iso);
  if (isNaN(then)) return null;
  return Math.floor((Date.now() - then.getTime()) / 86400000);
}

function renderBackupInfo() {
  if (!lastBackupInfo) return;
  const days = daysSince(state.lastBackupAt);
  if (days === null) {
    lastBackupInfo.textContent = "Você ainda não baixou nenhum backup.";
  } else {
    const when = new Date(state.lastBackupAt).toLocaleDateString("pt-BR");
    lastBackupInfo.textContent =
      days === 0
        ? `Último backup: hoje (${when}).`
        : `Último backup: ${when} (há ${days} ${days === 1 ? "dia" : "dias"}).`;
  }
}

function hasUserContent() {
  return (
    (state.subjects && state.subjects.length > 0) ||
    Object.values(state.importantDatesBySemester || {}).some(list => list && list.length)
  );
}

function makeNotice(kind, icon, html, actions) {
  const box = document.createElement("div");
  box.className = `app-notice app-notice-${kind}`;

  const iconEl = document.createElement("span");
  iconEl.className = "app-notice-icon";
  iconEl.textContent = icon;

  const textEl = document.createElement("p");
  textEl.innerHTML = html;

  const actionsEl = document.createElement("div");
  actionsEl.className = "app-notice-actions";

  actions.forEach(({ label, primary, onClick }) => {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    if (!primary) b.className = "ghost-btn";
    b.addEventListener("click", onClick);
    actionsEl.appendChild(b);
  });

  box.append(iconEl, textEl, actionsEl);
  return box;
}

function renderNotices() {
  if (!appNotices) return;
  appNotices.innerHTML = "";

  const hasName =
    !!(state.profile && (state.profile.name || state.profile.nickname));

  // Boas-vindas para quem está chegando agora
  if (!hasName && !hasUserContent() && !state.welcomeDismissed) {
    appNotices.appendChild(
      makeNotice(
        "info",
        "👋",
        "<strong>Bem-vindo(a) ao Organizador!</strong> Comece informando seu nome, seu curso e a fórmula de notas da sua faculdade.",
        [
          { label: "Começar configuração", primary: true, onClick: () => goToView("config") },
          {
            label: "Agora não",
            onClick: () => {
              state.welcomeDismissed = true;
              saveState();
              renderNotices();
            }
          }
        ]
      )
    );
  }

  // Lembrete de backup
  if (hasUserContent()) {
    const days = daysSince(state.lastBackupAt);
    const snoozed =
      state.backupSnoozeUntil &&
      new Date(state.backupSnoozeUntil).getTime() > Date.now();

    if (!snoozed && (days === null || days >= BACKUP_REMINDER_DAYS)) {
      const msg =
        days === null
          ? "<strong>Você ainda não fez nenhum backup.</strong> Seus dados ficam só neste navegador: se ele for limpo, tudo se perde."
          : `<strong>Seu último backup foi há ${days} dias.</strong> Que tal salvar uma cópia atualizada?`;

      appNotices.appendChild(
        makeNotice("warn", "💾", msg, [
          {
            label: "Baixar backup agora",
            primary: true,
            onClick: () => {
              if (downloadBackupBtn) downloadBackupBtn.click();
            }
          },
          {
            label: "Lembrar em 3 dias",
            onClick: () => {
              state.backupSnoozeUntil = new Date(Date.now() + 3 * 86400000).toISOString();
              saveState();
              renderNotices();
            }
          }
        ])
      );
    }
  }

  // Provas da próxima semana + o que falta estudar
  appendExamNotices();

  // Matérias perto do limite de faltas
  appendAttendanceNotices();

  // Convite para instalar o app (só no celular)
  appendInstallNotice();
}


// =====================================================
// ALERTA DE PROVAS PRÓXIMAS
// =====================================================

const EXAM_ALERT_DAYS = 7;

function parseIsoLocal(iso) {
  if (!iso || typeof iso !== "string") return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function daysUntil(iso) {
  const date = parseIsoLocal(iso);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((date - today) / 86400000);
}

function escapeHtml(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getUpcomingExams() {
  const list = [];

  getSubjectsForCurrentSemester().forEach(subject => {
    (subject.exams || []).forEach((exam, index) => {
      if (exam.done || !exam.date) return;
      const days = daysUntil(exam.date);
      if (days === null || days < 0 || days > EXAM_ALERT_DAYS) return;
      list.push({ subject, exam, index, days });
    });
  });

  return list.sort((a, b) => a.days - b.days);
}

function buildExamNotice({ subject, exam, index, days }) {
  const when =
    days === 0 ? "é <strong>hoje</strong>"
    : days === 1 ? "é <strong>amanhã</strong>"
    : `é em <strong>${days} dias</strong>`;

  const dateText = parseIsoLocal(exam.date).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit"
  });

  const pendingLessons = (subject.lessons || []).filter(l => !l.done);
  const doneLessons = (subject.lessons || []).length - pendingLessons.length;

  let html =
    `<strong>Prova ${index + 1} de ${escapeHtml(subject.name)}</strong> ${when} (${dateText}).`;

  if (exam.description && exam.description.trim()) {
    html += `<span class="exam-alert-line"><b>Conteúdo:</b> ${escapeHtml(exam.description.trim())}</span>`;
  } else {
    html += `<span class="exam-alert-line"><b>Conteúdo:</b> ainda não cadastrado em Provas.</span>`;
  }

  if (!(subject.lessons || []).length) {
    html += `<span class="exam-alert-line"><b>O que falta:</b> nenhuma aula cadastrada em Matérias.</span>`;
  } else if (pendingLessons.length) {
    const items = pendingLessons
      .slice(0, 6)
      .map(l => `<li>${escapeHtml(l.title)}</li>`)
      .join("");
    const more =
      pendingLessons.length > 6
        ? `<li>e mais ${pendingLessons.length - 6}…</li>`
        : "";
    html += `<span class="exam-alert-line"><b>O que falta estudar</b> (${doneLessons} de ${subject.lessons.length} ${subject.lessons.length === 1 ? "aula estudada" : "aulas estudadas"}):</span><ul class="exam-alert-list">${items}${more}</ul>`;
  } else {
    html += `<span class="exam-alert-line"><b>O que falta:</b> nada! Você já estudou ${subject.lessons.length === 1 ? "a única aula cadastrada" : `todas as ${subject.lessons.length} aulas cadastradas`}. 💪</span>`;
  }

  const kind = days <= 2 ? "danger" : "exam";

  return makeNotice(kind, "📝", html, [
    { label: "Ver provas", primary: true, onClick: () => goToView("provas") },
    { label: "Ver aulas", onClick: () => goToView("materias") }
  ]);
}

function appendExamNotices() {
  if (!appNotices) return;
  getUpcomingExams().forEach(item => {
    appNotices.appendChild(buildExamNotice(item));
  });
}


// =====================================================
// NOTÍCIAS E CURIOSIDADES DAS MATÉRIAS
// Fontes: GDELT (notícias) e Wikipédia (curiosidades).
// As duas permitem acesso direto do navegador.
// =====================================================

const newsContainer = document.getElementById("newsContainer");
const newsSemesterLabel = document.getElementById("newsSemesterLabel");
const refreshNewsBtn = document.getElementById("refreshNewsBtn");

const NEWS_CACHE_KEY = "organizador_faculdade_news_cache_v1";
const NEWS_CACHE_HOURS = 6;
let newsRenderToken = 0;

function loadNewsCache() {
  try {
    return JSON.parse(localStorage.getItem(NEWS_CACHE_KEY) || "{}") || {};
  } catch (e) {
    return {};
  }
}

function saveNewsCache(cache) {
  try {
    localStorage.setItem(NEWS_CACHE_KEY, JSON.stringify(cache));
  } catch (e) {
    // sem espaço ou bloqueado: segue sem cache
  }
}

function getCached(key) {
  const cache = loadNewsCache();
  const item = cache[key];
  if (!item) return null;
  if (Date.now() - item.at > NEWS_CACHE_HOURS * 3600000) return null;
  return item.data;
}

function setCached(key, data) {
  const cache = loadNewsCache();
  cache[key] = { at: Date.now(), data };
  // mantém o cache pequeno
  const keys = Object.keys(cache);
  if (keys.length > 60) {
    keys
      .sort((a, b) => cache[a].at - cache[b].at)
      .slice(0, keys.length - 60)
      .forEach(k => delete cache[k]);
  }
  saveNewsCache(cache);
}

function getNewsQuery(subject) {
  return (subject.newsQuery || subject.name || "").trim();
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchJsonWithTimeout(url, ms = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error("HTTP " + response.status);
    const text = await response.text();
    // o GDELT responde texto simples quando a busca é inválida
    return JSON.parse(text);
  } finally {
    clearTimeout(timer);
  }
}

// GDELT: datas vêm como 20261110T153000Z
function parseGdeltDate(value) {
  const m = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})/.exec(value || "");
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
}

let lastGdeltCall = 0;

async function fetchNews(query) {
  const cacheKey = "news:" + query.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  // O GDELT pede no máximo 1 busca a cada 5 segundos
  const wait = 5200 - (Date.now() - lastGdeltCall);
  if (wait > 0) await sleep(wait);
  lastGdeltCall = Date.now();

  const phrase = query.includes(" ") ? `"${query}"` : query;
  const url =
    "https://api.gdeltproject.org/api/v2/doc/doc?" +
    new URLSearchParams({
      query: `${phrase} sourcelang:portuguese`,
      mode: "artlist",
      format: "json",
      maxrecords: "8",
      timespan: "3m",
      sort: "hybridrel"
    }).toString();

  const data = await fetchJsonWithTimeout(url);
  const seen = new Set();
  const articles = (data.articles || [])
    .filter(a => {
      const key = (a.title || "").toLowerCase().trim();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5)
    .map(a => ({
      title: a.title,
      url: a.url,
      domain: a.domain,
      date: parseGdeltDate(a.seendate)?.toISOString() || null
    }));

  setCached(cacheKey, articles);
  return articles;
}

async function fetchCuriosity(query) {
  const cacheKey = "wiki:" + query.toLowerCase();
  const cached = getCached(cacheKey);
  if (cached) return cached;

  const url =
    "https://pt.wikipedia.org/w/api.php?" +
    new URLSearchParams({
      action: "query",
      format: "json",
      origin: "*",
      generator: "search",
      gsrsearch: query,
      gsrlimit: "1",
      prop: "extracts|info",
      exintro: "1",
      explaintext: "1",
      exsentences: "3",
      inprop: "url",
      redirects: "1"
    }).toString();

  const data = await fetchJsonWithTimeout(url);
  const pages = data && data.query && data.query.pages
    ? Object.values(data.query.pages)
    : [];
  const page = pages[0];

  const result = page && page.extract
    ? { title: page.title, extract: page.extract, url: page.fullurl }
    : null;

  setCached(cacheKey, result);
  return result;
}

function googleNewsUrl(query) {
  return (
    "https://news.google.com/search?" +
    new URLSearchParams({ q: query, hl: "pt-BR", gl: "BR", ceid: "BR:pt-419" }).toString()
  );
}

function formatNewsDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function safeLink(url) {
  return /^https?:\/\//i.test(url || "") ? url : "#";
}

function buildNewsCard(subject) {
  const query = getNewsQuery(subject);

  const card = document.createElement("article");
  card.className = "card news-card";

  card.innerHTML = `
    <div class="news-card-header">
      <div>
        <span class="news-kicker">MATÉRIA</span>
        <h3>${escapeHtml(subject.name)}</h3>
      </div>
      <form class="news-query-form" title="Mude o termo se as notícias não tiverem a ver com a matéria">
        <label>
          <span>Buscar por</span>
          <input type="text" value="${escapeHtml(query)}" maxlength="80" />
        </label>
        <button type="submit">Atualizar</button>
      </form>
    </div>

    <section class="news-curiosity">
      <h4>💡 Curiosidade</h4>
      <div class="news-curiosity-body"><p class="news-loading">Buscando na Wikipédia…</p></div>
    </section>

    <section class="news-list-section">
      <h4>📰 Notícias recentes</h4>
      <ul class="news-list"><li class="news-loading">Buscando notícias…</li></ul>
      <a class="news-more-link" href="${googleNewsUrl(query)}" target="_blank" rel="noopener">Ver mais no Google Notícias ↗</a>
    </section>
  `;

  const form = card.querySelector(".news-query-form");
  form.addEventListener("submit", event => {
    event.preventDefault();
    const value = form.querySelector("input").value.trim();
    subject.newsQuery = value && value !== subject.name ? value : "";
    saveState();
    renderNewsPage();
  });

  return card;
}

async function fillCuriosity(card, query, token) {
  const body = card.querySelector(".news-curiosity-body");
  try {
    const info = await fetchCuriosity(query);
    if (token !== newsRenderToken) return;
    if (!info) {
      body.innerHTML = `<p class="news-empty">Não achei um artigo sobre “${escapeHtml(query)}”. Tente outro termo de busca.</p>`;
      return;
    }
    body.innerHTML = `
      <p>${escapeHtml(info.extract)}</p>
      <a href="${safeLink(info.url)}" target="_blank" rel="noopener">Ler mais: ${escapeHtml(info.title)} (Wikipédia) ↗</a>
    `;
  } catch (e) {
    if (token !== newsRenderToken) return;
    body.innerHTML = `<p class="news-empty">Não foi possível carregar a curiosidade agora. Confira sua internet e clique em Atualizar.</p>`;
  }
}

async function fillNews(card, query, token) {
  const list = card.querySelector(".news-list");
  try {
    const articles = await fetchNews(query);
    if (token !== newsRenderToken) return;
    if (!articles.length) {
      list.innerHTML = `<li class="news-empty">Nenhuma notícia em português nos últimos 3 meses. Use o link abaixo ou tente um termo mais amplo.</li>`;
      return;
    }
    list.innerHTML = articles
      .map(a => `
        <li>
          <a href="${safeLink(a.url)}" target="_blank" rel="noopener">${escapeHtml(a.title)}</a>
          <span class="news-meta">${escapeHtml(a.domain || "")}${a.date ? " · " + formatNewsDate(a.date) : ""}</span>
        </li>`)
      .join("");
  } catch (e) {
    if (token !== newsRenderToken) return;
    list.innerHTML = `<li class="news-empty">O serviço de notícias não respondeu agora. Tente de novo em alguns minutos ou use o link abaixo.</li>`;
  }
}

async function renderNewsPage(force = false) {
  if (!newsContainer) return;

  const token = ++newsRenderToken;

  if (newsSemesterLabel) {
    newsSemesterLabel.textContent = `${currentSemester}º semestre`;
  }

  if (force) {
    saveNewsCache({});
  }

  const subjects = getSubjectsForCurrentSemester();
  newsContainer.innerHTML = "";

  if (!subjects.length) {
    newsContainer.innerHTML =
      `<div class="card"><p>Nenhuma matéria cadastrada no ${currentSemester}º semestre. Cadastre suas matérias em <a href="#" class="go-materias-link">Matérias</a> para ver notícias e curiosidades sobre elas.</p></div>`;
    const link = newsContainer.querySelector(".go-materias-link");
    if (link) {
      link.addEventListener("click", e => {
        e.preventDefault();
        goToView("materias");
      });
    }
    return;
  }

  const cards = subjects.map(subject => {
    const card = buildNewsCard(subject);
    newsContainer.appendChild(card);
    return { card, query: getNewsQuery(subject) };
  });

  // curiosidades em paralelo (Wikipédia aguenta bem)
  cards.forEach(({ card, query }) => fillCuriosity(card, query, token));

  // notícias uma por vez (limite do GDELT)
  for (const { card, query } of cards) {
    if (token !== newsRenderToken) return;
    await fillNews(card, query, token);
  }
}

if (refreshNewsBtn) {
  refreshNewsBtn.addEventListener("click", () => renderNewsPage(true));
}

let newsLoadedForSemester = null;

function renderNewsIfVisible() {
  const view = views.noticias;
  if (!view || !view.classList.contains("active")) return;
  if (newsLoadedForSemester === currentSemester) return;
  newsLoadedForSemester = currentSemester;
  renderNewsPage();
}

navButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "noticias") {
      newsLoadedForSemester = null;
      renderNewsIfVisible();
    }
  });
});



// =====================================================
// CONTROLE DE FALTAS (opcional, ligado na Configuração)
// =====================================================

const attendanceEnabledInput = document.getElementById("attendanceEnabledInput");
const attendanceMinInput = document.getElementById("attendanceMinInput");
const attendanceMinRow = document.getElementById("attendanceMinRow");
const saveAttendanceBtn = document.getElementById("saveAttendanceBtn");
const attendanceStatus = document.getElementById("attendanceStatus");

function getAttendanceConfig() {
  const cfg = state.attendance || {};
  const min = Number(cfg.minPercent);
  return {
    enabled: cfg.enabled === true,
    minPercent: min > 0 && min <= 100 ? min : 75
  };
}

function isAttendanceEnabled() {
  return getAttendanceConfig().enabled;
}

// Situação das faltas de uma matéria
function getAttendanceInfo(subject) {
  const { minPercent } = getAttendanceConfig();
  const total = Number(subject.totalClasses) || 0;
  const absences = Math.max(0, Number(subject.absences) || 0);

  if (!total) {
    return { total, absences, allowed: null, remaining: null, kind: "empty" };
  }

  const allowed = Math.floor(total * (1 - minPercent / 100) + 1e-9);
  const remaining = allowed - absences;
  const presence = Math.max(0, Math.round(((total - absences) / total) * 100));

  let kind = "ok";
  if (remaining < 0) kind = "bad";
  else if (remaining <= 2) kind = "warn";

  return { total, absences, allowed, remaining, presence, kind };
}

function attendanceMessage(info) {
  if (info.kind === "empty") {
    return "Informe quantas aulas a matéria tem no semestre para calcular o limite de faltas.";
  }
  if (info.remaining < 0) {
    return `Você passou do limite de ${info.allowed} faltas (${-info.remaining} a mais). Fale com a coordenação ou o(a) professor(a).`;
  }
  if (info.remaining === 0) {
    return `Atenção: você chegou ao limite de ${info.allowed} faltas. Mais uma e reprova por falta.`;
  }
  return `Você ainda pode faltar ${info.remaining} ${info.remaining === 1 ? "aula" : "aulas"} (limite de ${info.allowed}).`;
}

function buildAttendanceBox(subject) {
  const box = document.createElement("div");
  box.className = "attendance-box";

  box.innerHTML = `
    <div class="attendance-head">
      <strong>📋 Faltas</strong>
      <label class="attendance-total">
        <span>Aulas no semestre</span>
        <input type="number" min="0" max="500" step="1" placeholder="ex.: 40" />
      </label>
    </div>
    <div class="attendance-row">
      <div class="attendance-counter">
        <button type="button" class="attendance-minus" aria-label="Tirar uma falta">−</button>
        <span class="attendance-count"></span>
        <button type="button" class="attendance-plus" aria-label="Adicionar uma falta">+1 falta</button>
      </div>
      <span class="attendance-presence"></span>
    </div>
    <p class="attendance-msg"></p>
  `;

  const totalInput = box.querySelector(".attendance-total input");
  const countEl = box.querySelector(".attendance-count");
  const presenceEl = box.querySelector(".attendance-presence");
  const msgEl = box.querySelector(".attendance-msg");

  totalInput.value = subject.totalClasses || "";

  const refresh = () => {
    const info = getAttendanceInfo(subject);
    countEl.textContent = `${info.absences} ${info.absences === 1 ? "falta" : "faltas"}`;
    presenceEl.textContent = info.kind === "empty" ? "" : `Presença: ${info.presence}%`;
    msgEl.textContent = attendanceMessage(info);
    box.dataset.kind = info.kind;
  };

  totalInput.addEventListener("input", () => {
    const value = Math.max(0, Math.floor(Number(totalInput.value) || 0));
    subject.totalClasses = value || null;
    saveState();
    refresh();
  });

  box.querySelector(".attendance-plus").addEventListener("click", () => {
    subject.absences = (Number(subject.absences) || 0) + 1;
    saveState();
    refresh();
  });

  box.querySelector(".attendance-minus").addEventListener("click", () => {
    subject.absences = Math.max(0, (Number(subject.absences) || 0) - 1);
    saveState();
    refresh();
  });

  refresh();
  return box;
}

function appendAttendanceNotices() {
  if (!appNotices || !isAttendanceEnabled()) return;

  getSubjectsForCurrentSemester().forEach(subject => {
    const info = getAttendanceInfo(subject);
    if (info.kind !== "warn" && info.kind !== "bad") return;

    appNotices.appendChild(
      makeNotice(
        info.kind === "bad" || info.remaining === 0 ? "danger" : "warn",
        "📋",
        `<strong>Faltas em ${escapeHtml(subject.name)}:</strong> ${escapeHtml(attendanceMessage(info))}`,
        [{ label: "Ver matéria", primary: true, onClick: () => goToView("materias") }]
      )
    );
  });
}

function renderAttendanceConfigFields() {
  const cfg = getAttendanceConfig();
  if (attendanceEnabledInput) attendanceEnabledInput.checked = cfg.enabled;
  if (attendanceMinInput) attendanceMinInput.value = cfg.minPercent;
  if (attendanceMinRow) attendanceMinRow.classList.toggle("is-disabled", !cfg.enabled);
}

if (attendanceEnabledInput && attendanceMinRow) {
  attendanceEnabledInput.addEventListener("change", () => {
    attendanceMinRow.classList.toggle("is-disabled", !attendanceEnabledInput.checked);
  });
}

if (saveAttendanceBtn) {
  saveAttendanceBtn.addEventListener("click", () => {
    const enabled = !!(attendanceEnabledInput && attendanceEnabledInput.checked);
    const min = Number(String(attendanceMinInput ? attendanceMinInput.value : "").replace(",", "."));

    if (enabled && !(min > 0 && min <= 100)) {
      if (attendanceStatus) attendanceStatus.textContent = "Informe uma frequência mínima entre 1% e 100%.";
      return;
    }

    state.attendance = {
      enabled,
      minPercent: min > 0 && min <= 100 ? min : 75
    };
    saveState();
    renderAll();

    if (attendanceStatus) {
      attendanceStatus.textContent = enabled
        ? "Controle de faltas ligado. Informe o total de aulas de cada matéria na aba Matérias."
        : "Controle de faltas desligado.";
    }
  });
}


// =====================================================
// "HOJE VOCÊ TEM…" NA CAPA
// =====================================================

const todayPanel = document.getElementById("todayPanel");

const WEEKDAY_KEYS = [null, "monday", "tuesday", "wednesday", "thursday", "friday", null];

function getNextDeadlines(limit = 3) {
  const items = [];

  getSubjectsForCurrentSemester().forEach(subject => {
    (subject.works || []).forEach((work, i) => {
      if (work.done || work.delivered || !work.dueDate) return;
      items.push({ iso: work.dueDate, label: `Entrega do Trabalho ${i + 1}`, subject: subject.name });
    });
    (subject.exams || []).forEach((exam, i) => {
      if (exam.done || !exam.date) return;
      items.push({ iso: exam.date, label: `Prova ${i + 1}`, subject: subject.name });
    });
  });

  getImportantDatesForCurrentSemester().forEach(item => {
    if (item && item.date) items.push({ iso: item.date, label: item.label || "Data importante", subject: "" });
  });

  return items
    .map(item => ({ ...item, days: daysUntil(item.iso) }))
    .filter(item => item.days !== null && item.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, limit);
}

function relativeDayText(days) {
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return `Em ${days} dias`;
}

function renderTodayPanel() {
  if (!todayPanel) return;

  const key = WEEKDAY_KEYS[new Date().getDay()];
  const slots = key ? [...(getTimetableForCurrentSemester()[key] || [])] : [];
  slots.sort((a, b) => String(a.time).localeCompare(String(b.time)));

  const classesHtml = slots.length
    ? `<ul class="today-list">${slots
        .map(s => `<li><span class="today-time">${escapeHtml(s.time)}</span>${escapeHtml(s.subject)}</li>`)
        .join("")}</ul>`
    : `<p class="today-empty">${key ? "Nenhuma aula cadastrada para hoje." : "Fim de semana, sem aulas. 😌"}</p>`;

  const deadlines = getNextDeadlines();
  const deadlinesHtml = deadlines.length
    ? `<ul class="today-list">${deadlines
        .map(d => `<li><span class="today-when today-when-${d.days <= 2 ? "soon" : "later"}">${relativeDayText(d.days)}</span>${escapeHtml(d.label)}${d.subject ? ` · <em>${escapeHtml(d.subject)}</em>` : ""}</li>`)
        .join("")}</ul>`
    : `<p class="today-empty">Nenhum prazo pela frente. Aproveite!</p>`;

  todayPanel.innerHTML = `
    <div class="today-col">
      <h3>🕒 Aulas de hoje</h3>
      ${classesHtml}
    </div>
    <div class="today-col">
      <h3>⏳ Em breve</h3>
      ${deadlinesHtml}
    </div>
  `;
}


// =====================================================
// APARÊNCIA: COR PRINCIPAL E FUNDO (vale nos modos dia e noite)
// =====================================================

const DEFAULT_ACCENT = "#6d63e8";

const ACCENT_PRESETS = [
  { name: "Roxo-azulado", value: "#6d63e8" },
  { name: "Azul", value: "#2563eb" },
  { name: "Lilás", value: "#9333ea" },
  { name: "Rosa", value: "#db2777" },
  { name: "Vermelho", value: "#dc2626" },
  { name: "Laranja", value: "#c2410c" },
  { name: "Verde", value: "#15803d" },
  { name: "Turquesa", value: "#0f766e" }
];

const BACKGROUND_STYLES = [
  { id: "padrao", name: "Padrão", hint: "Azul-marinho à noite, cinza-claro de dia" },
  { id: "cor", name: "Combinando com a cor", hint: "O fundo ganha um toque da cor escolhida" },
  { id: "neutro", name: "Neutro", hint: "Cinzas sem cor, mais sóbrio" },
  { id: "preto", name: "Preto total", hint: "Só no modo noite. Bom para telas OLED" }
];

const accentSwatches = document.getElementById("accentSwatches");
const accentCustomInput = document.getElementById("accentCustomInput");
const backgroundOptions = document.getElementById("backgroundOptions");
const resetAppearanceBtn = document.getElementById("resetAppearanceBtn");
const appearanceStatus = document.getElementById("appearanceStatus");

function normalizeHex(value) {
  const v = String(value || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(v)) return v;
  if (/^#[0-9a-f]{3}$/.test(v)) {
    return "#" + v.slice(1).split("").map(c => c + c).join("");
  }
  return null;
}

function relativeLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => {
    const x = c / 255;
    return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

function contrastWithWhite(hex) {
  return 1.05 / (relativeLuminance(hex) + 0.05);
}

function getAppearance() {
  const a = state.appearance || {};
  const accent = normalizeHex(a.accent) || DEFAULT_ACCENT;
  const background = BACKGROUND_STYLES.some(b => b.id === a.background)
    ? a.background
    : "padrao";
  return { accent, background };
}

function applyAppearance() {
  const { accent, background } = getAppearance();
  const root = document.documentElement;

  root.style.setProperty("--accent", accent);
  // texto em cima da cor: branco, ou escuro se a cor for muito clara
  root.style.setProperty(
    "--on-accent",
    contrastWithWhite(accent) >= 3 ? "#ffffff" : "#111827"
  );

  document.body.dataset.bg = background;

  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", accent);
}

function setAppearance(changes, message) {
  state.appearance = { ...getAppearance(), ...changes };
  saveState();
  applyAppearance();
  renderAppearanceControls();
  if (appearanceStatus && message) appearanceStatus.textContent = message;
}

function renderAppearanceControls() {
  const { accent, background } = getAppearance();

  if (accentSwatches) {
    accentSwatches.innerHTML = "";

    ACCENT_PRESETS.forEach(preset => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "accent-swatch";
      btn.style.setProperty("--swatch", preset.value);
      btn.setAttribute("aria-label", preset.name);
      btn.setAttribute("aria-pressed", String(preset.value === accent));
      btn.title = preset.name;
      btn.innerHTML = `<span class="accent-swatch-dot"></span><span class="accent-swatch-name">${preset.name}</span>`;
      btn.addEventListener("click", () =>
        setAppearance({ accent: preset.value }, `Cor alterada para ${preset.name}.`)
      );
      accentSwatches.appendChild(btn);
    });
  }

  if (accentCustomInput) {
    accentCustomInput.value = accent;
    const isPreset = ACCENT_PRESETS.some(p => p.value === accent);
    const wrap = accentCustomInput.closest(".accent-custom");
    if (wrap) wrap.classList.toggle("is-active", !isPreset);
  }

  if (backgroundOptions) {
    backgroundOptions.innerHTML = "";

    BACKGROUND_STYLES.forEach(style => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "bg-option";
      btn.dataset.preview = style.id;
      btn.setAttribute("aria-pressed", String(style.id === background));
      btn.innerHTML = `
        <span class="bg-option-preview" aria-hidden="true">
          <span class="bg-option-side"></span>
          <span class="bg-option-main"><span class="bg-option-card"></span><span class="bg-option-card"></span></span>
        </span>
        <span class="bg-option-text"><strong>${style.name}</strong><small>${style.hint}</small></span>
      `;
      btn.addEventListener("click", () =>
        setAppearance({ background: style.id }, `Fundo alterado para “${style.name}”.`)
      );
      backgroundOptions.appendChild(btn);
    });
  }
}

if (accentCustomInput) {
  // aplica enquanto arrasta, salva ao soltar
  accentCustomInput.addEventListener("input", () => {
    const hex = normalizeHex(accentCustomInput.value);
    if (!hex) return;
    document.documentElement.style.setProperty("--accent", hex);
    document.documentElement.style.setProperty(
      "--on-accent",
      contrastWithWhite(hex) >= 3 ? "#ffffff" : "#111827"
    );
  });

  accentCustomInput.addEventListener("change", () => {
    const hex = normalizeHex(accentCustomInput.value);
    if (!hex) return;
    const light = relativeLuminance(hex) > 0.55;
    setAppearance(
      { accent: hex },
      light
        ? "Cor personalizada salva. Ela é bem clara: no modo dia alguns textos podem ficar difíceis de ler."
        : "Cor personalizada salva."
    );
  });
}

if (resetAppearanceBtn) {
  resetAppearanceBtn.addEventListener("click", () =>
    setAppearance(
      { accent: DEFAULT_ACCENT, background: "padrao" },
      "Aparência voltou ao padrão (roxo-azulado)."
    )
  );
}


// =====================================================
// APP NO CELULAR (PWA): instalação e funcionamento offline
// =====================================================

const installAppBtn = document.getElementById("installAppBtn");
const installAppStatus = document.getElementById("installAppStatus");
const installIosSteps = document.getElementById("installIosSteps");

let deferredInstallPrompt = null;

function isRunningAsApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

function isIos() {
  const ua = navigator.userAgent || "";
  return /iphone|ipad|ipod/i.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isMobileScreen() {
  return window.matchMedia("(max-width: 820px)").matches;
}

function canOfferInstall() {
  return !isRunningAsApp() && (deferredInstallPrompt !== null || isIos());
}

function renderInstallCard() {
  if (!installAppBtn) return;

  if (installIosSteps) installIosSteps.hidden = true;

  if (isRunningAsApp()) {
    installAppBtn.hidden = true;
    if (installAppStatus) {
      installAppStatus.textContent = "✅ Você já está usando o app instalado.";
    }
    return;
  }

  if (deferredInstallPrompt) {
    installAppBtn.hidden = false;
    if (installAppStatus) installAppStatus.textContent = "";
    return;
  }

  if (isIos()) {
    installAppBtn.hidden = true;
    if (installIosSteps) installIosSteps.hidden = false;
    if (installAppStatus) installAppStatus.textContent = "";
    return;
  }

  installAppBtn.hidden = true;
  if (installAppStatus) {
    installAppStatus.textContent =
      "Abra este site no navegador do celular (Chrome no Android ou Safari no iPhone) para instalar. No computador, o Chrome e o Edge mostram um ícone de instalar na barra de endereço.";
  }
}

async function promptInstall() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    if (installAppStatus && choice && choice.outcome === "accepted") {
      installAppStatus.textContent = "App instalado! Procure o ícone “Organizador” na tela inicial.";
    }
    renderInstallCard();
    renderNotices();
    return;
  }

  // iPhone: não existe botão automático, então leva às instruções
  goToView("config");
  setTimeout(() => {
    const card = document.querySelector(".install-card");
    if (card) card.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 150);
}

function appendInstallNotice() {
  if (!appNotices) return;
  if (!isMobileScreen() || !canOfferInstall() || state.installNoticeDismissed) return;

  appNotices.appendChild(
    makeNotice(
      "info",
      "📱",
      "<strong>Instale o Organizador no seu celular.</strong> Ele ganha um ícone na tela inicial, abre em tela cheia e funciona sem internet.",
      [
        { label: isIos() ? "Como instalar" : "Instalar app", primary: true, onClick: promptInstall },
        {
          label: "Agora não",
          onClick: () => {
            state.installNoticeDismissed = true;
            saveState();
            renderNotices();
          }
        }
      ]
    )
  );
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredInstallPrompt = event;
  renderInstallCard();
  renderNotices();
});

window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  renderInstallCard();
  renderNotices();
});

if (installAppBtn) {
  installAppBtn.addEventListener("click", promptInstall);
}

// registra o service worker (só funciona em https, como no GitHub Pages)
if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // sem service worker o site continua funcionando normalmente
    });
  });
}

// Avisos sempre atualizados ao voltar para a Capa
navButtons.forEach(button => {
  button.addEventListener("click", () => {
    if (button.dataset.view === "capa") {
      renderTodayPanel();
      renderNotices();
    }
  });
});

// =====================================================
// INICIALIZAÇÃO
// =====================================================

ensureSemesterMaps();

migrateLegacyDataIfNeeded();

ensureConfigState();


currentSemester =
  Number(
    state.currentSemester ||
    currentSemester ||
    5
  );


if (
  currentSemester >
  state.totalSemesters
) {

  currentSemester =
    state.totalSemesters;
}


if (
  currentSemester < 1
) {

  currentSemester =
    1;
}


state.currentSemester =
  currentSemester;


saveState();

applyTheme();

// Garante nome e data já no primeiro frame da Capa.
renderProfileGreeting();

initCalendar();

renderAll();
