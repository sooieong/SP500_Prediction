// // ---------------- S&P 500 Line Chart ----------------
// const ctxLine = document.getElementById("spyLineChart").getContext("2d");

// const months = [
//   "Jan",
//   "Feb",
//   "Mar",
//   "Apr",
//   "May",
//   "Jun",
//   "Jul",
//   "Aug",
//   "Sep",
//   "Oct",
//   "Nov",
// ];
// const prices = [406, 411, 415, 414, 419, 422, 425, 423, 427, 429, 433];

// const gradient = ctxLine.createLinearGradient(0, 0, 0, 260);
// gradient.addColorStop(0, "rgba(34,197,94,0.28)");
// gradient.addColorStop(1, "rgba(34,197,94,0.0)");

// new Chart(ctxLine, {
//   type: "line",
//   data: {
//     labels: months,
//     datasets: [
//       {
//         label: "SPY",
//         data: prices,
//         borderColor: "#22c55e",
//         backgroundColor: gradient,
//         fill: true,
//         pointRadius: 4,
//         pointBackgroundColor: "#22c55e",
//         tension: 0.35,
//       },
//     ],
//   },
//   options: {
//     plugins: { legend: { display: false } },
//     scales: {
//       y: {
//         ticks: {
//           callback: (val) => "$" + val,
//         },
//       },
//     },
//   },
// });

// // ---------------- Donut Chart ----------------
// const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

// const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];
// const weights = [7.1, 6.5, 6.2, 3.8, 2.1];
// const colors = ["#3b82f6", "#6366f1", "#22c55e", "#f97316", "#ef4444"];

// new Chart(ctxDonut, {
//   type: "doughnut",
//   data: {
//     labels: companies,
//     datasets: [
//       {
//         data: weights,
//         backgroundColor: colors,
//         borderWidth: 0,
//       },
//     ],
//   },
//   options: {
//     cutout: "65%",
//     plugins: { legend: { display: false } },
//   },
// });

// // 범례 생성
// const legendContainer = document.getElementById("weightsLegend");
// companies.forEach((c, i) => {
//   const item = document.createElement("div");
//   item.className = "legend-item";

//   const dot = document.createElement("div");
//   dot.className = "legend-dot";
//   dot.style.backgroundColor = colors[i];

//   const label = document.createElement("span");
//   label.innerText = `${c} ${weights[i]}%`;

//   item.appendChild(dot);
//   item.appendChild(label);
//   legendContainer.appendChild(item);
// });

// // ------- 기존 라인 차트 / 도넛 차트 코드는 그대로 -------

// // (위에 spyLineChart / weightsDonut 코드 그대로 두세요)

// // ===== Chatbot Logic =====
// const chatToggleBtn = document.getElementById("chatToggleBtn");
// const chatWidget = document.getElementById("chatWidget");
// const chatCloseBtn = document.getElementById("chatCloseBtn");
// const chatForm = document.getElementById("chatForm");
// const chatInput = document.getElementById("chatInput");
// const chatMessages = document.getElementById("chatMessages");
// const chatSuggestions = document.getElementById("chatSuggestions");

// // 최초 오픈 여부
// let chatOpenedOnce = false;

// // 기본 추천 질문 목록
// const defaultSuggestions = [
//   "오늘 S&P 500 시장 분위기 요약해 줘",
//   "내 포트폴리오 리스크를 줄이는 방법 알려줘",
//   "금리 상승이 주식시장에 미치는 영향 설명해 줘",
//   "VIX 지수가 높다는 건 어떤 의미야?",
//   "장기 투자 vs 단기 투자 차이 알려줘",
// ];

// // 답변 후에 제안해 줄 후속 질문 예시 (단순 규칙 기반)
// function nextSuggestionsFromUserMessage(msg) {
//   const text = msg.toLowerCase();

//   if (text.includes("gold") || text.includes("금") || text.includes("gc")) {
//     return [
//       "금 가격이 오를 때 같이 움직이는 자산이 뭐야?",
//       "금과 주식의 상관관계 설명해 줘",
//       "인플레이션과 금 가격 관계 알려줘",
//     ];
//   }

//   if (text.includes("vix") || text.includes("변동성")) {
//     return [
//       "VIX가 높을 때 어떤 전략을 쓰는 게 좋아?",
//       "VIX와 S&P 500의 관계를 그래프로 설명해줘",
//       "변동성이 심할 때 분산투자 전략 추천해줘",
//     ];
//   }

//   // 기본값
//   return [
//     "내가 너무 리스크를 많이 지고 있는지 체크해 줄 수 있어?",
//     "ETF 위주로 안정적인 포트폴리오를 만들고 싶은데 어떻게 해야 해?",
//     "현금 비중은 어느 정도 가져가는 게 좋아?",
//   ];
// }

// function appendMessage(text, isUser) {
//   const msg = document.createElement("div");
//   msg.className = "chat-message " + (isUser ? "user" : "bot");

//   const bubble = document.createElement("div");
//   bubble.className = "chat-bubble";
//   bubble.textContent = text;

//   msg.appendChild(bubble);
//   chatMessages.appendChild(msg);
//   chatMessages.scrollTop = chatMessages.scrollHeight;
// }

// // 실제로 메시지를 서버에 보내는 함수
// async function sendUserMessage(text) {
//   const trimmed = text.trim();
//   if (!trimmed) return;

//   appendMessage(trimmed, true);
//   clearSuggestions();
//   chatInput.value = "";

//   appendMessage("답변을 불러오는 중입니다...", false);
//   const loadingMsg = chatMessages.lastChild;

//   try {
//     const resp = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message: trimmed }),
//     });

//     if (!resp.ok) {
//       loadingMsg.remove();
//       appendMessage("서버 오류가 발생했습니다.", false);
//       return;
//     }

//     const data = await resp.json();
//     loadingMsg.remove();
//     appendMessage(data.reply ?? "응답을 가져오지 못했습니다.", false);

//     // 사용자가 한 질문을 기반으로 후속 추천 제안
//     const followUps = nextSuggestionsFromUserMessage(trimmed);
//     renderSuggestions(followUps);
//   } catch (err) {
//     console.error(err);
//     loadingMsg.remove();
//     appendMessage("네트워크 오류가 발생했습니다.", false);
//   }
// }

// // 토글 버튼 (💬) 클릭 시 위젯 열고, 첫 오픈이면 기본 추천 표시
// chatToggleBtn.addEventListener("click", () => {
//   const isVisible = chatWidget.style.display === "flex";
//   if (isVisible) {
//     chatWidget.style.display = "none";
//   } else {
//     chatWidget.style.display = "flex";
//     if (!chatOpenedOnce) {
//       chatOpenedOnce = true;
//       // 첫 오픈 시 선제안
//       appendMessage(
//         "안녕하세요! 투자·시장 관련 질문을 도와드리는 챗봇입니다. 아래 제안 중 하나를 눌러보거나 자유롭게 질문해 주세요.",
//         false
//       );
//       renderSuggestions(defaultSuggestions);
//     }
//   }
// });

// chatCloseBtn.addEventListener("click", () => {
//   chatWidget.style.display = "none";
// });

// // 폼 제출 → 유저 메시지 전송
// chatForm.addEventListener("submit", (e) => {
//   e.preventDefault();
//   const text = chatInput.value;
//   sendUserMessage(text);
// });

// // 처음 안내 메시지
// appendMessage(
//   "안녕하세요! 투자 대시보드 챗봇입니다. 궁금한 점을 물어보세요.",
//   false
// );

// chatToggleBtn.addEventListener("click", () => {
//   const isVisible = chatWidget.style.display === "flex";
//   chatWidget.style.display = isVisible ? "none" : "flex";
// });

// chatCloseBtn.addEventListener("click", () => {
//   chatWidget.style.display = "none";
// });

// chatForm.addEventListener("submit", async (e) => {
//   e.preventDefault();
//   const text = chatInput.value.trim();
//   if (!text) return;

//   appendMessage(text, true);
//   chatInput.value = "";

//   appendMessage("답변을 불러오는 중입니다...", false);
//   const loadingMsg = chatMessages.lastChild;

//   try {
//     const resp = await fetch("/api/chat", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ message: text }),
//     });

//     if (!resp.ok) {
//       loadingMsg.remove();
//       appendMessage("서버 오류가 발생했습니다.", false);
//       return;
//     }

//     const data = await resp.json();
//     loadingMsg.remove();
//     appendMessage(data.reply ?? "응답을 가져오지 못했습니다.", false);
//   } catch (err) {
//     console.error(err);
//     loadingMsg.remove();
//     appendMessage("네트워크 오류가 발생했습니다.", false);
//   }
// });

/* =======================================================
   1) S&P 500 Line Chart
======================================================= */
const ctxLine = document.getElementById("spyLineChart").getContext("2d");

const months = [
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
];
const prices = [406, 411, 415, 414, 419, 422, 425, 423, 427, 429, 433];

const gradient = ctxLine.createLinearGradient(0, 0, 0, 260);
gradient.addColorStop(0, "rgba(34,197,94,0.28)");
gradient.addColorStop(1, "rgba(34,197,94,0.0)");

new Chart(ctxLine, {
  type: "line",
  data: {
    labels: months,
    datasets: [
      {
        label: "SPY",
        data: prices,
        borderColor: "#22c55e",
        backgroundColor: gradient,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: "#22c55e",
        tension: 0.35,
      },
    ],
  },
  options: {
    plugins: { legend: { display: false } },
    scales: {
      y: { ticks: { callback: (v) => "$" + v } },
    },
  },
});

/* =======================================================
   2) Donut Chart
======================================================= */
const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

const companies = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL"];
const weights = [7.1, 6.5, 6.2, 3.8, 2.1];
const colors = ["#3b82f6", "#6366f1", "#22c55e", "#f97316", "#ef4444"];

new Chart(ctxDonut, {
  type: "doughnut",
  data: {
    labels: companies,
    datasets: [
      {
        data: weights,
        backgroundColor: colors,
        borderWidth: 0,
      },
    ],
  },
  options: {
    cutout: "65%",
    plugins: { legend: { display: false } },
  },
});

// Custom Legend
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

// 기본 추천 질문
const defaultSuggestions = [
  "오늘 S&P 500 시장 분위기 요약해 줘",
  "내 포트폴리오 리스크를 줄이는 방법 알려줘",
  "금리 상승이 주식시장에 미치는 영향 설명해 줘",
  "VIX 지수가 높다는 건 어떤 의미야?",
  "장기 투자 vs 단기 투자 차이 알려줘",
];

// 후속 추천
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

// 메시지 출력
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

// ------------------------
// 추천 제안 UI
// ------------------------
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

// ------------------------
// 메시지 전송
// ------------------------
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

    // 다음 제안
    renderSuggestions(nextSuggestionsFromUserMessage(trimmed));
  } catch (err) {
    console.error(err);
    loadingMsg.remove();
    appendMessage("네트워크 오류가 발생했습니다.", false);
  }
}

// ------------------------
// 이벤트 바인딩
// ------------------------
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
