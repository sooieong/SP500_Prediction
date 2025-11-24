// // DOM이 모두 준비된 후 실행
// window.addEventListener("DOMContentLoaded", () => {
//   /* =======================================================
//       0) 다국어 사전 + 언어 가져오기
//   ======================================================= */

//   const i18n = {
//     en: {
//       brandTitle: "Jootopia",
//       currencyTitle: "USD/KRW",
//       spTitle: "S&P 500 Chart",
//       spSubtitle: "SPY ETF line chart (with prediction)",
//       weightsTitle: "Company Weights",
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
//       weeklyCandle: "1W Candle",
//       spyName: "SPDR S&P 500 ETF Trust",
//       chatSend: "Send",

//       spDesc:
//         "S&P 500 consists of 500 major U.S. companies and represents the overall U.S. stock market trend.",
//       weightsDesc:
//         "Company weights represent the proportion each company holds within the S&P 500.",
//       marketDesc:
//         "Market indicators such as gold futures, the VIX, and short-term Treasury ETFs reflect overall market risk and investor sentiment.",
//       goldDesc:
//         "Gold futures represent agreements to trade gold at a predetermined price in the future.",
//       vixDesc:
//         "VIX Index shows expected volatility of S&P 500 over the next 30 days.",
//       treasuryDesc:
//         "Short-term Treasury ETFs invest in low-risk government bonds with short maturity.",
//     },
//     ko: {
//       brandTitle: "주토피아",
//       currencyTitle: "달러 환율",
//       spTitle: "S&P 500 차트",
//       spSubtitle: "SPY ETF 수익률 및 예측 차트",
//       weightsTitle: "기업 비중",
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
//       weeklyCandle: "1주 캔들",
//       spyName: "SPDR S&P 500 ETF 신뢰",
//       chatSend: "보내기",

//       spDesc:
//         "S&P 500: 미국 증시에 상장된 대표 500개 대형 기업으로 구성된 지수입니다.",
//       weightsDesc:
//         "기업 비중은 S&P 500에 각 기업이 차지하는 비율입니다.",
//       marketDesc:
//         "시장 지표는 금 선물, 공포 지수(VIX), 단기국채 등으로 시장의 위험도와 투자 심리를 보여줍니다.",
//       goldDesc:
//         "금 선물은 미래의 금 가격을 미리 정해두고 거래하는 파생상품입니다.",
//       vixDesc:
//         "VIX 지수는 앞으로 30일간 S&P 500의 변동성에 대한 시장 기대치를 보여줍니다.",
//       treasuryDesc:
//         "단기 국채 ETF는 만기가 짧은 국채에 투자하는 비교적 안전한 자산입니다.",
//     },
//   };

//   function applyTooltips(lang) {
//     const dict = i18n[lang] || i18n["ko"];

//     document.querySelectorAll("[data-tooltip-key]").forEach((el) => {
//       const key = el.getAttribute("data-tooltip-key");
//       const text = dict[key];
//       if (text) {
//         el.setAttribute("data-tooltip", text);
//       }
//     });
//   }

//   function getLang() {
//     return localStorage.getItem("lang") || "ko";
//   }

//   function isDarkMode() {
//     return document.body.classList.contains("dark-mode");
//   }

//   /* =======================================================
//       1) S&P 500 차트
//       - 1주: 캔들 차트 (전날 종가 = 오늘 시가)
//       - 1개월 / 6개월 / 1년: 종가 기준 라인 차트 (실제선 + 예측선)
//   ======================================================= */

//   const allDates = [
//     "2025-01-02",
//     "2025-01-03",
//     "2025-01-06",
//     "2025-01-07",
//     "2025-01-08",
//     "2025-01-09",
//     "2025-01-10",
//     "2025-01-13",
//     "2025-01-14",
//     "2025-01-15",
//   ];
//   const allCloses = [420, 421, 419, 422, 425, 430, 432, 431, 435, 437];

//   function buildWeeklyOhlc(dates, closes) {
//     if (closes.length < 6) {
//       console.error(
//         "1주 캔들을 만들려면 최소 6개(이전 종가 포함)가 필요합니다."
//       );
//       return [];
//     }

//     const last5Dates = dates.slice(-5);
//     const last5Closes = closes.slice(-5);
//     const prevClose = closes[closes.length - 6]; // 첫날 시가

//     return last5Dates.map((dateStr, i) => {
//       const dt = luxon.DateTime.fromISO(dateStr);
//       const x = dt.toMillis();

//       const open = i === 0 ? prevClose : last5Closes[i - 1];
//       const close = last5Closes[i];

//       const bodyHigh = Math.max(open, close);
//       const bodyLow = Math.min(open, close);

//       const wickSize = 1.5;
//       const high = bodyHigh + wickSize;
//       const low = bodyLow - wickSize;

//       return { x, o: open, h: high, l: low, c: close };
//     });
//   }

//   const lineDataByRange = {
//     "1M": {
//       labelsEn: ["W1", "W2", "W3", "W4"],
//       labelsKo: ["1주차", "2주차", "3주차", "4주차"],
//       actual: [420, 425, 430, 433],
//       predicted: [421, 426, 431, 435],
//     },
//     "6M": {
//       labelsEn: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
//       labelsKo: ["6월", "7월", "8월", "9월", "10월", "11월"],
//       actual: [422, 425, 423, 427, 429, 433],
//       predicted: [423, 426, 424, 428, 431, 436],
//     },
//     "1Y": {
//       labelsEn: [
//         "Jan",
//         "Feb",
//         "Mar",
//         "Apr",
//         "May",
//         "Jun",
//         "Jul",
//         "Aug",
//         "Sep",
//         "Oct",
//         "Nov",
//       ],
//       labelsKo: [
//         "1월",
//         "2월",
//         "3월",
//         "4월",
//         "5월",
//         "6월",
//         "7월",
//         "8월",
//         "9월",
//         "10월",
//         "11월",
//       ],
//       actual: [406, 411, 415, 414, 419, 422, 425, 423, 427, 429, 433],
//       predicted: [407, 413, 417, 416, 421, 424, 428, 426, 430, 432, 436],
//     },
//   };

//   const ctxLine = document.getElementById("spyLineChart").getContext("2d");
//   let spyChart = null;
//   const defaultRange = "1Y";

//   const lineLegendContainer = document.getElementById("lineLegend");

//   // 커스텀 레전드 렌더 함수
//   function renderLineLegend() {
//     if (!lineLegendContainer) return;

//     const lang = getLang();
//     const dict = i18n[lang] || i18n["ko"];

//     lineLegendContainer.innerHTML = "";

//     const items = [
//       { key: "chartActual", cls: "actual" },
//       { key: "chartPredicted", cls: "predicted" },
//     ];

//     items.forEach((item) => {
//       const wrapper = document.createElement("div");
//       wrapper.className = "line-legend-item";

//       const circle = document.createElement("div");
//       circle.className = "line-legend-circle " + item.cls;

//       const label = document.createElement("span");
//       label.textContent = dict[item.key];

//       wrapper.appendChild(circle);
//       wrapper.appendChild(label);
//       lineLegendContainer.appendChild(wrapper);
//     });
//   }


//   function destroyExistingChart() {
//     if (spyChart) {
//       spyChart.destroy();
//       spyChart = null;
//     }
//   }

//   function createWeekCandlestick() {
//     const weekOhlc = buildWeeklyOhlc(allDates, allCloses);
//     if (!weekOhlc.length) return;

//     destroyExistingChart();

//     const lang = getLang();
//     const dict = i18n[lang];

//     spyChart = new Chart(ctxLine, {
//       type: "candlestick",
//       data: {
//         datasets: [
//           {
//             label: dict.weeklyCandle,
//             data: weekOhlc,
//           },
//         ],
//       },
//       options: {
//         scales: {
//           x: {
//             type: "time",
//             time: { unit: "day" },
//             distribution: "series",
//             ticks: {
//               source: "data",
//               autoSkip: false,
//               color: isDarkMode() ? "#e5e7eb" : "#4b5563",
//               callback: (value, index, ticks) => {
//                 const ts = ticks[index].value;
//                 const dt = luxon.DateTime.fromMillis(ts);
//                 return dt.toFormat("M/d");
//               },
//             },
//             grid: {
//               display: true,
//               color: isDarkMode()
//                 ? "rgba(148,163,184,0.25)"
//                 : "rgba(148,163,184,0.35)",
//             },
//           },
//           y: {
//             ticks: {
//               color: isDarkMode() ? "#e5e7eb" : "#4b5563",
//               callback: (v) => "$" + v,
//             },
//             grid: {
//               color: isDarkMode()
//                 ? "rgba(30,64,175,0.35)"
//                 : "rgba(148,163,184,0.35)",
//             },
//           },
//         },
//         plugins: {
//           legend: {
//             display: true,
//             labels: {
//               color: isDarkMode() ? "#e5e7eb" : "#111827",
//             },
//           },
//           tooltip: {
//             displayColors: false,
//             callbacks: {
//               title: (tooltipItems) => {
//                 const ts = tooltipItems[0].parsed.x;
//                 const dt = luxon.DateTime.fromMillis(ts);

//                 const lang = getLang();
//                 return lang === "ko"
//                   ? dt.toFormat("yyyy년 M월 d일")
//                   : dt.toFormat("MMM d, yyyy");
//               },
//               label: (ctx) => {
//                 const { o, h, l, c } = ctx.raw;
//                 const lang = getLang();

//                 if (lang === "ko") {
//                   return [`시가: ${o}`, `고가: ${h}`, `저가: ${l}`, `종가: ${c}`];
//                 } else {
//                   return [
//                     `Open: ${o}`,
//                     `High: ${h}`,
//                     `Low: ${l}`,
//                     `Close: ${c}`,
//                   ];
//                 }
//               },
//             },
//           },
//         },
//       },
//     });
//   }

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
//         labels,
//         datasets: [
//           {
//             label: dict.chartActual,
//             data: data.actual,
//             borderColor: "#3b82f6",
//             backgroundColor: "transparent",
//             fill: false,
//             pointRadius: 0,
//             pointHoverRadius: 0,
//             pointHitRadius: 10,
//             tension: 0.35,
//           },
//           {
//             label: dict.chartPredicted,
//             data: data.predicted,
//             borderColor: "#ef4444",
//             borderDash: [6, 4],
//             fill: false,
//             pointRadius: 0,
//             pointHoverRadius: 0,
//             pointHitRadius: 10,
//             tension: 0.35,
//           },
//         ],
//       },
//       options: {
//         interaction: { mode: "index", intersect: false },
//         plugins: {
//           legend: {
//             display: true,
//             labels: {
//               usePointStyle: true,
//               boxWidth: 8,
//               color: isDarkMode() ? "#e5e7eb" : "#111827",
//             },
//           },
//           tooltip: {
//             displayColors: false,
//             callbacks: {
//               label: (ctx) => {
//                 const label = ctx.dataset.label || "";
//                 const value = ctx.parsed.y;
//                 return `${label}: $${value}`;
//               },
//             },
//           },
//         },
//         scales: {
//           x: {
//             ticks: {
//               color: isDarkMode() ? "#e5e7eb" : "#4b5563",
//             },
//             grid: {
//               color: isDarkMode()
//                 ? "rgba(148,163,184,0.25)"
//                 : "rgba(148,163,184,0.35)",
//             },
//           },
//           y: {
//             ticks: {
//               color: isDarkMode() ? "#e5e7eb" : "#4b5563",
//               callback: (v) => "$" + v,
//             },
//             grid: {
//               color: isDarkMode()
//                 ? "rgba(30,64,175,0.35)"
//                 : "rgba(148,163,184,0.35)",
//             },
//           },
//         },
//       },
//     });
//   }

//   // 기간 버튼 & 차트 리드로우 공통 함수
//   const rangeButtons = document.querySelectorAll(".time-toggle button");

//   function setActiveButton(targetRange) {
//     rangeButtons.forEach((btn) => {
//       const r = btn.getAttribute("data-range");
//       btn.classList.toggle("active", r === targetRange);
//     });
//   }

//   function redrawMainChart() {
//     const activeBtn =
//       document.querySelector(".time-toggle button.active") || rangeButtons[0];
//     const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

//     if (activeRange === "1W") {
//       createWeekCandlestick();
//     } else {
//       createLineChart(activeRange);
//     }
//   }

//   rangeButtons.forEach((btn) => {
//     btn.addEventListener("click", () => {
//       const rangeKey = btn.getAttribute("data-range");
//       setActiveButton(rangeKey);
//       redrawMainChart();
//     });
//   });

//   /* =======================================================
//       2) Donut Chart (Company Weights)
//   ======================================================= */

//   let weightsChart = null;
//   const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

//   const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];
//   const companyNamesKo = ["애플", "마이크로소프트", "엔비디아", "아마존", "구글"];
//   const companyNamesEn = ["Apple", "Microsoft", "NVIDIA", "Amazon", "Google"];
//   const weights = [7.1, 6.5, 6.2, 3.8, 2.1];

//   const colors = ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE"];

//   weightsChart = new Chart(ctxDonut, {
//     type: "doughnut",
//     data: {
//       labels: companies,
//       datasets: [
//         {
//           data: weights,
//           backgroundColor: colors,
//           borderWidth: 1.5,
//           borderColor: isDarkMode() ? "#0f172a" : "#ffffff",
//           spacing: 6,
//           hoverOffset: 10,
//           borderRadius: 8,
//         },
//       ],
//     },
//     options: {
//       cutout: "68%",
//       rotation: -90,
//       responsive: true,
//       radius: "90%",
//       plugins: {
//         legend: { display: false },
//         tooltip: {
//           // 라이트 / 다크 공통 스타일
//           titleFont: { size: 18 },
//           bodyFont: { size: 17 },
//           padding: 12,
//           borderWidth: 1,

//           // 배경 / 테두리 색을 term-tooltip 과 맞춤
//           // 다크모드일 때마다 실시간 재계산
//           backgroundColor: () => (isDarkMode() ? "#1f2937" : "#0f172a"),
//           borderColor: () => (isDarkMode() ? "#1f2937" : "#0f172a"),
//           titleColor: "#f9fafb",
//           bodyColor: "#f9fafb",

//           callbacks: {
//             label: (ctx) => {
//               const idx = ctx.dataIndex;
//               const lang = getLang();
//               const name =
//                 lang === "ko" ? companyNamesKo[idx] : companyNamesEn[idx];
//               const value = weights[idx];
//               return `${name}  ${value}%`;
//             },
//           },
//         },
//       },
//     },
//   });

//   function updateDonutBorderColor() {
//     if (!weightsChart) return;
//     const color = isDarkMode() ? "#0f172a" : "#ffffff";
//     weightsChart.data.datasets[0].borderColor = color;
//     weightsChart.update();
//   }

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
//       3) Chatbot + Proactive Suggestions
//   ======================================================= */
//   const chatToggleBtn = document.getElementById("chatToggleBtn");
//   const chatWidget = document.getElementById("chatWidget");
//   const chatCloseBtn = document.getElementById("chatCloseBtn");
//   const chatForm = document.getElementById("chatForm");
//   const chatInput = document.getElementById("chatInput");
//   const chatMessages = document.getElementById("chatMessages");
//   const chatSuggestions = document.getElementById("chatSuggestions");

//   let chatOpenedOnce = false;

//   const chatGreeting = {
//     ko: "안녕하세요! 투자·시장 관련 질문을 도와드리는 챗봇입니다. 아래 추천 질문을 눌러보세요!",
//     en: "Hi! I’m your assistant for questions about your portfolio and the market. Try the suggested questions below!",
//   };

//   const defaultSuggestionsByLang = {
//     ko: [
//       "오늘 S&P 500 시장 분위기 요약해 줘",
//       "내 포트폴리오 리스크를 줄이는 방법 알려줘",
//       "금리 상승이 주식시장에 미치는 영향 설명해 줘",
//       "VIX 지수가 높다는 건 어떤 의미야?",
//       "장기 투자 vs 단기 투자 차이 알려줘",
//     ],
//     en: [
//       "Summarize today’s S&P 500 market mood",
//       "How can I reduce risk in my portfolio?",
//       "Explain how rising interest rates affect the stock market",
//       "What does a high VIX index mean?",
//       "Explain the difference between long-term and short-term investing",
//     ],
//   };

//   function resetChatForLanguage(lang) {
//     chatMessages.innerHTML = "";
//     chatSuggestions.innerHTML = "";
//     chatOpenedOnce = false;

//     if (chatWidget.style.display === "flex") {
//       const greeting = chatGreeting[lang] || chatGreeting["ko"];
//       const defaults =
//         defaultSuggestionsByLang[lang] || defaultSuggestionsByLang["ko"];

//       appendMessage(greeting, false);
//       renderSuggestions(defaults);
//       chatOpenedOnce = true;
//     }
//   }

//   function nextSuggestionsFromUserMessage(msg) {
//     const t = msg.toLowerCase();
//     const lang = getLang();

//     if (t.includes("gold") || t.includes("금")) {
//       return lang === "ko"
//         ? [
//             "금 가격이 오를 때 같이 움직이는 자산이 뭐야?",
//             "금과 주식의 상관관계 설명해 줘",
//             "인플레이션과 금 가격 관계 알려줘",
//           ]
//         : [
//             "Which assets usually move with gold prices?",
//             "Explain the relationship between gold and stocks",
//             "How are inflation and gold prices related?",
//           ];
//     }

//     if (t.includes("vix") || t.includes("변동성")) {
//       return lang === "ko"
//         ? [
//             "VIX가 높을 때 어떤 전략을 쓰는 게 좋아?",
//             "VIX와 S&P 500의 관계를 그래프로 설명해줘",
//             "변동성이 심할 때 분산투자 전략 추천해줘",
//           ]
//         : [
//             "What strategies are useful when VIX is high?",
//             "Explain the relationship between VIX and the S&P 500",
//             "Recommend diversification strategies when volatility is high",
//           ];
//     }

//     return lang === "ko"
//       ? [
//           "내가 너무 리스크를 많이 지고 있는지 체크해 줄 수 있어?",
//           "ETF 위주로 안정적인 포트폴리오 만들려면 어떻게 해야 해?",
//           "현금 비중은 어느 정도가 좋아?",
//         ]
//       : [
//           "Can you check if I’m taking too much risk?",
//           "How can I build a stable ETF-based portfolio?",
//           "What is a reasonable cash allocation?",
//         ];
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

//     const lang = getLang();
//     const loadingText =
//       lang === "ko" ? "답변을 불러오는 중입니다..." : "Loading answer...";

//     appendMessage(loadingText, false);
//     const loadingMsg = chatMessages.lastChild;

//     try {
//       const resp = await fetch("/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: trimmed, lang }),
//       });

//       const data = await resp.json();
//       loadingMsg.remove();

//       const failText =
//         lang === "ko"
//           ? "응답을 가져오지 못했습니다."
//           : "Failed to get a response.";

//       appendMessage(data.reply ?? failText, false);
//       renderSuggestions(nextSuggestionsFromUserMessage(trimmed));
//     } catch (err) {
//       console.error(err);
//       loadingMsg.remove();

//       const errorText =
//         lang === "ko"
//           ? "네트워크 오류가 발생했습니다."
//           : "A network error occurred.";

//       appendMessage(errorText, false);
//     }
//   }

//   chatToggleBtn.addEventListener("click", () => {
//     const isOpen = chatWidget.style.display === "flex";
//     chatWidget.style.display = isOpen ? "none" : "flex";

//     if (!isOpen && !chatOpenedOnce) {
//       chatOpenedOnce = true;

//       const lang = getLang();
//       const greeting = chatGreeting[lang] || chatGreeting["ko"];
//       const defaults =
//         defaultSuggestionsByLang[lang] || defaultSuggestionsByLang["ko"];

//       appendMessage(greeting, false);
//       renderSuggestions(defaults);
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
//       4) Language & Theme Toggle
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

//     applyTooltips(lang);

//     document.documentElement.lang = lang === "ko" ? "ko" : "en";
//     langLabel.textContent = lang === "ko" ? "한국어" : "English";
//     localStorage.setItem("lang", lang);
//   }

//   function applyTheme(theme) {
//     const dark = theme === "dark";
//     document.body.classList.toggle("dark-mode", dark);

//     if (dark) {
//       themeIcon.innerHTML = `<img src="달.png" alt="moon" class="theme-img" />`;
//       themeLabel.textContent = "다크";
//     } else {
//       themeIcon.innerHTML = `<img src="해.png" alt="sun" class="theme-img" />`;
//       themeLabel.textContent = "라이트";
//     }

//     localStorage.setItem("theme", theme);
//     updateDonutBorderColor();
//   }

//   langToggleBtn.addEventListener("click", () => {
//     currentLang = currentLang === "ko" ? "en" : "ko";
//     applyLanguage(currentLang);
//     resetChatForLanguage(currentLang);
//     redrawMainChart();
//   });

//   themeToggleBtn.addEventListener("click", () => {
//     currentTheme = currentTheme === "light" ? "dark" : "light";
//     applyTheme(currentTheme);
//     redrawMainChart();
//   });

//   // 초기 적용
//   applyLanguage(currentLang);
//   applyTheme(currentTheme);
//   redrawMainChart();
// });


// DOM이 모두 준비된 후 실행
window.addEventListener("DOMContentLoaded", () => {
  /* =======================================================
      0) 다국어 사전 + 언어 가져오기
  ======================================================= */

  const i18n = {
    en: {
      brandTitle: "Jootopia",
      currencyTitle: "USD/KRW",
      spTitle: "S&P 500 Chart",
      spSubtitle: "SPY ETF line chart (with prediction)",
      weightsTitle: "Company Weights",
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
      spyName: "SPDR S&P 500 ETF Trust",
      chatSend: "Send",

      spDesc:
        "S&P 500 consists of 500 major U.S. companies and represents the overall U.S. stock market trend.",
      weightsDesc:
        "Company weights represent the proportion each company holds within the S&P 500.",
      marketDesc:
        "Market indicators such as gold futures, the VIX, and short-term Treasury ETFs reflect overall market risk and investor sentiment.",
      goldDesc:
        "Gold futures represent agreements to trade gold at a predetermined price in the future.",
      vixDesc:
        "VIX Index shows expected volatility of S&P 500 over the next 30 days.",
      treasuryDesc:
        "Short-term Treasury ETFs invest in low-risk government bonds with short maturity.",
      marketChangeTip:
        "The first number is the actual change, and the number in parentheses is the percentage change.",

    },
    ko: {
      brandTitle: "주토피아",
      currencyTitle: "달러 환율",
      spTitle: "S&P 500 차트",
      spSubtitle: "SPY ETF 수익률 및 예측 차트",
      weightsTitle: "기업 비중",
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
      spyName: "SPDR S&P 500 ETF 신뢰",
      chatSend: "보내기",

      spDesc:
        "S&P 500: 미국 증시에 상장된 대표 500개 대형 기업으로 구성된 지수입니다.",
      weightsDesc:
        "기업 비중은 S&P 500에 각 기업이 차지하는 비율입니다.",
      marketDesc:
        "시장 지표는 금 선물, 공포 지수(VIX), 단기국채 등으로 시장의 위험도와 투자 심리를 보여줍니다.",
      goldDesc:
        "금 선물은 미래의 금 가격을 미리 정해두고 거래하는 파생상품입니다.",
      vixDesc:
        "VIX 지수는 앞으로 30일간 S&P 500의 변동성에 대한 시장 기대치를 보여줍니다.",
      treasuryDesc:
        "단기 국채 ETF는 만기가 짧은 국채에 투자하는 비교적 안전한 자산입니다.",
      marketChangeTip:
        "앞 숫자는 실제 증가·감소 금액, 괄호 안 숫자는 증감률(%)입니다.",

    },
  };

  function applyTooltips(lang) {
    const dict = i18n[lang] || i18n["ko"];

    document.querySelectorAll("[data-tooltip-key]").forEach((el) => {
      const key = el.getAttribute("data-tooltip-key");
      const text = dict[key];
      if (text) {
        el.setAttribute("data-tooltip", text);
      }
    });
  }

  function getLang() {
    return localStorage.getItem("lang") || "ko";
  }

  function isDarkMode() {
    return document.body.classList.contains("dark-mode");
  }

  /* =======================================================
      1) S&P 500 차트
      - 1주: 캔들 차트 (전날 종가 = 오늘 시가)
      - 1개월 / 6개월 / 1년: 종가 기준 라인 차트 (실제선 + 예측선)
  ======================================================= */

  const allDates = [
    "2025-01-02",
    "2025-01-03",
    "2025-01-06",
    "2025-01-07",
    "2025-01-08",
    "2025-01-09",
    "2025-01-10",
    "2025-01-13",
    "2025-01-14",
    "2025-01-15",
  ];
  const allCloses = [420, 421, 419, 422, 425, 430, 432, 431, 435, 437];

  function buildWeeklyOhlc(dates, closes) {
    if (closes.length < 6) {
      console.error(
        "1주 캔들을 만들려면 최소 6개(이전 종가 포함)가 필요합니다."
      );
      return [];
    }

    const last5Dates = dates.slice(-5);
    const last5Closes = closes.slice(-5);
    const prevClose = closes[closes.length - 6]; // 첫날 시가

    return last5Dates.map((dateStr, i) => {
      const dt = luxon.DateTime.fromISO(dateStr);
      const x = dt.toMillis();

      const open = i === 0 ? prevClose : last5Closes[i - 1];
      const close = last5Closes[i];

      const bodyHigh = Math.max(open, close);
      const bodyLow = Math.min(open, close);

      const wickSize = 1.5;
      const high = bodyHigh + wickSize;
      const low = bodyLow - wickSize;

      return { x, o: open, h: high, l: low, c: close };
    });
  }

  const lineDataByRange = {
    "1M": {
      labelsEn: ["W1", "W2", "W3", "W4"],
      labelsKo: ["1주차", "2주차", "3주차", "4주차"],
      actual: [420, 425, 430, 433],
      predicted: [421, 426, 431, 435],
    },
    "6M": {
      labelsEn: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
      labelsKo: ["6월", "7월", "8월", "9월", "10월", "11월"],
      actual: [422, 425, 423, 427, 429, 433],
      predicted: [423, 426, 424, 428, 431, 436],
    },
    "1Y": {
      labelsEn: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
      ],
      labelsKo: [
        "1월",
        "2월",
        "3월",
        "4월",
        "5월",
        "6월",
        "7월",
        "8월",
        "9월",
        "10월",
        "11월",
      ],
      actual: [406, 411, 415, 414, 419, 422, 425, 423, 427, 429, 433],
      predicted: [407, 413, 417, 416, 421, 424, 428, 426, 430, 432, 436],
    },
  };

  const ctxLine = document.getElementById("spyLineChart").getContext("2d");
  let spyChart = null;
  const defaultRange = "1Y";

  // 🔴 커스텀 레전드 컨테이너
  const lineLegendContainer = document.getElementById("lineLegend");

  // 🔴 커스텀 레전드 렌더 함수 (Actual 파란 원 / Predicted 빨간 점선 원)
  function renderLineLegend() {
    if (!lineLegendContainer) return;

    const lang = getLang();
    const dict = i18n[lang] || i18n["ko"];

    lineLegendContainer.innerHTML = "";

    const items = [
      { key: "chartActual", cls: "actual" },
      { key: "chartPredicted", cls: "predicted" },
    ];

    items.forEach((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "line-legend-item";

      const circle = document.createElement("div");
      circle.className = "line-legend-circle " + item.cls;

      const label = document.createElement("span");
      label.textContent = dict[item.key];

      wrapper.appendChild(circle);
      wrapper.appendChild(label);
      lineLegendContainer.appendChild(wrapper);
    });
  }

  // 1주 캔들 전용 레전드 : [회색 캡슐] [1주 캔들] [빨간 원] [예측값]
  function renderWeekLegend() {
    if (!lineLegendContainer) return;

    const lang = getLang();
    const dict = i18n[lang] || i18n["ko"];

    // 기존 내용 초기화
    lineLegendContainer.innerHTML = "";

    // ① 회색 캡슐
    const pill = document.createElement("div");
    pill.className = "week-pill";

    // ② "1주 캔들" / "1W Candle"
    const labelCandle = document.createElement("span");
    labelCandle.className = "week-label";
    labelCandle.textContent = dict.weeklyCandle;

    // ③ 빨간 동그라미 아이콘 (예측값 표시)
    const circle = document.createElement("div");
    circle.className = "line-legend-circle predicted week-pred-icon";

    // ④ "예측값" / "Predicted"
    const labelPred = document.createElement("span");
    labelPred.className = "week-label";
    labelPred.textContent = dict.chartPredicted;

    // 👉 한 줄에 순서대로 추가
    lineLegendContainer.appendChild(pill);
    lineLegendContainer.appendChild(labelCandle);
    lineLegendContainer.appendChild(circle);
    lineLegendContainer.appendChild(labelPred);
  }


  function destroyExistingChart() {
    if (spyChart) {
      spyChart.destroy();
      spyChart = null;
    }
  }

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
            label: dict.weeklyCandle,
            data: weekOhlc,
          },
        ],
      },
      options: {
        scales: {
          x: {
            type: "time",
            time: { unit: "day" },
            distribution: "series",
            ticks: {
              source: "data",
              autoSkip: false,
              color: isDarkMode() ? "#e5e7eb" : "#4b5563",
              callback: (value, index, ticks) => {
                const ts = ticks[index].value;
                const dt = luxon.DateTime.fromMillis(ts);
                return dt.toFormat("M/d");
              },
            },
            grid: {
              display: true,
              color: isDarkMode()
                ? "rgba(148,163,184,0.25)"
                : "rgba(148,163,184,0.35)",
            },
          },
          y: {
            ticks: {
              color: isDarkMode() ? "#e5e7eb" : "#4b5563",
              callback: (v) => "$" + v,
            },
            grid: {
              color: isDarkMode()
                ? "rgba(30,64,175,0.35)"
                : "rgba(148,163,184,0.35)",
            },
          },
        },
        plugins: {
          legend: {
            display: false, // 1주 캔들에서는 Chart.js 레전드 숨김
          },
          tooltip: {
            displayColors: false,
            callbacks: {
              title: (tooltipItems) => {
                const ts = tooltipItems[0].parsed.x;
                const dt = luxon.DateTime.fromMillis(ts);

                const lang = getLang();
                return lang === "ko"
                  ? dt.toFormat("yyyy년 M월 d일")
                  : dt.toFormat("MMM d, yyyy");
              },
              label: (ctx) => {
                const { o, h, l, c } = ctx.raw;
                const lang = getLang();

                if (lang === "ko") {
                  return [`시가: ${o}`, `고가: ${h}`, `저가: ${l}`, `종가: ${c}`];
                } else {
                  return [
                    `Open: ${o}`,
                    `High: ${h}`,
                    `Low: ${l}`,
                    `Close: ${c}`,
                  ];
                }
              },
            },
          },
        },
      },
    });

    // 1주 캔들일 때는 커스텀 레전드를 1주 전용으로 렌더
    renderWeekLegend();
  }

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
        labels,
        datasets: [
          {
            label: dict.chartActual,
            data: data.actual,
            borderColor: "#3b82f6",
            backgroundColor: "transparent",
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 10,
            tension: 0.35,
          },
          {
            label: dict.chartPredicted,
            data: data.predicted,
            borderColor: "#ef4444",
            borderDash: [6, 4],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0,
            pointHitRadius: 10,
            tension: 0.35,
          },
        ],
      },
      options: {
        interaction: { mode: "index", intersect: false },
        plugins: {
          legend: {
            display: false, // Chart.js 기본 레전드는 숨김
          },
          tooltip: {
            displayColors: false,
            callbacks: {
              label: (ctx) => {
                const label = ctx.dataset.label || "";
                const value = ctx.parsed.y;
                return `${label}: $${value}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: isDarkMode() ? "#e5e7eb" : "#4b5563",
            },
            grid: {
              color: isDarkMode()
                ? "rgba(148,163,184,0.25)"
                : "rgba(148,163,184,0.35)",
            },
          },
          y: {
            ticks: {
              color: isDarkMode() ? "#e5e7eb" : "#4b5563",
              callback: (v) => "$" + v,
            },
            grid: {
              color: isDarkMode()
                ? "rgba(30,64,175,0.35)"
                : "rgba(148,163,184,0.35)",
            },
          },
        },
      },
    });

    // 라인 차트일 때 커스텀 레전드 갱신
    renderLineLegend();
  }

  // 기간 버튼 & 차트 리드로우 공통 함수
  const rangeButtons = document.querySelectorAll(".time-toggle button");

  function setActiveButton(targetRange) {
    rangeButtons.forEach((btn) => {
      const r = btn.getAttribute("data-range");
      btn.classList.toggle("active", r === targetRange);
    });
  }

  function redrawMainChart() {
    const activeBtn =
      document.querySelector(".time-toggle button.active") || rangeButtons[0];
    const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

    if (activeRange === "1W") {
      createWeekCandlestick();
    } else {
      createLineChart(activeRange);
    }
  }

  rangeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const rangeKey = btn.getAttribute("data-range");
      setActiveButton(rangeKey);
      redrawMainChart();
    });
  });

  /* =======================================================
      2) Donut Chart (Company Weights)
  ======================================================= */

  let weightsChart = null;
  const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

  const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];
  const companyNamesKo = ["애플", "마이크로소프트", "엔비디아", "아마존", "구글"];
  const companyNamesEn = ["Apple", "Microsoft", "NVIDIA", "Amazon", "Google"];
  const weights = [7.1, 6.5, 6.2, 3.8, 2.1];

  const colors = ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE"];

  weightsChart = new Chart(ctxDonut, {
    type: "doughnut",
    data: {
      labels: companies,
      datasets: [
        {
          data: weights,
          backgroundColor: colors,
          borderWidth: 1.5,
          borderColor: isDarkMode() ? "#0f172a" : "#ffffff",
          spacing: 6,
          hoverOffset: 10,
          borderRadius: 8,
        },
      ],
    },
    options: {
      cutout: "68%",
      rotation: -90,
      responsive: true,
      radius: "90%",
      plugins: {
        legend: { display: false },
        tooltip: {
          titleFont: { size: 18 },
          bodyFont: { size: 17 },
          padding: 12,
          borderWidth: 1,
          backgroundColor: () => (isDarkMode() ? "#1f2937" : "#0f172a"),
          borderColor: () => (isDarkMode() ? "#1f2937" : "#0f172a"),
          titleColor: "#f9fafb",
          bodyColor: "#f9fafb",

          callbacks: {
            label: (ctx) => {
              const idx = ctx.dataIndex;
              const lang = getLang();
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

  function updateDonutBorderColor() {
    if (!weightsChart) return;
    const color = isDarkMode() ? "#0f172a" : "#ffffff";
    weightsChart.data.datasets[0].borderColor = color;
    weightsChart.update();
  }

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

  const chatGreeting = {
    ko: "안녕하세요! 투자·시장 관련 질문을 도와드리는 챗봇입니다. 아래 추천 질문을 눌러보세요!",
    en: "Hi! I’m your assistant for questions about your portfolio and the market. Try the suggested questions below!",
  };

  const defaultSuggestionsByLang = {
    ko: [
      "오늘 S&P 500 시장 분위기 요약해 줘",
      "내 포트폴리오 리스크를 줄이는 방법 알려줘",
      "금리 상승이 주식시장에 미치는 영향 설명해 줘",
      "VIX 지수가 높다는 건 어떤 의미야?",
      "장기 투자 vs 단기 투자 차이 알려줘",
    ],
    en: [
      "Summarize today’s S&P 500 market mood",
      "How can I reduce risk in my portfolio?",
      "Explain how rising interest rates affect the stock market",
      "What does a high VIX index mean?",
      "Explain the difference between long-term and short-term investing",
    ],
  };

  function resetChatForLanguage(lang) {
    chatMessages.innerHTML = "";
    chatSuggestions.innerHTML = "";
    chatOpenedOnce = false;

    if (chatWidget.style.display === "flex") {
      const greeting = chatGreeting[lang] || chatGreeting["ko"];
      const defaults =
        defaultSuggestionsByLang[lang] || defaultSuggestionsByLang["ko"];

      appendMessage(greeting, false);
      renderSuggestions(defaults);
      chatOpenedOnce = true;
    }
  }

  function nextSuggestionsFromUserMessage(msg) {
    const t = msg.toLowerCase();
    const lang = getLang();

    if (t.includes("gold") || t.includes("금")) {
      return lang === "ko"
        ? [
            "금 가격이 오를 때 같이 움직이는 자산이 뭐야?",
            "금과 주식의 상관관계 설명해 줘",
            "인플레이션과 금 가격 관계 알려줘",
          ]
        : [
            "Which assets usually move with gold prices?",
            "Explain the relationship between gold and stocks",
            "How are inflation and gold prices related?",
          ];
    }

    if (t.includes("vix") || t.includes("변동성")) {
      return lang === "ko"
        ? [
            "VIX가 높을 때 어떤 전략을 쓰는 게 좋아?",
            "VIX와 S&P 500의 관계를 그래프로 설명해줘",
            "변동성이 심할 때 분산투자 전략 추천해줘",
          ]
        : [
            "What strategies are useful when VIX is high?",
            "Explain the relationship between VIX and the S&P 500",
            "Recommend diversification strategies when volatility is high",
          ];
    }

    return lang === "ko"
      ? [
          "내가 너무 리스크를 많이 지고 있는지 체크해 줄 수 있어?",
          "ETF 위주로 안정적인 포트폴리오 만들려면 어떻게 해야 해?",
          "현금 비중은 어느 정도가 좋아?",
        ]
      : [
          "Can you check if I’m taking too much risk?",
          "How can I build a stable ETF-based portfolio?",
          "What is a reasonable cash allocation?",
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

    const lang = getLang();
    const loadingText =
      lang === "ko" ? "답변을 불러오는 중입니다..." : "Loading answer...";

    appendMessage(loadingText, false);
    const loadingMsg = chatMessages.lastChild;

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, lang }),
      });

      const data = await resp.json();
      loadingMsg.remove();

      const failText =
        lang === "ko"
          ? "응답을 가져오지 못했습니다."
          : "Failed to get a response.";

      appendMessage(data.reply ?? failText, false);
      renderSuggestions(nextSuggestionsFromUserMessage(trimmed));
    } catch (err) {
      console.error(err);
      loadingMsg.remove();

      const errorText =
        lang === "ko"
          ? "네트워크 오류가 발생했습니다."
          : "A network error occurred.";

      appendMessage(errorText, false);
    }
  }

  chatToggleBtn.addEventListener("click", () => {
    const isOpen = chatWidget.style.display === "flex";
    chatWidget.style.display = isOpen ? "none" : "flex";

    if (!isOpen && !chatOpenedOnce) {
      chatOpenedOnce = true;

      const lang = getLang();
      const greeting = chatGreeting[lang] || chatGreeting["ko"];
      const defaults =
        defaultSuggestionsByLang[lang] || defaultSuggestionsByLang["ko"];

      appendMessage(greeting, false);
      renderSuggestions(defaults);
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

    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key]) el.textContent = dict[key];
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const key = el.getAttribute("data-i18n-placeholder");
      if (dict[key]) el.placeholder = dict[key];
    });

    applyTooltips(lang);

    document.documentElement.lang = lang === "ko" ? "ko" : "en";
    langLabel.textContent = lang === "ko" ? "한국어" : "English";
    localStorage.setItem("lang", lang);

    // 현재 활성 구간에 맞게 레전드 텍스트 다시 렌더
    const activeBtn =
      document.querySelector(".time-toggle button.active") || rangeButtons[0];
    const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

    if (activeRange === "1W") {
      renderWeekLegend();
    } else {
      renderLineLegend();
    }
  }

  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);

    if (dark) {
      themeIcon.innerHTML = `<img src="달.png" alt="moon" class="theme-img" />`;
      themeLabel.textContent = "다크";
    } else {
      themeIcon.innerHTML = `<img src="해.png" alt="sun" class="theme-img" />`;
      themeLabel.textContent = "라이트";
    }

    localStorage.setItem("theme", theme);
    updateDonutBorderColor();
  }

  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "ko" ? "en" : "ko";
    applyLanguage(currentLang);
    resetChatForLanguage(currentLang);
    redrawMainChart();
  });

  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(currentTheme);
    redrawMainChart();
  });

  // 초기 적용
  applyLanguage(currentLang);
  applyTheme(currentTheme);
  redrawMainChart();
});
