/* ==========================================================================
   NVIDIA DLI Course Web Application Core Logic
   ========================================================================== */

(function () {
  let currentLessonIndex = 0;
  let currentLang = 'en';
  let lessons = window.COURSE_DATA || [];

  // UI Text Dictionary
  const i18n = {
    en: {
      searchPlaceholder: 'Search course modules & code...',
      courseOverview: 'Course Overview',
      onThisPage: 'ON THIS PAGE',
      documentation: 'Documentation',
      start: 'Start',
      modules: 'Modules',
      noMatching: 'No matching lessons found.',
      typeToSearch: 'Type to search course modules...',
      noSubHeaders: 'No sub-headers',
      searchTitle: 'Search course title, commands, parameters...',
      course: 'Course',
      backToOverview: 'Course Overview',
      breadcrumbCourse: 'Course',
      landingTitle: 'Learning Physical AI',
      landingDesc: 'A Sim-to-Real VLA Pipeline with Seeed reBot Arm and NVIDIA Isaac',
      landingModules: 'DETAILED MODULES',
      landingPipeline: 'FULL PIPELINE',
      landingChapters: 'CORE CHAPTERS',
      landingHours: '20+ Learning hours',
      landingLevel: 'Intermediate Level',
      startLearning: 'Start Learning Now',
      heroTitle: 'Learning<br>Physical AI',
      heroDesc: 'A Sim-to-Real VLA Pipeline with Seeed<br>reBot Arm and NVIDIA Isaac',
      brandTitle: 'A Sim-to-Real VLA Pipeline with Seeed reBot Arm and NVIDIA Isaac',
      stackTitle: 'Physical AI & VLA Model Technical Stack',
      stackSub: 'Master cutting-edge robotics learning pipelines with industry-grade software and hardware targets.',
      chaptersTitle: 'Course Curriculum',
      chaptersSub: 'Explore the complete 5-chapter, 19-module hands-on curriculum.',
      pipelineTitle: 'End-to-End Learning Pipeline',
      pipelineSub: 'From robot calibration to edge inference — a complete Sim-to-Real VLA workflow in six steps.',
      feature1Title: '1. Real & Sim Data Collection',
      feature1Desc: 'Gather teleoperation trajectories using Seeed reBot Arm B601-RS in physical environments and emulate dual-camera SO-ARM101 setups inside NVIDIA Isaac Sim.',
      feature2Title: '2. Cosmos Transfer Scene Augmentation',
      feature2Desc: 'Empower imitation learning policies using NVIDIA Cosmos3 Transfer video-to-video generative models with Canny edge & SAM2 segmentation control signals.',
      feature3Title: '3. Isaac GR00T 1.7 Fine-Tuning',
      feature3Desc: 'Train cross-embodiment Vision-Language-Action (VLA) models using System 2 VLM + System 1 Diffusion Transformer architecture on your custom robot dataset.',
      feature4Title: '4. Jetson TensorRT Acceleration',
      feature4Desc: 'Export ONNX graphs and compile a target-specific 7-engine TensorRT bundle on Jetson AGX Thor and Orin for real-time edge execution.',
    },
    zh: {
      searchPlaceholder: '搜索课程模块和代码...',
      courseOverview: '课程概览',
      onThisPage: '本页目录',
      documentation: '文档',
      start: '开始学习',
      modules: '个模块',
      noMatching: '未找到匹配的课程。',
      typeToSearch: '输入关键词搜索课程模块...',
      noSubHeaders: '无子标题',
      searchTitle: '搜索课程标题、命令、参数...',
      course: '课程',
      backToOverview: '课程概览',
      breadcrumbCourse: '课程',
      landingTitle: '学习具身智能',
      landingDesc: 'Seeed reBot Arm 与 NVIDIA Isaac 的 Sim-to-Real VLA 流水线',
      landingModules: '详细模块',
      landingPipeline: '完整流水线',
      landingChapters: '核心章节',
      landingHours: '20+ 学习小时',
      landingLevel: '中级水平',
      startLearning: '开始学习',
      heroTitle: '学习<br>具身智能',
      heroDesc: 'Seeed reBot Arm 与 NVIDIA Isaac<br>的 Sim-to-Real VLA 流水线',
      brandTitle: 'Seeed reBot Arm 与 NVIDIA Isaac 的 Sim-to-Real VLA 课程',
      stackTitle: 'Physical AI & VLA 模型技术栈',
      stackSub: '通过行业级软件和硬件平台，掌握前沿机器人学习流水线。',
      chaptersTitle: '课程大纲与模块',
      chaptersSub: '探索完整的 5 大章节、19 个实战模块课程。',
      pipelineTitle: '端到端学习流水线',
      pipelineSub: '从机械臂校准到边缘推理——完整的 Sim-to-Real VLA 六步工作流。',
      feature1Title: '1. 真实与仿真数据采集',
      feature1Desc: '在物理环境中使用 Seeed reBot Arm B601-RS 采集遥操作轨迹，并在 NVIDIA Isaac Sim 中模拟双摄像头 SO-ARM101 配置。',
      feature2Title: '2. Cosmos Transfer 场景增强',
      feature2Desc: '利用 NVIDIA Cosmos3 Transfer 视频到视频生成模型，结合 Canny 边缘和 SAM2 分割控制信号，增强模仿学习策略。',
      feature3Title: '3. Isaac GR00T 1.7 微调',
      feature3Desc: '在自定义机器人数据集上，使用 System 2 VLM + System 1 Diffusion Transformer 架构训练跨具身视觉-语言-动作（VLA）模型。',
      feature4Title: '4. Jetson TensorRT 加速部署',
      feature4Desc: '导出 ONNX 图并在 Jetson AGX Thor 与 Orin 上编译特定目标的 7 引擎 TensorRT 包，实现实时边缘执行。',
    }
  };

  function t(key) {
    return (i18n[currentLang] && i18n[currentLang][key]) || (i18n.en[key] || key);
  }

  // DOM Elements
  const landingView = document.getElementById('landing-view');
  const readerView = document.getElementById('reader-view');
  const chaptersGrid = document.getElementById('chapters-grid');
  const sidebarNav = document.getElementById('sidebar-nav-list');
  const markdownBody = document.getElementById('markdown-body');
  const breadcrumbText = document.getElementById('breadcrumb-text');
  const tocList = document.getElementById('toc-list');
  const prevLessonBtn = document.getElementById('prev-lesson-btn');
  const nextLessonBtn = document.getElementById('next-lesson-btn');
  
  // Modals
  const searchModal = document.getElementById('search-modal');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  const imageLightbox = document.getElementById('image-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');

  // Configure Marked parser
  marked.setOptions({
    gfm: true,
    breaks: true
  });

  // Initialize
  function init() {
    const savedLang = localStorage.getItem('dli_course_lang');
    const browserLang = (navigator.language || '').startsWith('zh') ? 'zh' : 'en';
    const initialLang = savedLang || browserLang;

    if (initialLang === 'zh') {
      currentLang = 'zh';
      lessons = window.COURSE_DATA_ZH || window.COURSE_DATA;
      const langBtn = document.getElementById('lang-toggle-btn');
      if (langBtn) {
        langBtn.textContent = 'EN';
        langBtn.title = 'Switch to English';
      }
    }

    renderLandingChapters();
    renderSidebarNav();
    setupEventListeners();
    updateLandingTexts();
    initCardInteractiveEffects();

    // Check URL hash for direct deep linking (e.g. #lesson-3.3)
    handleHashNavigation();
  }

  // Initialize 3D Tilt & Cursor Following Spotlight Glow for Cards (Matching rebot project)
  function initCardInteractiveEffects() {
    const cards = document.querySelectorAll('.feature-card');
    cards.forEach(card => {
      // Inject spotlight glow element if not already present
      if (!card.querySelector('.card-spotlight-glow')) {
        const spotlight = document.createElement('div');
        spotlight.className = 'card-spotlight-glow';
        card.appendChild(spotlight);
      }

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const mouseXPercent = (x / rect.width * 100).toFixed(2);
        const mouseYPercent = (y / rect.height * 100).toFixed(2);

        // Calculate 3D tilt angles (max +/- 6.5 deg)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (-(y - centerY) / centerY * 6.5);
        const rotateY = ((x - centerX) / centerX * 6.5);

        card.style.setProperty('--mouse-x', `${mouseXPercent}%`);
        card.style.setProperty('--mouse-y', `${mouseYPercent}%`);
        card.style.transform = `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`;
        card.style.boxShadow = `0 14px 32px rgba(0, 0, 0, 0.45), ${-rotateY.toFixed(2)}px ${rotateX.toFixed(2)}px 24px rgba(141, 195, 31, 0.12)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        card.style.boxShadow = '';
        card.style.setProperty('--mouse-x', '50%');
        card.style.setProperty('--mouse-y', '50%');
      });
    });
  }

  // Switch Language
  function switchLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('dli_course_lang', lang);
    lessons = lang === 'zh' ? (window.COURSE_DATA_ZH || window.COURSE_DATA) : window.COURSE_DATA;

    const langBtn = document.getElementById('lang-toggle-btn');
    if (langBtn) {
      langBtn.textContent = lang === 'zh' ? 'EN' : 'CN';
      langBtn.title = lang === 'zh' ? 'Switch to English' : '切换到中文';
    }

    updateLandingTexts();
    renderLandingChapters();
    renderSidebarNav();

    // If in reader view, re-render current lesson
    if (readerView.style.display !== 'none') {
      showReaderView(currentLessonIndex);
    }
  }

  // Update Landing Page Texts
  function updateLandingTexts() {
    const heroTitle = document.querySelector('.hero-title');
    const heroDesc = document.querySelector('.hero-desc');
    const sectionTitle = document.querySelector('.section-title');
    const sectionSub = document.querySelector('.section-sub');
    const searchBtn = document.querySelector('.search-text-full');
    const backBtn = document.getElementById('back-to-overview');
    const searchInput = document.getElementById('search-input');
    const tocTitle = document.querySelector('.toc-title');
    const brandTitleSpan = document.querySelector('.brand-title span:first-child');
    const chaptersTitle = document.querySelector('.course-chapters-title');
    const chaptersSub = document.querySelector('.course-chapters-sub');

    if (brandTitleSpan) brandTitleSpan.textContent = t('brandTitle');
    if (heroTitle) heroTitle.innerHTML = t('heroTitle');
    if (heroDesc) heroDesc.innerHTML = t('heroDesc');
    if (searchBtn) searchBtn.innerHTML = `<i class="fas fa-search" style="margin-right: 0.5rem; color: var(--nv-green);"></i> ${t('searchPlaceholder')}`;
    if (backBtn) backBtn.innerHTML = `<i class="fas fa-arrow-left"></i> ${t('backToOverview')}`;
    if (searchInput) searchInput.placeholder = t('searchTitle');
    if (tocTitle) tocTitle.textContent = t('onThisPage');

    // Update feature cards
    const featureCards = document.querySelectorAll('.feature-card h3');
    const featureDesc = document.querySelectorAll('.feature-card p');
    const titles = ['feature1Title', 'feature2Title', 'feature3Title', 'feature4Title'];
    const descs = ['feature1Desc', 'feature2Desc', 'feature3Desc', 'feature4Desc'];
    featureCards.forEach((el, i) => { if (titles[i]) el.textContent = t(titles[i]); });
    featureDesc.forEach((el, i) => { if (descs[i]) el.textContent = t(descs[i]); });

    // Update stats
    const statVals = document.querySelectorAll('.stat-val');
    const statLbls = document.querySelectorAll('.stat-lbl');
    const vals = ['19', 'Sim-to-Real', '5', '20+ Learning hours'];
    const valZh = ['19', 'Sim-to-Real', '5', '20+ 学习小时'];
    const lbls = ['landingModules', 'landingPipeline', 'landingChapters', 'landingLevel'];
    statVals.forEach((el, i) => { el.textContent = currentLang === 'zh' ? valZh[i] : vals[i]; });
    statLbls.forEach((el, i) => { if (lbls[i]) el.textContent = t(lbls[i]); });

    // Update CTA button
    const ctaBtn = document.querySelector('.btn-primary.btn-pill');
    if (ctaBtn) ctaBtn.innerHTML = `<i class="fas fa-play"></i> ${t('startLearning')}`;

    // Update section title/subtitle
    if (sectionTitle) sectionTitle.innerHTML = `<i class="fas fa-microchip"></i> ${t('stackTitle')}`;
    if (sectionSub) sectionSub.textContent = t('stackSub');

    if (chaptersTitle) chaptersTitle.innerHTML = `<i class="fas fa-graduation-cap"></i> ${t('chaptersTitle')}`;
    if (chaptersSub) chaptersSub.textContent = t('chaptersSub');

    // Update breadcrumb
    const breadcrumbHome = document.getElementById('breadcrumb-home');
    if (breadcrumbHome) breadcrumbHome.textContent = t('breadcrumbCourse');
  }

  // Handle Deep Linking
  function handleHashNavigation() {
    const hash = window.location.hash;
    if (hash.startsWith('#lesson-')) {
      const lessonId = hash.replace('#lesson-', '');
      const idx = lessons.findIndex(l => l.id === lessonId);
      if (idx !== -1) {
        showReaderView(idx);
        return;
      }
    }
    showLandingView();
  }

  // Switch to Landing View
  function showLandingView() {
    landingView.style.display = 'block';
    readerView.style.display = 'none';
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Switch to Reader View
  function showReaderView(index) {
    if (index < 0 || index >= lessons.length) return;
    currentLessonIndex = index;
    const lesson = lessons[index];

    landingView.style.display = 'none';
    readerView.style.display = 'block';
    window.location.hash = `lesson-${lesson.id}`;

    // Update Breadcrumb
    breadcrumbText.textContent = `${lesson.chapterTitle} / ${lesson.title}`;

    // Render Markdown Content
    renderMarkdownContent(lesson);

    // Update Active State in Sidebar
    updateActiveSidebarLink(lesson.id);

    // Update Pagination Buttons
    updatePaginationControls();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Track Page View Event
    if (window.trackPageView) {
      window.trackPageView(`#lesson-${lesson.id}`, lesson.title);
    }
  }

  // Render Landing Page Chapters Grid
  function renderLandingChapters() {
    if (!chaptersGrid) return;
    const chapters = groupLessonsByChapter();
    chaptersGrid.innerHTML = '';

    chapters.forEach(ch => {
      const chapterBlock = document.createElement('div');
      chapterBlock.className = 'chapter-block';

      const chapterBadgeText = currentLang === 'zh' ? `第 ${ch.chapterNum} 章` : `Chapter ${ch.chapterNum}`;

      chapterBlock.innerHTML = `
        <div class="chapter-header">
          <div class="chapter-title-wrap">
            <span class="chapter-badge">${chapterBadgeText}</span>
            <span class="chapter-title-text">${ch.chapterTitle}</span>
          </div>
          <span style="font-size: 0.85rem; color: var(--text-muted);">${ch.lessons.length} ${t('modules')}</span>
        </div>
        <div class="lessons-list">
          ${ch.lessons.map(l => `
            <div class="lesson-item-card" data-lesson-id="${l.id}">
              <div>
                <div class="lesson-item-title">
                  <span>${l.title}</span>
                  <span class="lesson-id-tag">${l.id}</span>
                </div>
              </div>
              <div class="lesson-action-bar">
                <span><i class="far fa-file-alt"></i> ${t('documentation')}</span>
                <span class="read-btn">${t('start')} <i class="fas fa-arrow-right"></i></span>
              </div>
            </div>
          `).join('')}
        </div>
      `;

      chaptersGrid.appendChild(chapterBlock);
    });

    // Add click & 3D magnetic tilt + spotlight follow listeners to cards
    document.querySelectorAll('.lesson-item-card').forEach(card => {
      // Inject spotlight overlay element
      if (!card.querySelector('.card-spotlight')) {
        const spotlight = document.createElement('div');
        spotlight.className = 'card-spotlight';
        card.appendChild(spotlight);
      }

      const spotlight = card.querySelector('.card-spotlight');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Update spotlight position
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
        if (spotlight) spotlight.style.opacity = '1';

        // Calculate 3D tilt angles (max +/- 7 deg)
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = (-(y - centerY) / centerY * 7).toFixed(2);
        const rotateY = ((x - centerX) / centerX * 7).toFixed(2);

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
        if (spotlight) spotlight.style.opacity = '0';
      });

      card.addEventListener('click', () => {
        const id = card.getAttribute('data-lesson-id');
        const idx = lessons.findIndex(l => l.id === id);
        if (idx !== -1) showReaderView(idx);
      });
    });
  }

  // Group Lessons by Chapter
  function groupLessonsByChapter() {
    const groups = {};
    lessons.forEach(l => {
      if (!groups[l.chapter]) {
        groups[l.chapter] = {
          chapterNum: l.chapter,
          chapterTitle: l.chapterTitle,
          lessons: []
        };
      }
      groups[l.chapter].lessons.push(l);
    });
    return Object.values(groups);
  }

  // Render Left Sidebar Navigation Tree
  function renderSidebarNav() {
    const chapters = groupLessonsByChapter();
    sidebarNav.innerHTML = '';

    chapters.forEach(ch => {
      const group = document.createElement('div');
      group.className = 'sidebar-group';

      group.innerHTML = `
        <div class="sidebar-group-title">${ch.chapterTitle}</div>
        ${ch.lessons.map(l => `
          <a class="sidebar-link" data-lesson-id="${l.id}">
            <span>${l.title}</span>
            <i class="fas fa-chevron-right" style="font-size: 0.7rem; opacity: 0.5;"></i>
          </a>
        `).join('')}
      `;

      sidebarNav.appendChild(group);
    });

    // Add click handlers for sidebar links
    sidebarNav.querySelectorAll('.sidebar-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const id = link.getAttribute('data-lesson-id');
        const idx = lessons.findIndex(l => l.id === id);
        if (idx !== -1) showReaderView(idx);
      });
    });
  }

  // Update Active Sidebar Link
  function updateActiveSidebarLink(id) {
    sidebarNav.querySelectorAll('.sidebar-link').forEach(link => {
      if (link.getAttribute('data-lesson-id') === id) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  // Calculate Word Count and Estimated Reading Time
  function calculateReadingMetrics(text) {
    if (!text) return { words: 0, minutes: 1 };
    const cleanText = text.replace(/```[\s\S]*?```/g, '').replace(/<[^>]+>/g, '');
    const tokens = cleanText.match(/[\u4e00-\u9fa5]|\w+/g) || [];
    const words = tokens.length;
    const minutes = Math.max(1, Math.ceil(words / 220));
    return { words, minutes };
  }

  // Render Markdown Content & Custom Blocks
  function renderMarkdownContent(lesson) {
    let rawMd = lesson.content;

    // Convert GitHub Callout Alerts (> [!NOTE], > [!WARNING], > [!CAUTION], > [!IMPORTANT], > [!TIP])
    rawMd = rawMd.replace(/^>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n((?:>.*(?:\n|$))+)/gmi, function(match, type, body) {
      const cleanBody = body.replace(/^>\s?/gm, '');
      const lowerType = type.toLowerCase();
      let iconClass = 'fa-info-circle';
      let calloutLabel = type;
      if (lowerType === 'warning') iconClass = 'fa-exclamation-triangle';
      if (lowerType === 'caution') iconClass = 'fa-radiation';
      if (lowerType === 'tip' || lowerType === 'important') iconClass = 'fa-lightbulb';

      if (currentLang === 'zh') {
        if (lowerType === 'note') calloutLabel = '提示';
        if (lowerType === 'warning') calloutLabel = '警告';
        if (lowerType === 'caution') calloutLabel = '注意';
        if (lowerType === 'important') calloutLabel = '重要';
        if (lowerType === 'tip') calloutLabel = '建议';
      }

      return `<div class="callout-box ${lowerType}">
        <div class="callout-title"><i class="fas ${iconClass}"></i> ${calloutLabel}</div>
        <div>${marked.parse(cleanBody)}</div>
      </div>\n`;
    });

    // Calculate & Inject Reading Metrics Badge below Title
    const { words, minutes } = calculateReadingMetrics(rawMd);
    const readTimeText = currentLang === 'zh' ? `${minutes} 分钟阅读` : `${minutes} min read`;
    const wordCountText = currentLang === 'zh' ? `${words.toLocaleString()} 字` : `${words.toLocaleString()} words`;

    const metricsHtml = `
      <div class="reading-metrics-tag">
        <span class="metric-item"><i class="far fa-clock"></i> ${readTimeText}</span>
        <span class="metric-divider">•</span>
        <span class="metric-item"><i class="far fa-file-alt"></i> ${wordCountText}</span>
      </div>`;

    // Parse Markdown to HTML
    let html = marked.parse(rawMd);

    markdownBody.innerHTML = html;

    // Inject metrics badge right after h1
    const h1 = markdownBody.querySelector('h1');
    if (h1) {
      h1.insertAdjacentHTML('afterend', metricsHtml);
    }

    // Post-process Code Blocks with Copy Button
    enhanceCodeBlocks();

    // Post-process Images for Lightbox Zoom
    enhanceImages();

    // Post-process Videos for relative path resolution
    enhanceVideos();

    // Post-process Task Lists (Interactive checkboxes & strikethrough)
    enhanceTaskLists();

    // Post-process Links to open in a new tab
    enhanceLinks();

    // Post-process Tables to add responsive wrappers
    enhanceTables();

    // Generate Right Sidebar TOC
    generateTOC();
  }

  // Enhance Links to open non-anchor links in new tab
  function enhanceLinks() {
    const links = markdownBody.querySelectorAll('a');
    links.forEach(a => {
      const href = a.getAttribute('href');
      if (href && !href.startsWith('#')) {
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener noreferrer');
      }
    });
  }

  // Enhance Task Lists with interactive toggle and strikethrough effect
  function enhanceTaskLists() {
    const checkboxes = markdownBody.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => {
      cb.removeAttribute('disabled');
      cb.style.cursor = 'pointer';
      
      const li = cb.closest('li');
      if (li) {
        li.style.cursor = 'pointer';
        li.style.userSelect = 'none';
        
        if (cb.checked) {
          li.classList.add('task-checked');
        } else {
          li.classList.remove('task-checked');
        }

        // Toggle on click of checkbox or line
        const handleToggle = (e) => {
          if (e.target !== cb) {
            cb.checked = !cb.checked;
          }
          if (cb.checked) {
            li.classList.add('task-checked');
          } else {
            li.classList.remove('task-checked');
          }
        };

        li.addEventListener('click', handleToggle);
      }
    });
  }

  // Enhance Code Blocks to match Feishu Docs Style
  function enhanceCodeBlocks() {
    const pres = markdownBody.querySelectorAll('pre');
    pres.forEach(pre => {
      if (pre.parentNode && pre.parentNode.classList.contains('feishu-code-content')) return;

      const code = pre.querySelector('code');
      const rawText = code ? code.innerText : pre.innerText;

      // Extract language class if present
      let lang = 'Bash';
      if (code && code.className) {
        const m = code.className.match(/language-(\w+)/);
        if (m) {
          const l = m[1].toLowerCase();
          lang = l.charAt(0).toUpperCase() + l.slice(1);
        }
      }

      // Run Prism Syntax Highlighting
      if (code && window.Prism) {
        try {
          Prism.highlightElement(code);
        } catch (e) {
          console.warn('Prism highlighting notice:', e);
        }
      }

      // Build Feishu Code Block Wrapper
      const block = document.createElement('div');
      block.className = 'feishu-code-block';

      // Header
      const header = document.createElement('div');
      header.className = 'feishu-code-header';

      // Left Header: Collapse Toggle
      const headerLeft = document.createElement('div');
      headerLeft.className = 'feishu-code-header-left';
      headerLeft.innerHTML = `<i class="fas fa-caret-down feishu-caret"></i><span>Code Block</span>`;
      headerLeft.addEventListener('click', () => {
        block.classList.toggle('collapsed');
      });

      // Right Header: Language, Wrap, Copy
      const headerRight = document.createElement('div');
      headerRight.className = 'feishu-code-header-right';

      // Language Selector Tag & Dropdown
      const langSpan = document.createElement('div');
      langSpan.className = 'feishu-lang-tag';
      langSpan.innerHTML = `<span class="lang-text">${lang}</span><i class="fas fa-chevron-down" style="font-size:0.65rem"></i>`;

      // Supported Languages List (Matching Feishu Docs)
      const LANG_LIST = [
        'PlainText', 'Apex', 'Assembly', 'Bash', 'C', 'C#', 'C++', 'CMake', 'COBOL',
        'CSS', 'CoffeeScript', 'D', 'Dart', 'Delphi', 'Diff', 'Django', 'Dockerfile',
        'Erlang', 'Fortran', 'Gherkin', 'Go', 'GraphQL', 'HTML', 'Java', 'JavaScript',
        'JSON', 'Kotlin', 'Lua', 'Markdown', 'MATLAB', 'Objective-C', 'Pascal',
        'Perl', 'PHP', 'Python', 'R', 'Ruby', 'Rust', 'Scala', 'Shell', 'SQL',
        'Swift', 'TypeScript', 'XML', 'YAML'
      ];

      langSpan.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Remove any existing dropdowns
        document.querySelectorAll('.feishu-lang-dropdown').forEach(el => el.remove());

        const dropdown = document.createElement('div');
        dropdown.className = 'feishu-lang-dropdown';

        const searchWrap = document.createElement('div');
        searchWrap.className = 'feishu-lang-search-wrap';
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'feishu-lang-search';
        searchInput.placeholder = 'Search language...';

        searchWrap.appendChild(searchInput);

        const langUl = document.createElement('ul');
        langUl.className = 'feishu-lang-list';

        function renderList(filter = '') {
          langUl.innerHTML = '';
          const currentLang = langSpan.querySelector('.lang-text').textContent.toLowerCase();
          const filtered = LANG_LIST.filter(l => l.toLowerCase().includes(filter.toLowerCase()));

          if (filtered.length === 0) {
            langUl.innerHTML = '<li style="padding: 0.5rem; text-align: center; color: var(--feishu-line-num); font-size: 0.8rem;">No matching language</li>';
            return;
          }

          filtered.forEach(lName => {
            const li = document.createElement('li');
            li.className = 'feishu-lang-item' + (lName.toLowerCase() === currentLang ? ' selected' : '');
            li.innerHTML = `<span>${lName}</span>${lName.toLowerCase() === currentLang ? '<i class="fas fa-check"></i>' : ''}`;

            li.addEventListener('click', (evt) => {
              evt.stopPropagation();
              langSpan.querySelector('.lang-text').textContent = lName;

              // Language Mapping for Prism Syntax Engine
              const langAliasMap = {
                'plaintext': 'none',
                'shell': 'bash',
                'c++': 'cpp',
                'c#': 'csharp',
                'dockerfile': 'docker',
                'html': 'markup',
                'xml': 'markup',
                'javascript': 'javascript',
                'typescript': 'typescript'
              };

              const langKey = langAliasMap[lName.toLowerCase()] || lName.toLowerCase();

              if (code) {
                code.className = `language-${langKey}`;
                if (window.Prism) {
                  if (Prism.languages[langKey]) {
                    code.innerHTML = Prism.highlight(rawText, Prism.languages[langKey], langKey);
                  } else {
                    code.textContent = rawText;
                    try {
                      Prism.highlightElement(code);
                    } catch (err) {}
                  }
                }
              }

              dropdown.remove();
            });

            langUl.appendChild(li);
          });
        }

        renderList('');

        searchInput.addEventListener('input', (evt) => {
          renderList(evt.target.value);
        });

        dropdown.appendChild(searchWrap);
        dropdown.appendChild(langUl);
        headerRight.appendChild(dropdown);

        setTimeout(() => searchInput.focus(), 50);

        // Close on click outside
        const closeHandler = (evt) => {
          if (!dropdown.contains(evt.target) && !langSpan.contains(evt.target)) {
            dropdown.remove();
            document.removeEventListener('click', closeHandler);
          }
        };
        document.addEventListener('click', closeHandler);
      });

      // Word Wrap Button
      const wrapText = currentLang === 'zh' ? '自动换行' : 'Wrap';
      const wrapBtn = document.createElement('button');
      wrapBtn.className = 'feishu-action-btn wrap-btn';
      wrapBtn.innerHTML = `<i class="fas fa-level-down-alt fa-rotate-90"></i><span>${wrapText}</span>`;
      wrapBtn.title = currentLang === 'zh' ? '切换自动换行' : 'Toggle word wrap';
      wrapBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pre.classList.toggle('word-wrap');
        wrapBtn.classList.toggle('active');
      });

      // Copy Button (With Automatic Shell Prompt Stripper)
      const copyText = currentLang === 'zh' ? '复制' : 'Copy';
      const copiedText = currentLang === 'zh' ? '已复制' : 'Copied';
      const copyBtn = document.createElement('button');
      copyBtn.className = 'feishu-action-btn copy-btn';
      copyBtn.innerHTML = `<i class="far fa-copy"></i><span>${copyText}</span>`;
      copyBtn.title = currentLang === 'zh' ? '复制代码' : 'Copy code';
      copyBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Strip shell prompts (e.g. '$ ', '(.venv)...$ ', '# ') for clean terminal execution
        const cleanText = rawText.replace(/^[\s]*(\$|\#|\(.+?\)[\w@\-~\:\s]*[\$#])\s+/gm, '');

        navigator.clipboard.writeText(cleanText).then(() => {
          copyBtn.innerHTML = `<i class="fas fa-check" style="color:var(--nv-green)"></i><span style="color:var(--nv-green)">${copiedText}</span>`;
          if (window.trackEvent) {
            window.trackEvent('copy_code_snippet', { language: lang });
          }
          setTimeout(() => {
            copyBtn.innerHTML = `<i class="far fa-copy"></i><span>${copyText}</span>`;
          }, 2000);
        });
      });

      headerRight.appendChild(langSpan);
      headerRight.appendChild(createDivider());
      headerRight.appendChild(wrapBtn);
      headerRight.appendChild(createDivider());
      headerRight.appendChild(copyBtn);

      header.appendChild(headerLeft);
      header.appendChild(headerRight);

      // Body (Line Numbers + Code Content)
      const body = document.createElement('div');
      body.className = 'feishu-code-body';

      // Calculate Line Numbers
      const lines = rawText.split('\n');
      if (lines.length > 1 && lines[lines.length - 1].trim() === '') {
        lines.pop();
      }
      const lineCount = Math.max(1, lines.length);

      const lineNums = document.createElement('div');
      lineNums.className = 'feishu-line-numbers';
      let numsHtml = '';
      for (let i = 1; i <= lineCount; i++) {
        numsHtml += `<span>${i}</span>`;
      }
      lineNums.innerHTML = numsHtml;

      const codeContent = document.createElement('div');
      codeContent.className = 'feishu-code-content';

      pre.parentNode.insertBefore(block, pre);
      codeContent.appendChild(pre);
      body.appendChild(lineNums);
      body.appendChild(codeContent);

      block.appendChild(header);
      block.appendChild(body);
    });
  }

  function createDivider() {
    const d = document.createElement('span');
    d.className = 'feishu-divider';
    d.textContent = '|';
    return d;
  }

  // Enhance Images with relative path correction, lazy loading & Lightbox Zoom
  function enhanceImages() {
    const imgs = markdownBody.querySelectorAll('img');
    imgs.forEach(img => {
      let src = img.getAttribute('src') || '';
      // Fix relative markdown image paths (e.g., '../image/xyz.png' -> 'image/xyz.png')
      if (src.startsWith('../image/')) {
        src = src.replace('../image/', 'image/');
        img.src = src;
      } else if (src.startsWith('/image/')) {
        src = src.replace('/image/', 'image/');
        img.src = src;
      }

      // Add performance attributes
      img.setAttribute('loading', 'lazy');
      img.setAttribute('decoding', 'async');

      // Skip lightbox for images wrapped in anchor tags (clickable links)
      if (img.closest('a')) {
        return;
      }

      img.addEventListener('click', () => {
        lightboxImg.src = img.src;
        lightboxImg.alt = img.alt || 'Zoomed Image View';
        imageLightbox.classList.add('active');
      });
    });
  }

  // Enhance Videos with relative path correction & auto-reload
  function enhanceVideos() {
    const videos = markdownBody.querySelectorAll('video');
    videos.forEach(v => {
      let updated = false;
      const sources = v.querySelectorAll('source');
      sources.forEach(src => {
        let s = src.getAttribute('src') || '';
        if (s.startsWith('../video/')) {
          s = s.replace('../video/', 'video/');
          src.src = s;
          updated = true;
        } else if (s.startsWith('/video/')) {
          s = s.replace('/video/', 'video/');
          src.src = s;
          updated = true;
        }
      });
      if (updated) {
        v.load();
      }
    });
  }

  // Wrap Tables in Responsive Scroll Container
  function enhanceTables() {
    const tables = markdownBody.querySelectorAll('table');
    tables.forEach(tbl => {
      if (tbl.parentNode && !tbl.parentNode.classList.contains('table-wrapper')) {
        const wrapper = document.createElement('div');
        wrapper.className = 'table-wrapper';
        tbl.parentNode.insertBefore(wrapper, tbl);
        wrapper.appendChild(tbl);
      }
    });
  }

  // Generate Dynamic Right Sidebar Table of Contents
  function generateTOC() {
    tocList.innerHTML = '';
    const headings = markdownBody.querySelectorAll('h2, h3');

    if (headings.length === 0) {
      tocList.innerHTML = '<li class="toc-item" style="color:var(--text-muted)">' + t('noSubHeaders') + '</li>';
      return;
    }

    headings.forEach((h, index) => {
      const id = `heading-${index}`;
      h.id = id;

      const li = document.createElement('li');
      li.className = 'toc-item';
      if (h.tagName.toLowerCase() === 'h3') {
        li.style.paddingLeft = '0.75rem';
      }

      li.innerHTML = `<a href="#${id}" class="toc-link">${h.innerText}</a>`;
      tocList.appendChild(li);

      // Smooth scroll on click
      li.querySelector('a').addEventListener('click', (e) => {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth' });
      });
    });

    // Active Scroll Sync for TOC Items (Spring Active Indicator)
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activeId = entry.target.id;
            const links = tocList.querySelectorAll('.toc-link');
            links.forEach(link => {
              if (link.getAttribute('href') === `#${activeId}`) {
                link.classList.add('active');
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      }, { rootMargin: '-64px 0px -65% 0px', threshold: 0.1 });

      headings.forEach(h => observer.observe(h));
    }
  }

  // Update Pagination Controls
  function updatePaginationControls() {
    if (currentLessonIndex > 0) {
      const prevLesson = lessons[currentLessonIndex - 1];
      prevLessonBtn.style.visibility = 'visible';
      const prevTitleEl = prevLessonBtn.querySelector('.title-text') || prevLessonBtn.querySelector('.pag-title');
      if (prevTitleEl) prevTitleEl.textContent = prevLesson.title;
    } else {
      prevLessonBtn.style.visibility = 'hidden';
    }

    if (currentLessonIndex < lessons.length - 1) {
      const nextLesson = lessons[currentLessonIndex + 1];
      nextLessonBtn.style.visibility = 'visible';
      const nextTitleEl = nextLessonBtn.querySelector('.title-text') || nextLessonBtn.querySelector('.pag-title');
      if (nextTitleEl) nextTitleEl.textContent = nextLesson.title;
    } else {
      nextLessonBtn.style.visibility = 'hidden';
    }
  }

  // Global Search Modal Logic
  function performSearch(query) {
    query = query.trim().toLowerCase();
    searchResults.innerHTML = '';

    if (!query) {
      searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">' + t('typeToSearch') + '</div>';
      return;
    }

    const matches = lessons.filter(l => {
      return l.title.toLowerCase().includes(query) ||
             l.chapterTitle.toLowerCase().includes(query) ||
             l.content.toLowerCase().includes(query);
    });

    if (window.trackEvent) {
      window.trackEvent('search_query', { keyword: query, matches_count: matches.length });
    }

    if (matches.length === 0) {
      searchResults.innerHTML = '<div style="padding: 1rem; color: var(--text-muted); text-align: center;">' + t('noMatching') + '</div>';
      return;
    }

    matches.forEach(l => {
      const card = document.createElement('div');
      card.className = 'search-result-card';
      
      // Find snippet around match
      let snippet = l.content.substring(0, 120) + '...';
      const idx = l.content.toLowerCase().indexOf(query);
      if (idx !== -1) {
        const start = Math.max(0, idx - 40);
        const end = Math.min(l.content.length, idx + 80);
        snippet = '...' + l.content.substring(start, end).replace(/\n/g, ' ') + '...';
      }

      card.innerHTML = `
        <div class="search-result-title">${l.id} ${l.title}</div>
        <div class="search-result-snippet">${snippet}</div>
      `;

      card.addEventListener('click', () => {
        searchModal.style.display = 'none';
        const lessonIdx = lessons.findIndex(item => item.id === l.id);
        showReaderView(lessonIdx);
      });

      searchResults.appendChild(card);
    });
  }

  // Setup Event Listeners
  function setupEventListeners() {
    // Mobile & Responsive Drawers Toggle (Left Sidebar & Right TOC)
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const tocToggleBtn = document.getElementById('toc-toggle-btn');
    const sidebarNavEl = document.querySelector('.sidebar-nav');
    const tocNavEl = document.querySelector('.toc-nav');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    function closeDrawers() {
      if (sidebarNavEl) sidebarNavEl.classList.remove('drawer-open');
      if (tocNavEl) tocNavEl.classList.remove('drawer-open');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }

    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (tocNavEl) tocNavEl.classList.remove('drawer-open');
        if (sidebarNavEl) sidebarNavEl.classList.toggle('drawer-open');
        if (sidebarOverlay) {
          if (sidebarNavEl.classList.contains('drawer-open')) {
            sidebarOverlay.classList.add('active');
          } else {
            sidebarOverlay.classList.remove('active');
          }
        }
      });
    }

    if (tocToggleBtn) {
      tocToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (sidebarNavEl) sidebarNavEl.classList.remove('drawer-open');
        if (tocNavEl) tocNavEl.classList.toggle('drawer-open');
        if (sidebarOverlay) {
          if (tocNavEl.classList.contains('drawer-open')) {
            sidebarOverlay.classList.add('active');
          } else {
            sidebarOverlay.classList.remove('active');
          }
        }
      });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', closeDrawers);
    }

    // Auto close drawers when clicking sidebar or TOC links
    document.addEventListener('click', (e) => {
      if (e.target.closest('.sidebar-link') || e.target.closest('.toc-link')) {
        closeDrawers();
      }
    });

    // Auto close drawers & backdrop overlay when expanding window width
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1100) {
        if (sidebarNavEl) sidebarNavEl.classList.remove('drawer-open');
        if (sidebarOverlay && (!tocNavEl || !tocNavEl.classList.contains('drawer-open'))) {
          sidebarOverlay.classList.remove('active');
        }
      }
      if (window.innerWidth > 1400) {
        if (tocNavEl) tocNavEl.classList.remove('drawer-open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      }
    }, { passive: true });

    // Brand Click -> Return to Landing Page
    document.querySelectorAll('.brand-container').forEach(b => {
      b.addEventListener('click', (e) => {
        if (e.target.closest('#mobile-menu-btn')) return;
        closeDrawers();
        showLandingView();
      });
    });

    // Back to Overview Button
    document.getElementById('back-to-overview').addEventListener('click', () => {
      closeDrawers();
      showLandingView();
    });

    // Hero CTA Buttons
    const heroStartBtn = document.getElementById('hero-start-btn');
    if (heroStartBtn) {
      heroStartBtn.addEventListener('click', () => {
        if (window.trackEvent) {
          window.trackEvent('click_start_learning', { location: 'hero' });
        }
        showReaderView(0);
      });
    }
    const heroExploreBtn = document.getElementById('hero-explore-btn');
    if (heroExploreBtn) {
      heroExploreBtn.addEventListener('click', () => {
        const chaptersSec = document.getElementById('chapters-section');
        if (chaptersSec) chaptersSec.scrollIntoView({ behavior: 'smooth' });
      });
    }

    // Pagination Click
    prevLessonBtn.addEventListener('click', () => {
      if (currentLessonIndex > 0) showReaderView(currentLessonIndex - 1);
    });
    nextLessonBtn.addEventListener('click', () => {
      if (currentLessonIndex < lessons.length - 1) showReaderView(currentLessonIndex + 1);
    });

    // Search Trigger
    document.getElementById('search-trigger-btn').addEventListener('click', () => {
      searchModal.style.display = 'flex';
      searchInput.value = '';
      searchInput.focus();
      performSearch('');
    });

    searchInput.addEventListener('input', (e) => {
      performSearch(e.target.value);
    });

    // Close Search Modal on ESC or Outside Click
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) searchModal.style.display = 'none';
    });

    // Keyboard Shortcuts (Ctrl + K, ESC, ArrowLeft/Right)
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchModal.style.display = 'flex';
        searchInput.focus();
      }
      if (e.key === 'Escape') {
        searchModal.style.display = 'none';
        imageLightbox.classList.remove('active');
      }

      // Arrow keys (← / →) for Previous / Next lesson navigation in reader view
      if (readerView.style.display !== 'none' && searchModal.style.display !== 'flex' && !imageLightbox.classList.contains('active')) {
        const isEditing = ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName) || document.activeElement.isContentEditable;
        if (!isEditing) {
          if (e.key === 'ArrowLeft') {
            if (currentLessonIndex > 0) {
              e.preventDefault();
              showReaderView(currentLessonIndex - 1);
            }
          } else if (e.key === 'ArrowRight') {
            if (currentLessonIndex < lessons.length - 1) {
              e.preventDefault();
              showReaderView(currentLessonIndex + 1);
            }
          }
        }
      }
    });

    // Close Image Lightbox
    imageLightbox.addEventListener('click', () => {
      imageLightbox.classList.remove('active');
    });

    // Theme Switcher Toggle Handler (Desktop & Mobile Drawer)
    function toggleTheme() {
      const currentMode = document.documentElement.getAttribute('data-theme');
      const newMode = currentMode === 'light' ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', newMode);
      
      const iconHtml = newMode === 'light' ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
      if (themeToggleBtn) themeToggleBtn.innerHTML = iconHtml;
      
      const mobileThemeBtn = document.getElementById('mobile-theme-toggle-btn');
      if (mobileThemeBtn) mobileThemeBtn.innerHTML = iconHtml;
      
      const logoImgs = document.querySelectorAll('.brand-logo-img');
      logoImgs.forEach(img => {
        img.src = newMode === 'light' ? 'image/seeed_logo_c.svg' : 'image/seeed_logo_w.svg';
      });

      if (window.trackEvent) {
        window.trackEvent('toggle_theme', { mode: newMode });
      }
    }

    if (themeToggleBtn) themeToggleBtn.addEventListener('click', toggleTheme);
    const mobileThemeToggleBtn = document.getElementById('mobile-theme-toggle-btn');
    if (mobileThemeToggleBtn) mobileThemeToggleBtn.addEventListener('click', toggleTheme);

    // Language Toggle
    const langToggleBtn = document.getElementById('lang-toggle-btn');
    if (langToggleBtn) {
      langToggleBtn.addEventListener('click', () => {
        switchLanguage(currentLang === 'en' ? 'zh' : 'en');
      });
    }

    // Back to Top Floating Action Button Event Listeners
    const backToTopBtn = document.getElementById('back-to-top-btn');
    if (backToTopBtn) {
      window.addEventListener('scroll', () => {
        if (window.scrollY > 300) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      }, { passive: true });

      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // Top Glowing Reading Progress Bar Listener
    const progressBar = document.getElementById('reading-progress-bar');
    function updateReadingProgress() {
      if (!progressBar) return;
      if (readerView.style.display === 'none') {
        progressBar.style.width = '0%';
        return;
      }
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight <= 0) {
        progressBar.style.width = '100%';
        return;
      }
      const currentScroll = window.scrollY;
      const percentage = Math.min(100, Math.max(0, (currentScroll / totalHeight) * 100));
      progressBar.style.width = `${percentage}%`;
    }

    window.addEventListener('scroll', updateReadingProgress, { passive: true });
  }

  // ASCII Breathing Field Background Engine
  function initAsciiBg() {
    const canvas = document.getElementById('hero-ascii-canvas');
    if (!canvas) return;

    const PALETTE = '   ...:::---+++***◦◦••▢▣';
    const CELL = 16;
    const FONT_SIZE = 13;
    let ctx, w, h;

    function setup() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) return false;
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      w = rect.width;
      h = rect.height;
      ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.font = `500 ${FONT_SIZE}px "JetBrains Mono", monospace`;
      ctx.textBaseline = 'top';
      return true;
    }

    function draw(t) {
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';

      for (let r = 0; r < rows; r++) {
        for (let cc = 0; cc < cols; cc++) {
          const n = (
            Math.sin(cc * 0.18 + t) +
            Math.sin(r * 0.24 - t * 0.7) +
            Math.sin((cc + r) * 0.12 + t * 0.45) +
            Math.sin(Math.hypot(cc - cols * 0.5, r - rows * 0.5) * 0.16 - t * 0.55)
          ) / 4;
          const v = (n + 1) / 2;
          if (v < 0.22) continue;
          const idx = Math.min(PALETTE.length - 1, Math.floor(v * PALETTE.length));
          const ch = PALETTE[idx];
          if (ch === ' ') continue;
          
          const alpha = isLight ? (0.12 + (v - 0.22) * 0.65) : (0.08 + (v - 0.22) * 0.55);
          ctx.fillStyle = `rgba(141, 195, 31, ${alpha.toFixed(3)})`;
          ctx.fillText(ch, cc * CELL, r * CELL);
        }
      }
    }

    let pending = null;
    window.addEventListener('resize', () => {
      if (pending) cancelAnimationFrame(pending);
      pending = requestAnimationFrame(setup);
    }, { passive: true });

    let t0 = performance.now();
    setup();

    function tick(now) {
      const heroView = document.getElementById('landing-view');
      if (heroView && heroView.style.display !== 'none') {
        const rect = canvas.getBoundingClientRect();
        if (rect.width >= 4 && rect.height >= 4) {
          // Auto setup context if not initialized (e.g. initial load was on reader view) or if size changed
          if (!ctx || Math.abs(w - rect.width) > 2 || Math.abs(h - rect.height) > 2) {
            setup();
          }
          if (rect.bottom > 0 && rect.top < window.innerHeight) {
            const t = (now - t0) / 1000 * 0.55;
            draw(t);
          }
        }
      }
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  // Staggered Scroll-Reveal Animations Engine
  function initScrollReveal() {
    const targets = document.querySelectorAll('.feature-card, .chapter-block, .section-title');
    targets.forEach(el => {
      el.classList.add('scroll-reveal');
    });

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, idx) => {
          if (entry.isIntersecting) {
            setTimeout(() => {
              entry.target.classList.add('revealed');
            }, (idx % 3) * 60);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

      targets.forEach(el => observer.observe(el));
    } else {
      targets.forEach(el => el.classList.add('revealed'));
    }
  }

  // Run on DOM Ready
  document.addEventListener('DOMContentLoaded', () => {
    init();
    initAsciiBg();
    initScrollReveal();
  });
})();
