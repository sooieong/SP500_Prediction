// DOM이 모두 준비된 후 실행
window.addEventListener("DOMContentLoaded", () => {
  /* =======================================================
     1) S&P 500 차트
     - 1주: 캔들 차트 (전날 종가 = 오늘 시가)
     - 1개월 / 6개월 / 1년: 종가 기준 라인 차트 (실제선 + 예측선)
  ======================================================= */

  // 1주 캔들용 전체 날짜 + 종가 (예시 데이터)
  const allDates = [
    "2025-01-02", "2025-01-03", "2025-01-06",
    "2025-01-07", "2025-01-08", "2025-01-09",
    "2025-01-10", "2025-01-13", "2025-01-14", "2025-01-15"
  ];
  const allCloses = [420, 421, 419, 422, 425, 430, 432, 431, 435, 437];

  // 마지막 5일(1주) + 그 이전 종가로 OHLC 생성
  function buildWeeklyOhlc(dates, closes) {
    if (closes.length < 6) {
      console.error("1주 캔들을 만들려면 최소 6개(이전 종가 포함)가 필요합니다.");
      return [];
    }

    const last5Dates  = dates.slice(-5);
    const last5Closes = closes.slice(-5);
    const prevClose   = closes[closes.length - 6]; // 첫 날 시가

    return last5Dates.map((date, i) => {
      const open  = i === 0 ? prevClose : last5Closes[i - 1];
      const close = last5Closes[i];
      return {
        x: date,           // adapter-date-fns가 문자열 날짜를 파싱
        o: open,
        h: Math.max(open, close),
        l: Math.min(open, close),
        c: close,
      };
    });
  }

  // 1M / 6M / 1Y 라인 차트용 (더미)
  const lineDataByRange = {
    "1M": {
      labels:    ["W1", "W2", "W3", "W4"],
      actual:    [420, 425, 430, 433],
      predicted: [421, 426, 431, 435],
    },
    "6M": {
      labels:    ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      actual:    [422, 425, 423, 427, 429, 433],
      predicted: [423, 426, 424, 428, 431, 436],
    },
    "1Y": {
      labels:    ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"],
      actual:    [406, 411, 415, 414, 419, 422, 425, 423, 427, 429, 433],
      predicted: [407, 413, 417, 416, 421, 424, 428, 426, 430, 432, 436],
    },
  };

  const ctxLine = document.getElementById("spyLineChart").getContext("2d");

  // 라인 차트용 그라디언트
  const gradient = ctxLine.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, "rgba(34,197,94,0.28)");
  gradient.addColorStop(1, "rgba(34,197,94,0.0)");

  let spyChart = null;
  const defaultRange = "1Y";

  function destroyExistingChart() {
    if (spyChart) {
      spyChart.destroy();
      spyChart = null;
    }
  }

  // 1주 캔들
  function createWeekCandlestick() {
    const weekOhlc = buildWeeklyOhlc(allDates, allCloses);
    if (!weekOhlc.length) return;

    destroyExistingChart();

    spyChart = new Chart(ctxLine, {
      type: "candlestick",
      data: {
        datasets: [
          {
            label: "1주 캔들",
            data: weekOhlc, // [{x,o,h,l,c}, ...]
            color: {
              up: "#22c55e",
              down: "#ef4444",
              unchanged: "#9ca3af",
            },
          },
        ],
      },
      options: {
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.raw;
                return `O:${v.o}  H:${v.h}  L:${v.l}  C:${v.c}`;
              },
            },
          },
        },
        scales: {
          x: {
            type: "time",
            time: {
              parser: "yyyy-MM-dd",
              unit: "day",
              tooltipFormat: "yyyy-MM-dd",
              displayFormats: { day: "MM/dd" },
            },
          },
          y: {
            ticks: {
              callback: (v) => "$" + v,
            },
          },
        },
      },
    });
  }

  // 1M / 6M / 1Y 라인차트
  function createLineChart(rangeKey) {
    const data = lineDataByRange[rangeKey];
    if (!data) return;

    destroyExistingChart();

    spyChart = new Chart(ctxLine, {
      type: "line",
      data: {
        labels: data.labels,
        datasets: [
          {
            label: "Actual",
            data: data.actual,
            borderColor: "#3b82f6",
            backgroundColor: gradient,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#3b82f6",
            tension: 0.35,
          },
          {
            label: "Predicted",
            data: data.predicted,
            borderColor: "#ef4444",
            borderDash: [6, 4],
            fill: false,
            pointRadius: 0,
            tension: 0.35,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            display: true,
            labels: {
              usePointStyle: true,
              boxWidth: 8,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (v) => "$" + v,
            },
          },
        },
      },
    });
  }

  // 기간 버튼
  const rangeButtons = document.querySelectorAll(".time-toggle button");

  function setActiveButton(targetRange) {
    rangeButtons.forEach((btn) => {
      const r = btn.getAttribute("data-range");
      btn.classList.toggle("active", r === targetRange);
    });
  }

  rangeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const rangeKey = btn.getAttribute("data-range");
      if (rangeKey === "1W") {
        createWeekCandlestick();
      } else {
        createLineChart(rangeKey);
      }
      setActiveButton(rangeKey);
    });
  });

  // 최초 로드: 1년 라인차트
  createLineChart(defaultRange);
  setActiveButton(defaultRange);

  /* =======================================================
     2) Donut Chart (Company Weights)
  ======================================================= */
  const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

  const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];
  const weights = [7.1, 6.5, 6.2, 3.8, 2.1];
  const colors = [
    "#5470C6",
    "#91CC75",
    "#FAC858",
    "#EE6666",
    "#73C0DE",
  ];
  const donutBgColor = "#f9fafb";

  new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: companies,
      datasets: [
        {
          data: weights,
          backgroundColor: colors,
          borderWidth: 4,
          borderColor: donutBgColor,
          hoverOffset: 10,
          borderRadius: 8,
        },
      ],
    },
    options: {
      cutout: "68%",
      rotation: -90,
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0f172a",
          titleFont: { size: 12 },
          bodyFont: { size: 11 },
          padding: 8,
          callbacks: {
            label: (ctx) => {
              const label = ctx.label || "";
              const value = weights[ctx.dataIndex];
              return `${label}  ${value}%`;
            },
          },
        },
      },
    },
  });

  const legendContainer = document.getElementById("weightsLegend");
  companies.forEach((c, i) => {
    const item = document.createElement("div");
    item.className = "legend-item";

    const dot = document.createElement("div");
    dot.className = "legend-dot";
    dot.style.backgroundColor = colors[i];

    const label = document.createElement("span");
    label.innerText = `${c} ${weights[i]}%`;

    item.appendChild(dot);
    item.appendChild(label);
    legendContainer.appendChild(item);
  });

  /* =======================================================
     3) Chatbot + Proactive Suggestions
  ======================================================= */
  const chatToggleBtn = document.getElementById("chatToggleBtn");
  const chatWidget = document.getElementById("chatWidget");
  const chatCloseBtn = document.getElementById("chatCloseBtn");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatMessages = document.getElementById("chatMessages");
  const chatSuggestions = document.getElementById("chatSuggestions");

  let chatOpenedOnce = false;

  const defaultSuggestions = [
    "오늘 S&P 500 시장 분위기 요약해 줘",
    "내 포트폴리오 리스크를 줄이는 방법 알려줘",
    "금리 상승이 주식시장에 미치는 영향 설명해 줘",
    "VIX 지수가 높다는 건 어떤 의미야?",
    "장기 투자 vs 단기 투자 차이 알려줘",
  ];

  function nextSuggestionsFromUserMessage(msg) {
    const t = msg.toLowerCase();

    if (t.includes("gold") || t.includes("금"))
      return [
        "금 가격이 오를 때 같이 움직이는 자산이 뭐야?",
        "금과 주식의 상관관계 설명해 줘",
        "인플레이션과 금 가격 관계 알려줘",
      ];

    if (t.includes("vix") || t.includes("변동성"))
      return [
        "VIX가 높을 때 어떤 전략을 쓰는 게 좋아?",
        "VIX와 S&P 500의 관계를 그래프로 설명해줘",
        "변동성이 심할 때 분산투자 전략 추천해줘",
      ];

    return [
      "내가 너무 리스크를 많이 지고 있는지 체크해 줄 수 있어?",
      "ETF 위주로 안정적인 포트폴리오 만들려면 어떻게 해야 해?",
      "현금 비중은 어느 정도가 좋아?",
    ];
  }

  function appendMessage(text, isUser) {
    const msg = document.createElement("div");
    msg.className = "chat-message " + (isUser ? "user" : "bot");

    const bubble = document.createElement("div");
    bubble.className = "chat-bubble";
    bubble.textContent = text;

    msg.appendChild(bubble);
    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function renderSuggestions(list) {
    chatSuggestions.innerHTML = "";
    list.forEach((s) => {
      const btn = document.createElement("button");
      btn.className = "chat-suggestion-btn";
      btn.textContent = s;
      btn.onclick = () => sendUserMessage(s);
      chatSuggestions.appendChild(btn);
    });
  }

  function clearSuggestions() {
    chatSuggestions.innerHTML = "";
  }

  async function sendUserMessage(text) {
    const trimmed = text.trim();
    if (!trimmed) return;

    appendMessage(trimmed, true);
    clearSuggestions();
    chatInput.value = "";

    appendMessage("답변을 불러오는 중입니다...", false);
    const loadingMsg = chatMessages.lastChild;

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });

      const data = await resp.json();
      loadingMsg.remove();
      appendMessage(data.reply ?? "응답을 가져오지 못했습니다.", false);

      renderSuggestions(nextSuggestionsFromUserMessage(trimmed));
    } catch (err) {
      console.error(err);
      loadingMsg.remove();
      appendMessage("네트워크 오류가 발생했습니다.", false);
    }
  }

  chatToggleBtn.addEventListener("click", () => {
    const isOpen = chatWidget.style.display === "flex";
    chatWidget.style.display = isOpen ? "none" : "flex";

    if (!isOpen && !chatOpenedOnce) {
      chatOpenedOnce = true;
      appendMessage(
        "안녕하세요! 투자·시장 관련 질문을 도와드리는 챗봇입니다. 아래 추천 질문을 눌러보세요!",
        false
      );
      renderSuggestions(defaultSuggestions);
    }
  });

  chatCloseBtn.addEventListener("click", () => {
    chatWidget.style.display = "none";
  });

  chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendUserMessage(chatInput.value);
  });

  /* =======================================================
     4) Language & Theme Toggle
  ======================================================= */
  const langToggleBtn = document.getElementById("langToggle");
  const langLabel = document.getElementById("langLabel");
  const themeToggleBtn = document.getElementById("themeToggle");
  const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");

  let currentLang = localStorage.getItem("lang") || "ko";
  let currentTheme = localStorage.getItem("theme") || "light";

  const i18n = {
    en: {
      brandTitle: "Investment Portfolio",
      currencyTitle: "USD/KRW",
      spTitle: "S&P 500 Chart",
      spSubtitle: "SPY ETF line chart (with prediction)",
      weightsTitle: "Company Weights",
      weightsSubtitle: "Portfolio distribution by company",
      marketTitle: "Market Indicators",
      time1w: "1W",
      time1m: "1M",
      time6m: "6M",
      time1y: "1Y",
      marketGold: "Gold Futures",
      marketVix: "VIX Index",
      marketTreasury: "Treasury ETF",
      chatTitle: "Portfolio Chatbot",
      chatPlaceholder: "Ask about your portfolio or the market...",
    },
    ko: {
      brandTitle: "투자 포트폴리오",
      currencyTitle: "달러 환율",
      spTitle: "S&P 500 차트",
      spSubtitle: "SPY ETF 수익률 및 예측 차트",
      weightsTitle: "기업 비중",
      weightsSubtitle: "기업별 비중",
      marketTitle: "시장 지표",
      time1w: "1주",
      time1m: "1개월",
      time6m: "6개월",
      time1y: "1년",
      marketGold: "금선물",
      marketVix: "공포지수",
      marketTreasury: "단기국채",
      chatTitle: "포트폴리오 챗봇",
      chatPlaceholder: "포트폴리오나 시장에 대해 물어보세요...",
    },
  };

  function applyLanguage(lang) {
    const dict = i18n[lang];
    if (!dict) return;

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) el.placeholder = dict[key];
    });

    document.documentElement.lang = lang === "ko" ? "ko" : "en";
    langLabel.textContent = lang === "ko" ? "한국어" : "English";
    localStorage.setItem("lang", lang);
  }

  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);

    if (isDark) {
      themeIcon.textContent = "🌙";
      themeLabel.textContent = "다크";
    } else {
      themeIcon.textContent = "🌞";
      themeLabel.textContent = "라이트";
    }

    localStorage.setItem("theme", theme);
  }

  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "ko" ? "en" : "ko";
    applyLanguage(currentLang);
  });

  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(currentTheme);
  });

  applyLanguage(currentLang);
  applyTheme(currentTheme);
});
