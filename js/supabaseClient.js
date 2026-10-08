// ---------- Supabase Client Initialization ----------
const SUPABASE_URL = "https://gliocaqlusnrxplfyqeu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsaW9jYXFsdXNucnhwbGZ5cWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkwMzIyOTcsImV4cCI6MjEwNDYwODI5N30.mgbmA5P3Bedf6ccVslvOjcsA7xDKehv3IqM3LSTTojQ";

let sb = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
  try {
    sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (err) {
    console.warn("Supabase initialization failed, running in local fallback mode:", err);
  }
} else {
  console.warn("Supabase SDK not loaded, running in local fallback mode.");
}

// Fallback Mock Data for Offline / Review mode
const FALLBACK_DATA = {
  profile: {
    id: "demo-user-123",
    name: "Алексей Иванов",
    track: "Веб-разработка с AI",
    avatar_initials: "АИ",
    notify_reminders: true,
    notify_weekly_summary: true,
    public_profile: false,
    has_seen_onboarding: true
  },
  lessons: [
    {
      id: "l1",
      title: "Основы вайб-кодинга в Cursor",
      module: "Модуль 1: Интерактивная разработка",
      tool: "Cursor",
      desc: "Использование Composer и Chat для генерации верстки и логики приложения.",
      status: "done",
      date: "вчера",
      content: {
        what: "Cursor — это форк VS Code с глубокой интеграцией AI-моделей (Claude 3.5 Sonnet, GPT-4o). Позволяет править код прямо в редакторе по нажатию Cmd+I или генерацией всего проекта через Composer.",
        useFor: "Написание кода с нуля, быстрый рефакторинг, поиск багов в проекте и объяснение архитектуры.",
        start: "1. Скачай Cursor с сайта cursor.com\n2. Открой папку проекта\n3. Нажми Cmd+K (или Ctrl+K) в файле для вызова AI.",
        task: "1. Создай простой файл index.html\n2. Используй Cmd+K и попроси Cursor: «Создай кнопку с градиентом и анимацией при наведении»\n3. Проверь результат в браузере."
      }
    },
    {
      id: "l2",
      title: "Быстрый старт в Replit & AI Agent",
      module: "Модуль 1: Интерактивная разработка",
      tool: "Replit",
      desc: "Создание и публикация веб-сервисов в один клик без настройки локального окружения.",
      status: "progress",
      date: "сегодня",
      content: {
        what: "Replit — облачная среда разработки с AI-агентом, который умеет сам устанавливать зависимости, править файлы и деплоить готовый сайт.",
        useFor: "Прототипирование, демонстрация проектов клиентам, быстрая разработка без установки Node.js/Python на ПК.",
        start: "1. Зайди на replit.com\n2. Нажми 'Create Repl'\n3. Выбери шаблон HTML/JS или попроси Agent собрать проект по промпту.",
        task: "1. Запусти Replit Agent\n2. Напиши промпт: «Создай приложение-таймер обратного отсчета»\n3. Опубликуй веб-приложение."
      }
    },
    {
      id: "l3",
      title: "Промпт-инжиниринг с Claude 3.5 Sonnet",
      module: "Модуль 2: Логика и Генерация UI",
      tool: "Claude",
      desc: "Как формулировать контекст и системные инструкции для построения сложных алгоритмов.",
      status: "pending",
      date: "—",
      content: {
        what: "Claude 3.5 Sonnet от Anthropic — сильнейшая модель для программирования и работы с логикой UI.",
        useFor: "Архитектура приложений, написание сложных алгоритмов и генерация компонентов с помощью Artifacts.",
        start: "1. Зарегистрируйся на claude.ai\n2. Используй Artifacts для просмотра генерируемого интерфейса в реальном времени.",
        task: "1. Попроси Claude сгенерировать интерактивную таблицу с сортировкой на чистом JS.\n2. Вставь результат в проект."
      }
    },
    {
      id: "l4",
      title: "Генерация интерфейсов в v0 by Vercel",
      module: "Модуль 2: Логика и Генерация UI",
      tool: "v0",
      desc: "Создание реактивных Tailwind CSS компонентов по текстовому описанию.",
      status: "pending",
      date: "—",
      content: {
        what: "v0 — генеративный UI-инструмент от Vercel, который создает красивые React / Tailwind компоненты по промпту.",
        useFor: "Создание карточек, форм, дашбордов и модальных окон за считанные секунды.",
        start: "1. Перейди на v0.dev\n2. Введи описание нужного элемента интерфейса.",
        task: "1. Сгенерируй дашборд с графиком\n2. Скопируй код в проект."
      }
    },
    {
      id: "l5",
      title: "Работа с Gemini 1.5 Pro в Google AI Studio",
      module: "Модуль 3: Продвинутые AI-инструменты",
      tool: "Google AI Studio",
      desc: "Использование огромного контекстного окна 2M токенов для анализа больших кодовых баз.",
      status: "pending",
      date: "—",
      content: {
        what: "Google AI Studio дает бесплатный доступ к моделям Gemini 1.5 Pro с контекстом в 2 миллиона токенов.",
        useFor: "Анализ целых репозиториев, чтение длинной документации и написание API интеграций.",
        start: "1. Открой aistudio.google.com\n2. Загрузи ZIP-архив с проектом или PDF-документацию.",
        task: "1. Загрузи файл index.html\n2. Попроси AI Studio найти потенциальные проблемы производительности."
      }
    }
  ],
  activityLog: [
    { date: new Date(Date.now() - 86400000 * 3), minutes: 45 },
    { date: new Date(Date.now() - 86400000 * 2), minutes: 30 },
    { date: new Date(Date.now() - 86400000 * 1), minutes: 50 },
    { date: new Date(), minutes: 25 }
  ]
};
