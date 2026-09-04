// --------- ESTRUTURA DE DADOS E ESTADO ---------
const STORAGE_KEY = "organizador_faculdade_v2";

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Estado inicial com alguns exemplos. Você pode editar depois direto no site.
const defaultState = {
  theme: "dark",

  // salva o semestre atual escolhido no topo
  currentSemester: 5,
  totalSemesters: 5,
  courseName: "",

  subjects: [
    {
      id: "animacao3d",
      name: "Animação 3D",
      semester: 5,
      grades: { t1: null, p1: null, t2: null, p2: null },
      works: [
        {
          id: "animacao3d_w1",
          description: "",
          done: false,
          inProgress: false,
          delivered: false,
          difficulty: "medio",
          dueDate: null
        },
        {
          id: "animacao3d_w2",
          description: "",
          done: false,
          inProgress: false,
          delivered: false,
          difficulty: "medio",
          dueDate: null
        }
      ],
      exams: [
        {
          id: "animacao3d_e1",
          description: "",
          done: false,
          date: null
        },
        {
          id: "animacao3d_e2",
          description: "",
          done: false,
          date: null
        }
      ],
      lessons: [
        {
          id: "animacao3d_l1",
          title: "Princípios de animação",
          done: false
        },
        {
          id: "animacao3d_l2",
          title: "Ciclo de caminhada",
          done: false
        }
      ]
    },

    {
      id: "leveldesign",
      name: "Level Design",
      semester: 5,
      grades: {
        t1: null,
        p1: null,
        t2: null,
        p2: null
      },
      works: [
        {
          id: "leveldesign_w1",
          description: "",
          done: false,
          inProgress: false,
          delivered: false,
          difficulty: "medio",
          dueDate: null
        },
        {
          id: "leveldesign_w2",
          description: "",
          done: false,
          inProgress: false,
          delivered: false,
          difficulty: "medio",
          dueDate: null
        }
      ],
      exams: [
        {
          id: "leveldesign_e1",
          description: "",
          done: false,
          date: null
        },
        {
          id: "leveldesign_e2",
          description: "",
          done: false,
          date: null
        }
      ],
      lessons: [
        {
          id: "leveldesign_l1",
          title: "Kishotenketsu",
          done: false
        }
      ]
    }
  ],

  importantDatesBySemester: {},

  timetableBySemester: {},

  materialsBySubject: {}
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


function ensureMaterialsState() {

  if (
    !state.materialsBySubject ||
    typeof state.materialsBySubject !==
      "object"
  ) {

    state.materialsBySubject = {};
  }
}


function renderConfigFields() {

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

  noticias:
    document.getElementById(
      "view-noticias"
    ),

  config:
    document.getElementById(
      "view-config"
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


const newsCenter =
  document.getElementById(
    "newsCenter"
  );


const newsSubjects =
  document.getElementById(
    "newsSubjects"
  );


const newsPanel =
  document.getElementById(
    "newsPanel"
  );


const materialSubjectSelect =
  document.getElementById(
    "materialSubjectSelect"
  );


const materialNameInput =
  document.getElementById(
    "materialNameInput"
  );


const materialUrlInput =
  document.getElementById(
    "materialUrlInput"
  );


const saveMaterialBtn =
  document.getElementById(
    "saveMaterialBtn"
  );


const materialStatus =
  document.getElementById(
    "materialStatus"
  );


const materialsListConfig =
  document.getElementById(
    "materialsListConfig"
  );


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
        "Modo claro";
    }

  } else {

    document.body.classList.remove(
      "light"
    );


    if (themeToggleBtn) {
      themeToggleBtn.textContent =
        "Modo escuro";
    }
  }
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
// NOTÍCIAS E CONTEÚDOS
// =====================================================

function renderNews() {

  if (
    !newsCenter ||
    !newsSubjects ||
    !newsPanel
  ) {
    return;
  }


  const subjects =
    getSubjectsForCurrentSemester();


  newsCenter.textContent =
    state.courseName &&
    state.courseName.trim()
      ? state.courseName
      : "Curso";


  newsSubjects.innerHTML = "";


  if (!subjects.length) {

    newsPanel.innerHTML = `

      <h3>
        Nenhuma matéria neste semestre
      </h3>

      <p>
        Não há matérias cadastradas
        para o semestre selecionado.
      </p>

      <p>
        Selecione outro semestre ou
        adicione matérias primeiro.
      </p>

    `;

    return;
  }


  newsPanel.innerHTML = `

    <p>
      Selecione uma matéria para
      visualizar conteúdos.
    </p>

  `;


  const total =
    subjects.length;


  const radius =
    Math.max(
      180,
      total * 30
    );


  subjects.forEach(
    (subject, index) => {

      const angle =
        (index / total) *
          (2 * Math.PI) -
        Math.PI / 2;


      const x =
        radius *
        Math.cos(angle);


      const y =
        radius *
        Math.sin(angle);


      const div =
        document.createElement(
          "div"
        );


      div.className =
        "news-subject";


      div.textContent =
        subject.name;


      div.style.position =
        "absolute";


      div.style.left =
        `calc(50% + ${x}px - 80px)`;


      div.style.top =
        `calc(45% + ${y}px - 25px)`;


      div.addEventListener(
        "click",
        () => {

          renderNewsPanel(
            subject
          );
        }
      );


      newsSubjects.appendChild(
        div
      );
    }
  );
}


function renderNewsPanel(subject) {

  if (!newsPanel) return;


  ensureMaterialsState();


  const materials =
    state.materialsBySubject[
      subject.id
    ] || [];


  let materialsHtml = "";


  if (materials.length) {

    materialsHtml = `

      <h4 style="margin-top:10px;">
        Materiais em PDF
      </h4>

      <ul
        style="
          margin-top:6px;
          padding-left:18px;
        "
      >

        ${materials
          .map(
            material => `

              <li
                style="
                  margin-bottom:6px;
                "
              >

                <a
                  href="${material.url}"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="
                    color:inherit;
                    text-decoration:underline;
                  "
                >
                  ${material.name}
                </a>

              </li>

            `
          )
          .join("")}

      </ul>

    `;

  } else {

    materialsHtml = `

      <h4 style="margin-top:10px;">
        Materiais em PDF
      </h4>

      <p style="margin-top:6px;">
        Nenhum PDF cadastrado para
        esta matéria ainda.
      </p>

    `;
  }


  newsPanel.innerHTML = `

    <h3>
      ${subject.name}
    </h3>

    <p>
      Conteúdos disponíveis para
      esta matéria:
    </p>


    ${materialsHtml}


    <div style="margin-top:12px;">

      <p>
        Em breve você verá aqui também:
      </p>

      <ul
        style="
          padding-left:18px;
          margin-top:6px;
        "
      >

        <li>Links e artigos</li>

        <li>Vídeos</li>

        <li>Notícias</li>

      </ul>

    </div>

  `;
}


// =====================================================
// SELECT DE MATERIAIS
// =====================================================

function populateMaterialSubjectSelect() {

  if (!materialSubjectSelect) {
    return;
  }


  const previousValue =
    materialSubjectSelect.value ||
    "";


  materialSubjectSelect.innerHTML =
    `<option value="">
      Selecione a matéria
    </option>`;


  const sortedSubjects =
    [...state.subjects].sort(
      (a, b) => {

        if (
          a.semester !==
          b.semester
        ) {

          return (
            a.semester -
            b.semester
          );
        }


        return a.name.localeCompare(
          b.name
        );
      }
    );


  sortedSubjects.forEach(
    subject => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        subject.id;


      option.textContent =
        `${subject.name} (${subject.semester}º semestre)`;


      materialSubjectSelect.appendChild(
        option
      );
    }
  );


  const exists =
    [
      ...materialSubjectSelect.options
    ].some(
      opt =>
        opt.value ===
        previousValue
    );


  if (exists) {

    materialSubjectSelect.value =
      previousValue;
  }
}


// =====================================================
// LISTA DE MATERIAIS NA CONFIGURAÇÃO
// =====================================================

function renderMaterialsListConfig() {

  if (!materialsListConfig) {
    return;
  }


  materialsListConfig.innerHTML =
    "";


  ensureMaterialsState();


  const allSubjects =
    [...state.subjects];


  let hasAny =
    false;


  allSubjects.forEach(
    subject => {

      const materials =
        state.materialsBySubject[
          subject.id
        ] || [];


      if (!materials.length) {
        return;
      }


      hasAny =
        true;


      const titleLi =
        document.createElement(
          "li"
        );


      titleLi.style.marginTop =
        "8px";


      titleLi.innerHTML =
        `<strong>${subject.name}</strong>`;


      materialsListConfig.appendChild(
        titleLi
      );


      materials.forEach(
        material => {

          const li =
            document.createElement(
              "li"
            );


          li.style.marginLeft =
            "12px";


          const link =
            document.createElement(
              "a"
            );


          link.href =
            material.url;


          link.target =
            "_blank";


          link.rel =
            "noopener noreferrer";


          link.textContent =
            material.name;


          link.style.color =
            "inherit";


          link.style.textDecoration =
            "underline";


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

              state
                .materialsBySubject[
                  subject.id
                ] =
                (
                  state
                    .materialsBySubject[
                      subject.id
                    ] || []
                ).filter(
                  item =>
                    item.id !==
                    material.id
                );


              saveState();

              renderMaterialsListConfig();

              renderNews();
            }
          );


          li.appendChild(link);

          li.appendChild(
            document.createTextNode(
              " "
            )
          );

          li.appendChild(
            deleteBtn
          );


          materialsListConfig.appendChild(
            li
          );
        }
      );
    }
  );


  if (!hasAny) {

    const li =
      document.createElement(
        "li"
      );


    li.textContent =
      "Nenhum material em PDF cadastrado ainda.";


    materialsListConfig.appendChild(
      li
    );
  }
}


// =====================================================
// SALVAR MATERIAL
// =====================================================

if (saveMaterialBtn) {

  saveMaterialBtn.addEventListener(
    "click",
    () => {

      ensureMaterialsState();


      const subjectId =
        materialSubjectSelect
          ? materialSubjectSelect.value
          : "";


      const materialName =
        materialNameInput
          ? materialNameInput.value.trim()
          : "";


      const materialUrl =
        materialUrlInput
          ? materialUrlInput.value.trim()
          : "";


      if (
        !subjectId ||
        !materialName ||
        !materialUrl
      ) {

        if (materialStatus) {

          materialStatus.textContent =
            "Preencha a matéria, o nome do material e o link do PDF.";
        }

        return;
      }


      if (
        !state.materialsBySubject[
          subjectId
        ]
      ) {

        state.materialsBySubject[
          subjectId
        ] = [];
      }


      state.materialsBySubject[
        subjectId
      ].push({

        id:
          "mat_" +
          Date.now(),

        name:
          materialName,

        url:
          materialUrl

      });


      saveState();


      if (materialNameInput) {

        materialNameInput.value =
          "";
      }


      if (materialUrlInput) {

        materialUrlInput.value =
          "";
      }


      renderMaterialsListConfig();


      if (materialStatus) {

        materialStatus.textContent =
          "Material salvo com sucesso.";
      }
    }
  );
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
      finalGrade >= 6
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

          <div>
            <span>
              Trabalho 1
            </span>

            <strong>
              ${grades.t1 ?? "-"}
            </strong>
          </div>


          <div>
            <span>
              Prova 1
            </span>

            <strong>
              ${grades.p1 ?? "-"}
            </strong>
          </div>


          <div>
            <span>
              Trabalho 2
            </span>

            <strong>
              ${grades.t2 ?? "-"}
            </strong>
          </div>


          <div>
            <span>
              Prova 2
            </span>

            <strong>
              ${grades.p2 ?? "-"}
            </strong>
          </div>

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

            Trabalho 1:
            ${grades.t1 ?? "-"}

            |

            Prova 1:
            ${grades.p1 ?? "-"}

            |

            Trabalho 2:
            ${grades.t2 ?? "-"}

            |

            Prova 2:
            ${grades.p2 ?? "-"}

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

function computeFinalGrade(grades) {

  if (!grades) {
    return null;
  }


  const t1 =
    toNumber(
      grades.t1
    );

  const p1 =
    toNumber(
      grades.p1
    );

  const t2 =
    toNumber(
      grades.t2
    );

  const p2 =
    toNumber(
      grades.p2
    );


  const result =
    (
      (t1 + p1) * 2 +
      (t2 + p2) * 3
    ) / 5;


  if (
    isNaN(result)
  ) {

    return null;
  }


  return result;
}


function renderGrades() {

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

        subject.grades = {

          t1:
            null,

          p1:
            null,

          t2:
            null,

          p2:
            null

        };
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


      const fields = [

        {
          key:
            "t1",

          label:
            "Trabalho 1",

          part:
            "part1"
        },

        {
          key:
            "p1",

          label:
            "Prova 1",

          part:
            "part1"
        },

        {
          key:
            "t2",

          label:
            "Trabalho 2",

          part:
            "part2"
        },

        {
          key:
            "p2",

          label:
            "Prova 2",

          part:
            "part2"
        }

      ];


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


      const finalGrade =
        computeFinalGrade(
          subject.grades
        );


      const finalDiv =
        document.createElement(
          "div"
        );


      finalDiv.className =
        "final-grade";


      if (
        finalGrade === null ||
        isNaN(
          finalGrade
        )
      ) {

        finalDiv.textContent =
          "Média final: -";

      } else {

        const rounded =
          finalGrade.toFixed(
            2
          );


        finalDiv.textContent =
          `Média final: ${rounded}`;


        const statusBadge =
          document.createElement(
            "span"
          );


        statusBadge.className =
          "badge " +
          (
            finalGrade >= 6
              ? "badge-status-ok"
              : "badge-status-bad"
          );


        statusBadge.textContent =
          finalGrade >= 6
            ? "Aprovado (parcial)"
            : "Atenção";


        finalDiv.appendChild(
          statusBadge
        );
      }


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


          if (
            state
              .materialsBySubject[
                subject.id
              ]
          ) {

            delete state
              .materialsBySubject[
                subject.id
              ];
          }


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

            ensureMaterialsState();


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
          "noticias"
        ) {

          renderNews();
        }


        if (
          viewName ===
          "config"
        ) {

          populateSummarySemesterSelect();

          populateMaterialSubjectSelect();

          renderMaterialsListConfig();
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

  ensureSemesterMaps();

  ensureMaterialsState();


  renderSemesterOptions();

  renderConfigFields();

  populateSummarySemesterSelect();

  populateMaterialSubjectSelect();


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

  renderMaterialsListConfig();

  renderNews();


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
// INICIALIZAÇÃO
// =====================================================

ensureSemesterMaps();

migrateLegacyDataIfNeeded();

ensureConfigState();

ensureMaterialsState();


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

initCalendar();

renderAll();
