// // DOM이 모두 준비된 후 실행
// window.addEventListener("DOMContentLoaded", () => {
//   /* =======================================================
//      0) 다국어 사전 + 언어 가져오기
//   ======================================================= */

//   const i18n = {
//     en: {
//       brandTitle: "Investment Portfolio",
//       currencyTitle: "USD/KRW",
//       spTitle: "S&P 500 Chart",
//       spSubtitle: "SPY ETF line chart (with prediction)",
//       weightsTitle: "Company Weights",
//       weightsSubtitle: "Portfolio distribution by company",
//       marketTitle: "Market Indicators",
//       time1w: "1W",
//       time1m: "1M",
//       time6m: "6M",
//       time1y: "1Y",
//       marketGold: "Gold Futures",
//       marketVix: "VIX Index",
//       marketTreasury: "Treasury ETF",
//       chatTitle: "Portfolio Chatbot",
//       chatPlaceholder: "Ask about your portfolio or the market...",
//       chartActual: "Actual",
//       chartPredicted: "Predicted",
//     },
//     ko: {
//       brandTitle: "투자 포트폴리오",
//       currencyTitle: "달러 환율",
//       spTitle: "S&P 500 차트",
//       spSubtitle: "SPY ETF 수익률 및 예측 차트",
//       weightsTitle: "기업 비중",
//       weightsSubtitle: "기업별 비중",
//       marketTitle: "시장 지표",
//       time1w: "1주",
//       time1m: "1개월",
//       time6m: "6개월",
//       time1y: "1년",
//       marketGold: "금선물",
//       marketVix: "공포지수",
//       marketTreasury: "단기국채",
//       chatTitle: "포트폴리오 챗봇",
//       chatPlaceholder: "포트폴리오나 시장에 대해 물어보세요...",
//       chartActual: "실제값",
//       chartPredicted: "예측값",
//     },
//   };

//   function getLang() {
//     return localStorage.getItem("lang") || "ko";
//   }

//   /* =======================================================
//      1) S&P 500 차트
//      - 1주: 캔들 차트 (전날 종가 = 오늘 시가)
//      - 1개월 / 6개월 / 1년: 종가 기준 라인 차트 (실제선 + 예측선)
//   ======================================================= */

//   // 1주 캔들용 전체 날짜 + 종가 (예시 데이터)
//   const allDates = [
//     "2025-01-02", "2025-01-03", "2025-01-06",
//     "2025-01-07", "2025-01-08", "2025-01-09",
//     "2025-01-10", "2025-01-13", "2025-01-14", "2025-01-15"
//   ];
//   const allCloses = [420, 421, 419, 422, 425, 430, 432, 431, 435, 437];

//   // 마지막 5일(1주) + 그 이전 종가로 OHLC 생성
//   function buildWeeklyOhlc(dates, closes) {
//     if (closes.length < 6) {
//       console.error("1주 캔들을 만들려면 최소 6개(이전 종가 포함)가 필요합니다.");
//       return [];
//     }

//     const last5Dates  = dates.slice(-5);
//     const last5Closes = closes.slice(-5);
//     const prevClose   = closes[closes.length - 6]; // 첫 날 시가

//     return last5Dates.map((dateStr, i) => {
//       // ✅ 다시 millis 로
//       const dt = luxon.DateTime.fromISO(dateStr);
//       const x = dt.toMillis();

//       const open  = i === 0 ? prevClose : last5Closes[i - 1];
//       const close = last5Closes[i];

//       const bodyHigh = Math.max(open, close);
//       const bodyLow  = Math.min(open, close);

//       const wickSize = 1.5;

//       const high = bodyHigh + wickSize;
//       const low  = bodyLow  - wickSize;

//       return {
//         x,
//         o: open,
//         h: high,
//         l: low,
//         c: close,
//       };
//     });
//   }


//   // 1M / 6M / 1Y 라인 차트용 (더미)
//   const lineDataByRange = {
//     "1M": {
//       labelsEn: ["W1", "W2", "W3", "W4"],
//       labelsKo: ["1주차", "2주차", "3주차", "4주차"],
//       actual:    [420, 425, 430, 433],
//       predicted: [421, 426, 431, 435],
//     },
//     "6M": {
//       labelsEn: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
//       labelsKo: ["6월", "7월", "8월", "9월", "10월", "11월"],
//       actual:    [422, 425, 423, 427, 429, 433],
//       predicted: [423, 426, 424, 428, 431, 436],
//     },
//     "1Y": {
//       labelsEn: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"],
//       labelsKo: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월"],
//       actual:    [406, 411, 415, 414, 419, 422, 425, 423, 427, 429, 433],
//       predicted: [407, 413, 417, 416, 421, 424, 428, 426, 430, 432, 436],
//     },
//   };

//   const ctxLine = document.getElementById("spyLineChart").getContext("2d");

//   // 라인 차트용 그라디언트
//   const gradient = ctxLine.createLinearGradient(0, 0, 0, 260);
//   gradient.addColorStop(0, "rgba(34,197,94,0.28)");
//   gradient.addColorStop(1, "rgba(34,197,94,0.0)");

//   let spyChart = null;
//   const defaultRange = "1Y";

//   function destroyExistingChart() {
//     if (spyChart) {
//       spyChart.destroy();
//       spyChart = null;
//     }
//   }

//   // 1주 캔들
//   function createWeekCandlestick() {
//     const weekOhlc = buildWeeklyOhlc(allDates, allCloses);
//     if (!weekOhlc.length) return;

//     destroyExistingChart();

//     const lang = getLang();

//     spyChart = new Chart(ctxLine, {
//       type: "candlestick",
//       data: {
//         datasets: [
//           {
//             label: "1주 캔들",
//             data: weekOhlc,
//           },
//         ],
//       },
//       options: {
//         scales: {
//           x: {
//             type: "time",
//             time: {
//               unit: "day",
//             },
//             // ✅ 캔들 간 간격을 “시간 간격”이 아니라 “데이터 순서” 기준으로
//             distribution: "series",

//             ticks: {
//               source: "data",   // 데이터에 있는 x값(5개)을 모두 tick으로
//               autoSkip: false,  // 자동 생략 없이 전부 표시
//               callback: (value, index, ticks) => {
//                 const ts = ticks[index].value; // millis
//                 const dt = luxon.DateTime.fromMillis(ts);
//                 return lang === "ko"
//                   ? dt.toFormat("M월 d일")
//                   : dt.toFormat("LLL d");
//               },
//             },
//             grid: {
//               display: true,    // 각 tick마다 세로선
//             },
//           },
//           y: {
//             ticks: {
//               callback: (v) => "$" + v,
//             },
//           },
//         },
//         plugins: {
//           legend: {
//             display: true,
//           },
//         },
//       },
//     });
//   }


//   // 1M / 6M / 1Y 라인차트
//   function createLineChart(rangeKey) {
//     const data = lineDataByRange[rangeKey];
//     if (!data) return;

//     const lang = getLang();
//     const dict = i18n[lang] || i18n["ko"];
//     const labels = lang === "ko" ? data.labelsKo : data.labelsEn;

//     destroyExistingChart();

//     spyChart = new Chart(ctxLine, {
//       type: "line",
//       data: {
//         labels: labels,
//         datasets: [
//           {
//             label: dict.chartActual,      // ✅ 실제값 / Actual
//             data: data.actual,
//             borderColor: "#3b82f6",
//             backgroundColor: gradient,
//             fill: true,
//             pointRadius: 3,
//             pointBackgroundColor: "#3b82f6",
//             tension: 0.35,
//           },
//           {
//             label: dict.chartPredicted,   // ✅ 예측값 / Predicted
//             data: data.predicted,
//             borderColor: "#ef4444",
//             borderDash: [6, 4],
//             fill: false,
//             pointRadius: 0,
//             tension: 0.35,
//           },
//         ],
//       },
//       options: {
//         plugins: {
//           legend: {
//             display: true,
//             labels: {
//               usePointStyle: true,
//               boxWidth: 8,
//             },
//           },
//         },
//         scales: {
//           y: {
//             ticks: {
//               callback: (v) => "$" + v,
//             },
//           },
//         },
//       },
//     });
//   }

//   // 기간 버튼
//   const rangeButtons = document.querySelectorAll(".time-toggle button");

//   function setActiveButton(targetRange) {
//     rangeButtons.forEach((btn) => {
//       const r = btn.getAttribute("data-range");
//       btn.classList.toggle("active", r === targetRange);
//     });
//   }

//   rangeButtons.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const rangeKey = btn.getAttribute("data-range");
//       if (rangeKey === "1W") {
//         createWeekCandlestick();
//       } else {
//         createLineChart(rangeKey);
//       }
//       setActiveButton(rangeKey);
//     });
//   });

//   // 최초 로드: 1년 라인차트
//   createLineChart(defaultRange);
//   setActiveButton(defaultRange);

//   /* =======================================================
//      2) Donut Chart (Company Weights)
//   ======================================================= */
//   const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

//   const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];
//   const weights = [7.1, 6.5, 6.2, 3.8, 2.1];
//   const colors = [
//     "#5470C6",
//     "#91CC75",
//     "#FAC858",
//     "#EE6666",
//     "#73C0DE",
//   ];
//   const donutBgColor = "#f9fafb";

//   new Chart(ctxDonut, {
//     type: "doughnut",
//     data: {
//       labels: companies,
//       datasets: [
//         {
//           data: weights,
//           backgroundColor: colors,
//           borderWidth: 4,
//           borderColor: donutBgColor,
//           hoverOffset: 10,
//           borderRadius: 8,
//         },
//       ],
//     },
//     options: {
//       cutout: "68%",
//       rotation: -90,
//       responsive: true,
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           backgroundColor: "#0f172a",
//           titleFont: { size: 12 },
//           bodyFont: { size: 11 },
//           padding: 8,
//           callbacks: {
//             label: (ctx) => {
//               const label = ctx.label || "";
//               const value = weights[ctx.dataIndex];
//               return `${label}  ${value}%`;
//             },
//           },
//         },
//       },
//     },
//   });

//   const legendContainer = document.getElementById("weightsLegend");
//   companies.forEach((c, i) => {
//     const item = document.createElement("div");
//     item.className = "legend-item";

//     const dot = document.createElement("div");
//     dot.className = "legend-dot";
//     dot.style.backgroundColor = colors[i];

//     const label = document.createElement("span");
//     label.innerText = `${c} ${weights[i]}%`;

//     item.appendChild(dot);
//     item.appendChild(label);
//     legendContainer.appendChild(item);
//   });

//   /* =======================================================
//      3) Chatbot + Proactive Suggestions
//   ======================================================= */
//   const chatToggleBtn = document.getElementById("chatToggleBtn");
//   const chatWidget = document.getElementById("chatWidget");
//   const chatCloseBtn = document.getElementById("chatCloseBtn");
//   const chatForm = document.getElementById("chatForm");
//   const chatInput = document.getElementById("chatInput");
//   const chatMessages = document.getElementById("chatMessages");
//   const chatSuggestions = document.getElementById("chatSuggestions");

//   let chatOpenedOnce = false;

//   const defaultSuggestions = [
//     "오늘 S&P 500 시장 분위기 요약해 줘",
//     "내 포트폴리오 리스크를 줄이는 방법 알려줘",
//     "금리 상승이 주식시장에 미치는 영향 설명해 줘",
//     "VIX 지수가 높다는 건 어떤 의미야?",
//     "장기 투자 vs 단기 투자 차이 알려줘",
//   ];

//   function nextSuggestionsFromUserMessage(msg) {
//     const t = msg.toLowerCase();

//     if (t.includes("gold") || t.includes("금"))
//       return [
//         "금 가격이 오를 때 같이 움직이는 자산이 뭐야?",
//         "금과 주식의 상관관계 설명해 줘",
//         "인플레이션과 금 가격 관계 알려줘",
//       ];

//     if (t.includes("vix") || t.includes("변동성"))
//       return [
//         "VIX가 높을 때 어떤 전략을 쓰는 게 좋아?",
//         "VIX와 S&P 500의 관계를 그래프로 설명해줘",
//         "변동성이 심할 때 분산투자 전략 추천해줘",
//       ];

//     return [
//       "내가 너무 리스크를 많이 지고 있는지 체크해 줄 수 있어?",
//       "ETF 위주로 안정적인 포트폴리오 만들려면 어떻게 해야 해?",
//       "현금 비중은 어느 정도가 좋아?",
//     ];
//   }

//   function appendMessage(text, isUser) {
//     const msg = document.createElement("div");
//     msg.className = "chat-message " + (isUser ? "user" : "bot");

//     const bubble = document.createElement("div");
//     bubble.className = "chat-bubble";
//     bubble.textContent = text;

//     msg.appendChild(bubble);
//     chatMessages.appendChild(msg);
//     chatMessages.scrollTop = chatMessages.scrollHeight;
//   }

//   function renderSuggestions(list) {
//     chatSuggestions.innerHTML = "";
//     list.forEach((s) => {
//       const btn = document.createElement("button");
//       btn.className = "chat-suggestion-btn";
//       btn.textContent = s;
//       btn.onclick = () => sendUserMessage(s);
//       chatSuggestions.appendChild(btn);
//     });
//   }

//   function clearSuggestions() {
//     chatSuggestions.innerHTML = "";
//   }

//   async function sendUserMessage(text) {
//     const trimmed = text.trim();
//     if (!trimmed) return;

//     appendMessage(trimmed, true);
//     clearSuggestions();
//     chatInput.value = "";

//     appendMessage("답변을 불러오는 중입니다...", false);
//     const loadingMsg = chatMessages.lastChild;

//     try {
//       const resp = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: trimmed }),
//       });

//       const data = await resp.json();
//       loadingMsg.remove();
//       appendMessage(data.reply ?? "응답을 가져오지 못했습니다.", false);

//       renderSuggestions(nextSuggestionsFromUserMessage(trimmed));
//     } catch (err) {
//       console.error(err);
//       loadingMsg.remove();
//       appendMessage("네트워크 오류가 발생했습니다.", false);
//     }
//   }

//   chatToggleBtn.addEventListener("click", () => {
//     const isOpen = chatWidget.style.display === "flex";
//     chatWidget.style.display = isOpen ? "none" : "flex";

//     if (!isOpen && !chatOpenedOnce) {
//       chatOpenedOnce = true;
//       appendMessage(
//         "안녕하세요! 투자·시장 관련 질문을 도와드리는 챗봇입니다. 아래 추천 질문을 눌러보세요!",
//         false
//       );
//       renderSuggestions(defaultSuggestions);
//     }
//   });

//   chatCloseBtn.addEventListener("click", () => {
//     chatWidget.style.display = "none";
//   });

//   chatForm.addEventListener("submit", (e) => {
//     e.preventDefault();
//     sendUserMessage(chatInput.value);
//   });

//   /* =======================================================
//      4) Language & Theme Toggle
//   ======================================================= */
//   const langToggleBtn = document.getElementById("langToggle");
//   const langLabel = document.getElementById("langLabel");
//   const themeToggleBtn = document.getElementById("themeToggle");
//   const themeIcon = document.getElementById("themeIcon");
//   const themeLabel = document.getElementById("themeLabel");

//   let currentLang = localStorage.getItem("lang") || "ko";
//   let currentTheme = localStorage.getItem("theme") || "light";

//   function applyLanguage(lang) {
//     const dict = i18n[lang];
//     if (!dict) return;

//     document.querySelectorAll("[data-i18n]").forEach((el) => {
//       const key = el.getAttribute("data-i18n");
//       if (dict[key]) el.textContent = dict[key];
//     });

//     document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
//       const key = el.getAttribute("data-i18n-placeholder");
//       if (dict[key]) el.placeholder = dict[key];
//     });

//     document.documentElement.lang = lang === "ko" ? "ko" : "en";
//     langLabel.textContent = lang === "ko" ? "한국어" : "English";
//     localStorage.setItem("lang", lang);
//   }

//   function applyTheme(theme) {
//     const isDark = theme === "dark";
//     document.body.classList.toggle("dark-mode", isDark);

//     if (isDark) {
//       themeIcon.innerHTML = `
//         <img src="달.png" alt="moon" class="theme-img" />
//       `;
//       themeLabel.textContent = "다크";
//     } else {
//       themeIcon.innerHTML = `
//         <img src="해.png" alt="sun" class="theme-img" />
//       `;
//       themeLabel.textContent = "라이트";
//     }

//     localStorage.setItem("theme", theme);
//   }

//   langToggleBtn.addEventListener("click", () => {
//     currentLang = currentLang === "ko" ? "en" : "ko";
//     applyLanguage(currentLang);

//     // 현재 활성화된 기간 버튼 기준으로 차트 다시 그림
//     const activeBtn = document.querySelector(".time-toggle button.active");
//     const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

//     if (activeRange === "1W") {
//       createWeekCandlestick();
//     } else {
//       createLineChart(activeRange);
//     }
//   });

//   themeToggleBtn.addEventListener("click", () => {
//     currentTheme = currentTheme === "light" ? "dark" : "light";
//     applyTheme(currentTheme);
//   });

//   // 초기 언어/테마 적용
//   applyLanguage(currentLang);
//   applyTheme(currentTheme);
// });




// DOM이 모두 준비된 후 실행
window.addEventListener("DOMContentLoaded", () => {
/* =======================================================
    0) 다국어 사전 + 언어 가져오기
======================================================= */

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
    chartActual: "Actual",
    chartPredicted: "Predicted",
    weeklyCandle: "1W Candle",

    // 🔽 설명용 텍스트
    spDesc: "S&P 500 consists of 500 major U.S. companies and represents the overall U.S. stock market trend.",
    weightsDesc: "Weight indicates how much each stock occupies in your total investment.",
    marketDesc: "Market indicators show risk, sentiment, and demand for safe assets in the market.",
    goldDesc: "Gold futures represent agreements to trade gold at a predetermined price in the future.",
    vixDesc: "VIX Index shows expected volatility of S&P 500 over the next 30 days.",
    treasuryDesc: "Short-term Treasury ETFs invest in low-risk government bonds with short maturity.",
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
    chartActual: "실제값",
    chartPredicted: "예측값",
    weeklyCandle: "1주 캔들",

    spDesc: "S&P 500: 미국 증시에 상장된 대표 500개 대형 기업으로 구성된 지수입니다.",
    weightsDesc: "종목 비중은 전체 투자금 대비 각 기업이 차지하는 비율입니다.",
    marketDesc: "시장 지표는 금 선물, 변동성 지수(VIX), 국채 ETF 등으로 시장의 위험도와 투자 심리를 보여줍니다.",
    goldDesc: "금 선물은 미래의 금 가격을 미리 정해두고 거래하는 파생상품입니다.",
    vixDesc: "VIX 지수는 앞으로 30일간 S&P 500의 변동성에 대한 시장 기대치를 보여줍니다.",
    treasuryDesc: "단기 국채 ETF는 만기가 짧은 국채에 투자하는 비교적 안전한 자산입니다.",
  },
};





  function applyTooltips(lang) {
    const dict = i18n[lang] || i18n["ko"];

    document.querySelectorAll("[data-tooltip-key]").forEach((el) => {
      const key = el.getAttribute("data-tooltip-key");
      const text = dict[key];
      if (text) {
        // CSS ::after 에서 attr(data-tooltip)을 쓰고 있으므로
        // 여기서 언어별 설명을 꽂아 넣어주는 것
        el.setAttribute("data-tooltip", text);
      }
    });
  }




  
  function getLang() {
    return localStorage.getItem("lang") || "ko";
  }

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

    return last5Dates.map((dateStr, i) => {
      const dt = luxon.DateTime.fromISO(dateStr);
      const x = dt.toMillis();

      const open  = i === 0 ? prevClose : last5Closes[i - 1];
      const close = last5Closes[i];

      const bodyHigh = Math.max(open, close);
      const bodyLow  = Math.min(open, close);

      const wickSize = 1.5;

      const high = bodyHigh + wickSize;
      const low  = bodyLow  - wickSize;

      return {
        x,
        o: open,
        h: high,
        l: low,
        c: close,
      };
    });
  }

  // 1M / 6M / 1Y 라인 차트용 (더미)
  const lineDataByRange = {
    "1M": {
      labelsEn: ["W1", "W2", "W3", "W4"],
      labelsKo: ["1주차", "2주차", "3주차", "4주차"],
      actual:    [420, 425, 430, 433],
      predicted: [421, 426, 431, 435],
    },
    "6M": {
      labelsEn: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      labelsKo: ["6월", "7월", "8월", "9월", "10월", "11월"],
      actual:    [422, 425, 423, 427, 429, 433],
      predicted: [423, 426, 424, 428, 431, 436],
    },
    "1Y": {
      labelsEn: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov"],
      labelsKo: ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월"],
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
  // 범위 안벌어지는데 날짜문제
  // function createWeekCandlestick() {
  //   const weekOhlc = buildWeeklyOhlc(allDates, allCloses);
  //   if (!weekOhlc.length) return;

  //   destroyExistingChart();

  //   const lang = getLang();
  //   const dict = i18n[lang];

  //   spyChart = new Chart(ctxLine, {
  //     type: "candlestick",
  //     data: {
  //       datasets: [
  //         {
  //           label: dict.weeklyCandle,   // ← 언어 반영됨
  //           data: weekOhlc,
  //         },
  //       ],
  //     },
  //     options: {
  //       scales: {
  //         y: {
  //           ticks: {
  //             callback: (v) => "$" + v,
  //           },
  //         },
  //       },
  //     },
  //   });
  // }


  function createWeekCandlestick() {
    const weekOhlc = buildWeeklyOhlc(allDates, allCloses);
    if (!weekOhlc.length) return;

    destroyExistingChart();

    const lang = getLang();
    const dict = i18n[lang];

    spyChart = new Chart(ctxLine, {
      type: "candlestick",
      data: {
        datasets: [
          {
            label: dict.weeklyCandle,   // ← i18n 적용 완료
            data: weekOhlc,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: {
              unit: "day",
            },
            distribution: "series",
            ticks: {
              source: "data",
              autoSkip: false,
              callback: (value, index, ticks) => {
                const ts = ticks[index].value;
                const dt = luxon.DateTime.fromMillis(ts);
                // 🇰🇷/🇺🇸 상관없이 항상 "1/9" 이런 형식
                return dt.toFormat("M/d");
              },
            },
            grid: {
              display: true,
            },
          },
          y: {
            ticks: {
              callback: (v) => "$" + v,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
          },
        },
      },
    });
  }

  // 1M / 6M / 1Y 라인차트
  function createLineChart(rangeKey) {
    const data = lineDataByRange[rangeKey];
    if (!data) return;

    const lang = getLang();
    const dict = i18n[lang] || i18n["ko"];
    const labels = lang === "ko" ? data.labelsKo : data.labelsEn;

    destroyExistingChart();

    spyChart = new Chart(ctxLine, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: dict.chartActual,      // ✅ 실제값 / Actual
            data: data.actual,
            borderColor: "#3b82f6",
            backgroundColor: gradient,
            fill: true,
            pointRadius: 3,
            pointBackgroundColor: "#3b82f6",
            tension: 0.35,
          },
          {
            label: dict.chartPredicted,   // ✅ 예측값 / Predicted
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

  // 티커(그래프용)
  const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];

  // 툴팁/범례에서 쓸 회사 이름 (언어별)
  const companyNamesKo = ["애플", "마이크로소프트", "엔비디아", "아마존", "구글"];
  const companyNamesEn = ["Apple", "Microsoft", "NVIDIA", "Amazon", "Google"];

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
      labels: companies,   // 라벨은 그대로 티커 사용
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
          titleFont: { size: 15 },
          bodyFont: { size: 14 },
          padding: 10,
          callbacks: {
            label: (ctx) => {
              const idx = ctx.dataIndex;
              const lang = getLang(); // 현재 언어 (ko / en)

              const name =
                lang === "ko" ? companyNamesKo[idx] : companyNamesEn[idx];

              const value = weights[idx];
              return `${name}  ${value}%`;
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

  function applyLanguage(lang) {
    const dict = i18n[lang];
    if (!dict) return;

    // 텍스트 교체
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });

    // placeholder 교체
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) el.placeholder = dict[key];
    });

    // 🔥 툴팁 텍스트도 언어별로 교체
    applyTooltips(lang);

    // HTML lang, 버튼 라벨, localStorage 저장
    document.documentElement.lang = lang === "ko" ? "ko" : "en";
    langLabel.textContent = lang === "ko" ? "한국어" : "English";
    localStorage.setItem("lang", lang);
  }


  function applyTheme(theme) {
    const isDark = theme === "dark";
    document.body.classList.toggle("dark-mode", isDark);

    if (isDark) {
      themeIcon.innerHTML = `
        <img src="달.png" alt="moon" class="theme-img" />
      `;
      themeLabel.textContent = "다크";
    } else {
      themeIcon.innerHTML = `
        <img src="해.png" alt="sun" class="theme-img" />
      `;
      themeLabel.textContent = "라이트";
    }

    localStorage.setItem("theme", theme);
  }

  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "ko" ? "en" : "ko";
    applyLanguage(currentLang);

    // 현재 활성화된 기간 버튼 기준으로 차트 다시 그림
    const activeBtn = document.querySelector(".time-toggle button.active");
    const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

    if (activeRange === "1W") {
      createWeekCandlestick();
    } else {
      createLineChart(activeRange);
    }
  });

  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(currentTheme);
  });

  // 초기 언어/테마 적용
  applyLanguage(currentLang);
  applyTheme(currentTheme);
});