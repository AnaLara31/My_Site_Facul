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
          delivered: false,
          difficulty: "medio",
          dueDate: null
        },
        {
          id: "animacao3d_w2",
          description: "",
          done: false,
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
          delivered: false,
          difficulty: "medio",
          dueDate: null
        },
        {
          id: "leveldesign_w2",
          description: "",
          done: false,
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
                      : "summary-status-pending"
                  }
                "
              >

                ${
                  work.done
                    ? "Concluído"
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
// ELEMENTOS DA CAPA
// =====================================================

const progressCircle =
  document.getElementById(
    "progressCircle"
  );


const progressText =
  document.getElementById(
    "progressText"
  );


const progressLabel =
  document.getElementById(
    "progressLabel"
  );


const subjectCount =
  document.getElementById(
    "subjectCount"
  );


const workCount =
  document.getElementById(
    "workCount"
  );


const examCount =
  document.getElementById(
    "examCount"
  );


const gradeSummary =
  document.getElementById(
    "gradeSummary"
  );


const semesterStatusList =
  document.getElementById(
    "semesterStatusList"
  );


const importantDatesList =
  document.getElementById(
    "importantDatesList"
  );


const importantDateInput =
  document.getElementById(
    "importantDateInput"
  );


const importantDateLabel =
  document.getElementById(
    "importantDateLabel"
  );


const addImportantDateBtn =
  document.getElementById(
    "addImportantDateBtn"
  );


const upcomingDeadlines =
  document.getElementById(
    "upcomingDeadlines"
  );


// =====================================================
// CALENDÁRIO
// =====================================================

const calendarGrid =
  document.getElementById(
    "calendarGrid"
  );


const calendarMonthLabel =
  document.getElementById(
    "calendarMonthLabel"
  );


const calendarYearSelect =
  document.getElementById(
    "calendarYearSelect"
  );


const prevMonthBtn =
  document.getElementById(
    "prevMonthBtn"
  );


const nextMonthBtn =
  document.getElementById(
    "nextMonthBtn"
  );


let calendarDate =
  new Date();


// =====================================================
// HORÁRIO
// =====================================================

const timetableBody =
  document.getElementById(
    "timetableBody"
  );


const timetableDayInput =
  document.getElementById(
    "timetableDayInput"
  );


const timetableTimeInput =
  document.getElementById(
    "timetableTimeInput"
  );


const timetableSubjectInput =
  document.getElementById(
    "timetableSubjectInput"
  );


const addTimetableBtn =
  document.getElementById(
    "addTimetableBtn"
  );


// =====================================================
// NOTAS
// =====================================================

const gradesTableBody =
  document.getElementById(
    "gradesTableBody"
  );


// =====================================================
// TRABALHOS
// =====================================================

const worksList =
  document.getElementById(
    "worksList"
  );


// =====================================================
// PROVAS
// =====================================================

const examsList =
  document.getElementById(
    "examsList"
  );


// =====================================================
// MATÉRIAS
// =====================================================

const subjectsList =
  document.getElementById(
    "subjectsList"
  );


const subjectNameInput =
  document.getElementById(
    "subjectNameInput"
  );


const subjectSemesterInput =
  document.getElementById(
    "subjectSemesterInput"
  );


const addSubjectBtn =
  document.getElementById(
    "addSubjectBtn"
  );


// =====================================================
// BACKUP
// =====================================================

const exportBtn =
  document.getElementById(
    "exportBtn"
  );


const importInput =
  document.getElementById(
    "importInput"
  );


const backupStatus =
  document.getElementById(
    "backupStatus"
  );


// =====================================================
// NAVEGAÇÃO
// =====================================================

navButtons.forEach(
  btn => {

    btn.addEventListener(
      "click",
      () => {

        const viewName =
          btn.dataset.view;


        navButtons.forEach(
          button =>
            button.classList.remove(
              "active"
            )
        );


        btn.classList.add(
          "active"
        );


        Object.values(
          views
        ).forEach(
          view => {

            if (view) {

              view.classList.remove(
                "active"
              );
            }
          }
        );


        if (
          views[viewName]
        ) {

          views[
            viewName
          ].classList.add(
            "active"
          );
        }


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

          populateMaterialSubjectSelect();

          renderMaterialsListConfig();

          populateSummarySemesterSelect();
        }
      }
    );
  }
);


// =====================================================
// TROCA DE SEMESTRE GLOBAL
// =====================================================

if (
  globalSemesterSelect
) {

  globalSemesterSelect
    .addEventListener(
      "change",
      () => {

        const selected =
          Number(
            globalSemesterSelect.value
          );


        if (
          !selected ||
          selected < 1
        ) {

          return;
        }


        currentSemester =
          selected;


        state.currentSemester =
          selected;


        saveState();


        renderAll();
      }
    );
}


// =====================================================
// HELPERS DE MATÉRIAS
// =====================================================

function getSubjectsForCurrentSemester() {

  return state.subjects.filter(
    subject =>
      Number(
        subject.semester
      ) ===
      Number(
        currentSemester
      )
  );
}


function getSubjectById(id) {

  return state.subjects.find(
    subject =>
      subject.id === id
  );
}


function makeId(prefix) {

  return (
    prefix +
    "_" +
    Date.now() +
    "_" +
    Math.floor(
      Math.random() * 10000
    )
  );
}


// =====================================================
// CÁLCULO DA MÉDIA
// =====================================================

function computeFinalGrade(
  grades
) {

  if (!grades) {
    return null;
  }


  const values = [
    grades.t1,
    grades.p1,
    grades.t2,
    grades.p2
  ];


  const valid =
    values.filter(
      value =>
        value !== null &&
        value !== "" &&
        !isNaN(
          Number(value)
        )
    );


  if (!valid.length) {
    return null;
  }


  const sum =
    valid.reduce(
      (acc, value) =>
        acc +
        Number(value),
      0
    );


  return (
    sum /
    valid.length
  );
}


// =====================================================
// RESUMO DA CAPA
// =====================================================

function updateSummary() {

  const subjects =
    getSubjectsForCurrentSemester();


  let totalLessons =
    0;


  let doneLessons =
    0;


  let totalWorks =
    0;


  let doneWorks =
    0;


  let totalExams =
    0;


  let doneExams =
    0;


  subjects.forEach(
    subject => {

      const lessons =
        subject.lessons || [];


      const works =
        subject.works || [];


      const exams =
        subject.exams || [];


      totalLessons +=
        lessons.length;


      doneLessons +=
        lessons.filter(
          lesson =>
            lesson.done
        ).length;


      totalWorks +=
        works.length;


      doneWorks +=
        works.filter(
          work =>
            work.done
        ).length;


      totalExams +=
        exams.length;


      doneExams +=
        exams.filter(
          exam =>
            exam.done
        ).length;
    }
  );


  const progress =
    totalLessons
      ? Math.round(
          (
            doneLessons /
            totalLessons
          ) * 100
        )
      : 0;


  if (progressText) {

    progressText.textContent =
      `${progress}%`;
  }


  if (progressLabel) {

    progressLabel.textContent =
      `${doneLessons} de ${totalLessons} aulas estudadas`;
  }


  if (progressCircle) {

    progressCircle.style.setProperty(
      "--progress",
      `${progress * 3.6}deg`
    );
  }


  if (subjectCount) {

    subjectCount.textContent =
      String(
        subjects.length
      );
  }


  if (workCount) {

    workCount.textContent =
      `${doneWorks}/${totalWorks}`;
  }


  if (examCount) {

    examCount.textContent =
      `${doneExams}/${totalExams}`;
  }


  const grades =
    subjects
      .map(
        subject =>
          computeFinalGrade(
            subject.grades
          )
      )
      .filter(
        grade =>
          grade !== null &&
          !isNaN(grade)
      );


  if (gradeSummary) {

    if (!grades.length) {

      gradeSummary.textContent =
        "-";

    } else {

      const average =
        grades.reduce(
          (acc, grade) =>
            acc + grade,
          0
        ) /
        grades.length;


      gradeSummary.textContent =
        average.toFixed(2);
    }
  }
}


// =====================================================
// STATUS DO SEMESTRE
// =====================================================

function renderSemesterStatus() {

  if (!semesterStatusList) {
    return;
  }


  semesterStatusList.innerHTML =
    "";


  const subjects =
    getSubjectsForCurrentSemester();


  if (!subjects.length) {

    const li =
      document.createElement(
        "li"
      );


    li.textContent =
      "Nenhuma matéria cadastrada neste semestre.";


    semesterStatusList.appendChild(
      li
    );


    return;
  }


  subjects.forEach(
    subject => {

      const lessons =
        subject.lessons || [];


      const works =
        subject.works || [];


      const exams =
        subject.exams || [];


      const total =
        lessons.length +
        works.length +
        exams.length;


      const done =
        lessons.filter(
          item =>
            item.done
        ).length +
        works.filter(
          item =>
            item.done
        ).length +
        exams.filter(
          item =>
            item.done
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


      const li =
        document.createElement(
          "li"
        );


      li.innerHTML = `

        <span>
          ${subject.name}
        </span>

        <span>
          ${percent}%
        </span>

      `;


      semesterStatusList.appendChild(
        li
      );
    }
  );
}


// =====================================================
// DATAS IMPORTANTES
// =====================================================

function renderImportantDatesList() {

  if (!importantDatesList) {
    return;
  }


  importantDatesList.innerHTML =
    "";


  const dates =
    [
      ...getImportantDatesForCurrentSemester()
    ].sort(
      (a, b) =>
        a.date.localeCompare(
          b.date
        )
    );


  if (!dates.length) {

    const li =
      document.createElement(
        "li"
      );


    li.textContent =
      "Nenhuma data importante cadastrada.";


    importantDatesList.appendChild(
      li
    );


    return;
  }


  dates.forEach(item => {

    const li =
      document.createElement(
        "li"
      );


    li.innerHTML = `

      <span>

        <strong>
          ${formatSummaryDate(item.date)}
        </strong>

        — ${item.label}

      </span>

    `;


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

        const sem =
          getSemesterKey();


        state
          .importantDatesBySemester[
            sem
          ] =
          getImportantDatesForCurrentSemester()
            .filter(
              date =>
                date.id !==
                item.id
            );


        saveState();

        renderImportantDatesList();

        renderCalendar();

        renderUpcomingDeadlines();
      }
    );


    li.appendChild(
      deleteBtn
    );


    importantDatesList.appendChild(
      li
    );
  });
}


if (
  addImportantDateBtn
) {

  addImportantDateBtn
    .addEventListener(
      "click",
      () => {

        const date =
          importantDateInput
            ? importantDateInput.value
            : "";


        const label =
          importantDateLabel
            ? importantDateLabel.value.trim()
            : "";


        if (
          !date ||
          !label
        ) {

          alert(
            "Informe a data e a descrição."
          );

          return;
        }


        const sem =
          getSemesterKey();


        if (
          !state
            .importantDatesBySemester[
              sem
            ]
        ) {

          state
            .importantDatesBySemester[
              sem
            ] = [];
        }


        state
          .importantDatesBySemester[
            sem
          ].push({

            id:
              makeId(
                "important"
              ),

            date,

            label

          });


        saveState();


        if (
          importantDateInput
        ) {

          importantDateInput.value =
            "";
        }


        if (
          importantDateLabel
        ) {

          importantDateLabel.value =
            "";
        }


        renderImportantDatesList();

        renderCalendar();

        renderUpcomingDeadlines();
      }
    );
}


// =====================================================
// INICIALIZAÇÃO DO CALENDÁRIO
// =====================================================

function initCalendar() {

  if (
    !calendarYearSelect
  ) {
    return;
  }


  const currentYear =
    new Date().getFullYear();


  calendarYearSelect.innerHTML =
    "";


  for (
    let year =
      currentYear - 5;

    year <=
      currentYear + 10;

    year++
  ) {

    const option =
      document.createElement(
        "option"
      );


    option.value =
      String(year);


    option.textContent =
      String(year);


    calendarYearSelect.appendChild(
      option
    );
  }


  calendarYearSelect.value =
    String(
      calendarDate.getFullYear()
    );
}


