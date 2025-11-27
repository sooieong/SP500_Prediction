// DOM이 모두 준비된 후 실행
window.addEventListener("DOMContentLoaded", () => {
  /* =======================================================
      0) 다국어 사전 + 언어 가져오기
  ======================================================= */

  const i18n = {
    en: {
      brandTitle: "Jutopia",
      currencyTitle: "USD/KRW",
      spTitle: "S&P 500 Chart",
      spSubtitle: "SPY ETF line chart (with prediction)",
      weightsTitle: "Company Weights",
      marketTitle: "Market Indicators",
      time1w: "1W",
      time1m: "1M",
      time6m: "6M",
      time1y: "1Y",
      marketGold: "2. Gold Futures Volatility",
      marketVix: "1. VIX Index Volatility",
      marketTreasury: "3. Treasury ETF Volatility",
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
        "Gold futures volatility is calculated as the difference between the day’s high and low prices (High − Low), representing the daily price fluctuation of gold futures.",
      vixDesc:
        "The VIX volatility index is the most influential indicator in our prediction model and typically moves inversely to SPY, meaning that a rise in VIX is interpreted as a signal of increased downside risk for SPY.",
      treasuryDesc:
        "Short-term Treasury volatility is calculated as the difference between the day’s high and low prices (High − Low), reflecting shifts in short-term interest rates and demand for safe-haven assets.",
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
      marketGold: "2. 금선물 변동성",
      marketVix: "1. 공포지수 변동성",
      marketTreasury: "3. 단기국채 변동성",
      chatTitle: "포트폴리오 챗봇",
      chatPlaceholder: "포트폴리오나 시장에 대해 물어보세요...",
      chartActual: "실제값",
      chartPredicted: "예측값",
      weeklyCandle: "1주 캔들",
      spyName: "SPDR S&P 500 ETF 신뢰",
      chatSend: "보내기",

      spDesc:
        "S&P 500: 미국 증시에 상장된 대표 500개 대형 기업으로 구성된 지수입니다.",
      weightsDesc: "기업 비중은 S&P 500에 각 기업이 차지하는 비율입니다.",
      marketDesc:
        "시장 지표는 금 선물, 공포 지수(VIX), 단기국채 등으로 시장의 위험도와 투자 심리를 보여줍니다.",
      goldDesc:
        "금 선물 변동성은 해당 일자에서 금 선물 가격의 고가와 저가 차이(High − Low)로 계산되며, 금 가격의 하루 변동 폭을 나타내는 지표입니다.",
      vixDesc:
        "VIX 변동성 지수는 설계된 예측 모델에서 가장 영향력이 큰 지표이며, 일반적으로 SPY와 반대로 움직여 VIX 상승은 SPY 하락 위험 신호로 해석됩니다.",
      treasuryDesc:
        "단기 국채 변동성은 해당 일자의 고가와 저가 차이(High − Low)로 계산되며, 단기 금리 변화나 안전자산 수요 변화를 반영하는 지표입니다.",
      marketChangeTip:
        "앞 숫자는 실제 증가·감소 지수, 괄호 안 숫자는 증감률(%)입니다.",
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

  const ctxLine = document.getElementById("spyLineChart").getContext("2d");
  let spyChart = null;
  const defaultRange = "1W";

  // 커스텀 레전드 컨테이너
  const lineLegendContainer = document.getElementById("lineLegend");

  // 커스텀 레전드 렌더 함수 (Actual 파란 원 / Predicted 빨간 점선 원)
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

  // 라인 차트용 그라디언트
  const gradient = ctxLine.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, "rgba(34,197,94,0.28)");
  gradient.addColorStop(1, "rgba(34,197,94,0.0)");

  function destroyExistingChart() {
    if (spyChart) {
      spyChart.destroy();
      spyChart = null;
    }
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // // 1주 캔들: 백엔드 API에서 데이터 받아서 그리기
  // async function createWeekCandlestick() {
  //   try {
  //     destroyExistingChart();

  //     const res = await fetch("http://localhost:8000/chart-1w");
  //     if (!res.ok) {
  //       console.error("1W API 에러:", res.status, await res.text());
  //       return;
  //     }

  //     const data = await res.json();
  //     const candles = data.candles || [];
  //     const predictedLine = data.predicted_line || [];
  //     // const predictedLimited = predictedLine.slice(0, 3);

  //     if (!candles.length) {
  //       console.warn("1W 캔들 데이터가 비어 있습니다.");
  //       return;
  //     }

  //     // 1) 캔들 데이터 → Chart.js Financial 형식
  //     const weekOhlc = candles.map((c) => ({
  //       x: new Date(c.time).getTime(), // time → 타임스탬프
  //       o: c.open,
  //       h: c.high,
  //       l: c.low,
  //       c: c.close,
  //     }));

  //     // 2) 예측선 데이터 → line 형식
  //     const predLineChartData = predictedLine.map((p) => ({
  //       x: new Date(p.time).getTime(),
  //       y: p.value,
  //     }));

  //     // const predLineChartData = predictedLimited.map((p) => ({
  //     //   x: new Date(p.time).getTime(),
  //     //   y: p.value,
  //     // }));

  //     const lastCandle = weekOhlc[weekOhlc.length - 1]; // 11/7 캔들
  //     const bridgedPredLine = [
  //       { x: lastCandle.x, y: lastCandle.c }, // 11/7 종가 점
  //       ...predLineChartData, // 11/10 이후 예측값들
  //     ];

  //     console.log("weekOhlc from API:", weekOhlc);
  //     console.log("predictedLine from API:", predLineChartData);
  //     console.log("bridgedPredLine:", bridgedPredLine);

  //     // 3) y축 스케일 계산 (캔들 + 예측선 모두 포함)
  //     const allPrices = [
  //       ...weekOhlc.flatMap((c) => [c.l, c.h]),
  //       ...predLineChartData.map((p) => p.y),
  //     ];
  //     const minPrice = Math.min(...allPrices);
  //     const maxPrice = Math.max(...allPrices);

  //     // 4) 차트 생성
  //     spyChart = new Chart(ctxLine, {
  //       type: "candlestick",
  //       data: {
  //         datasets: [
  //           {
  //             label: "1주 캔들",
  //             data: weekOhlc,
  //             parsing: false,
  //             color: {
  //               up: "#22c55e",
  //               down: "#ef4444",
  //               unchanged: "#9ca3af",
  //             },
  //             // 🔹 캔들 폭/간격 조절
  //             barPercentage: 0.7, // 카테고리 안에서 얼마나 차지할지
  //             categoryPercentage: 0.8, // 인접 캔들과 간격
  //           },
  //           {
  //             type: "line",
  //             label: "예측값",
  //             data: bridgedPredLine,
  //             parsing: false,
  //             borderColor: "#ef4444",
  //             borderWidth: 2,
  //             borderDash: [5, 5],
  //             pointRadius: 0,
  //             tension: 0.2, // 곡선 부드럽게
  //             yAxisID: "y",
  //           },
  //         ],
  //       },
  //       options: {
  //         responsive: true,
  //         plugins: {
  //           legend: {
  //             labels: {
  //               // 필요하면 라벨 폰트 키우기
  //               // font: { size: 12 },
  //             },
  //           },
  //         },
  //         scales: {
  //           x: {
  //             type: "time",
  //             time: {
  //               unit: "day",
  //               stepSize: 1, // 🔥 1일 단위로 강제
  //               tooltipFormat: "yyyy-MM-dd",
  //               displayFormats: { day: "MM/dd" },
  //             },
  //             distribution: "series",
  //             ticks: {
  //               source: "data", // 데이터 기준으로
  //               autoSkip: false, // 🔥 안 건너뛰고 다 표시
  //               maxRotation: 0,
  //               minRotation: 0,
  //             },
  //           },
  //           y: {
  //             min: minPrice * 0.995,
  //             max: maxPrice * 1.005,
  //             ticks: {
  //               // 🔥 반올림해서 깔끔하게
  //               callback: (v) => "$" + Math.round(v),
  //             },
  //           },
  //         },
  //       },
  //     });
  //   } catch (err) {
  //     console.error("1W 캔들 생성 중 오류:", err);
  //   }
  // }

  // 1주 캔들 + 전체 예측 라인 표시
  async function createWeekCandlestick() {
    try {
      destroyExistingChart();

      const res = await fetch("http://localhost:8000/chart-1w");
      if (!res.ok) {
        console.error("1W API 에러:", res.status, await res.text());
        return;
      }

      const data = await res.json();
      const candles = data.candles || [];
      const predictedLine = data.predicted_line || [];

      if (!candles.length) {
        console.warn("1W 캔들 데이터가 없습니다.");
        return;
      }

      // -------- 캔들 데이터 --------
      const weekOhlc = candles.map((c) => ({
        x: new Date(c.time).getTime(),
        o: c.open,
        h: c.high,
        l: c.low,
        c: c.close,
      }));

      // -------- 전체 예측 라인 (실제+미래 모두 포함) --------
      const predLineChartData = predictedLine.map((p) => ({
        x: new Date(p.time).getTime(),
        y: p.value,
      }));

      console.log("캔들 데이터:", weekOhlc);
      console.log("예측 라인 전체:", predLineChartData);

      // y축 스케일 계산
      const allPrices = [
        ...weekOhlc.flatMap((d) => [d.l, d.h]),
        ...predLineChartData.map((p) => p.y),
      ];
      const minPrice = Math.min(...allPrices);
      const maxPrice = Math.max(...allPrices);

      // -------- 차트 생성 --------
      spyChart = new Chart(ctxLine, {
        data: {
          datasets: [
            // 실제 캔들
            {
              type: "candlestick",
              label: "1주 캔들",
              data: weekOhlc,
              parsing: false,
              color: {
                up: "#22c55e",
                down: "#ef4444",
                unchanged: "#9ca3af",
              },
              barPercentage: 0.7,
              categoryPercentage: 0.8,
            },

            // 전체 예측 라인
            {
              type: "line",
              label: "예측값",
              data: predLineChartData,
              parsing: false,
              borderColor: "#ef4444",
              borderWidth: 2,
              borderDash: [5, 5],
              pointRadius: 0,
              tension: 0.25,
              yAxisID: "y",
            },
          ],
        },

        options: {
          responsive: true,
          plugins: {
            tooltip: {
              mode: "nearest",
              intersect: false,
            },
          },
          scales: {
            x: {
              type: "time",
              time: {
                unit: "day",
                tooltipFormat: "yyyy-MM-dd",
                displayFormats: { day: "MM/dd" },
              },
              ticks: {
                autoSkip: false,
                maxRotation: 0,
                minRotation: 0,
              },
            },
            y: {
              min: minPrice * 0.995,
              max: maxPrice * 1.005,
              ticks: {
                callback: (v) => "$" + Math.round(v),
              },
            },
          },
        },
      });
    } catch (err) {
      console.error("1W 캔들 생성 오류:", err);
    }
  }

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // // 1M / 6M / 1Y 라인차트
  // function createLineChart(rangeKey) {
  //   const data = lineDataByRange[rangeKey];
  //   if (!data) return;

  //   const lang = getLang();
  //   const labels = lang === "ko" ? data.labelsKo : data.labelsEn;

  //   destroyExistingChart();

  //   spyChart = new Chart(ctxLine, {
  //     type: "line",
  //     data: {
  //       labels: labels,
  //       datasets: [
  //         {
  //           label: "Actual",
  //           data: data.actual,
  //           borderColor: "#3b82f6",
  //           backgroundColor: gradient,
  //           fill: true,
  //           pointRadius: 3,
  //           pointBackgroundColor: "#3b82f6",
  //           tension: 0.35,
  //         },
  //         {
  //           label: "Predicted",
  //           data: data.predicted,
  //           borderColor: "#ef4444",
  //           borderDash: [6, 4],
  //           fill: false,
  //           pointRadius: 0,
  //           tension: 0.35,
  //         },
  //       ],
  //     },
  //     options: {
  //       plugins: {
  //         legend: {
  //           display: true,
  //           labels: {
  //             usePointStyle: true,
  //             boxWidth: 8,
  //           },
  //         },
  //       },
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

  // // 1M / 6M / 1Y 라인차트
  // async function createLineChart(rangeKey) {
  //   destroyExistingChart();

  //   try {
  //     const res = await fetch(
  //       `http://localhost:8000/chart-line?range=${rangeKey}`
  //     );
  //     if (!res.ok) {
  //       console.error("라인차트 API 에러:", res.status, await res.text());
  //       return;
  //     }
  //     const data = await res.json();

  //     const labels = data.labels;
  //     const actual = data.actual;
  //     const predicted = data.predicted;

  //     spyChart = new Chart(ctxLine, {
  //       type: "line",
  //       data: {
  //         labels,
  //         datasets: [
  //           {
  //             label: "Actual",
  //             data: actual,
  //             borderColor: "#3b82f6",
  //             backgroundColor: gradient,
  //             fill: true,
  //             pointRadius: 3,
  //             pointBackgroundColor: "#3b82f6",
  //             tension: 0.35,
  //             spanGaps: false, // 실제 구간만 그려지고 미래 구간은 끊김
  //           },
  //           {
  //             label: "Predicted",
  //             data: predicted,
  //             borderColor: "#ef4444",
  //             borderDash: [6, 4],
  //             fill: false,
  //             pointRadius: 0,
  //             tension: 0.35,
  //             spanGaps: true, // 앞의 null은 건너뛰고 미래 구간을 연결
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
  //   } catch (err) {
  //     console.error("라인차트 생성 중 오류:", err);
  //   }
  // }

  // 1M / 6M / 1Y 라인차트
  async function createLineChart(rangeKey) {
    destroyExistingChart();

    try {
      const res = await fetch(
        `http://localhost:8000/chart-line?range=${rangeKey}`
      );
      if (!res.ok) {
        console.error("라인차트 API 에러:", res.status, await res.text());
        return;
      }

      const data = await res.json();

      const labels = data.labels || [];
      const actual = data.actual || [];
      const predicted = data.predicted || [];

      console.log("labels:", labels);
      console.log("actual:", actual);
      console.log("predicted:", predicted);

      // undefined 같은 값이 있으면 null 로 통일 (Chart.js에서 gap 처리 가능하게)
      const actualClean = actual.map((v) => (v == null ? null : v));
      const predictedClean = predicted.map((v) => (v == null ? null : v));

      spyChart = new Chart(ctxLine, {
        type: "line",
        data: {
          labels, // x축 라벨: "2025-11-01" 이런 문자열 배열
          datasets: [
            {
              label: "Actual",
              data: actualClean, // [숫자, 숫자, null, ...]
              borderColor: "#3b82f6",
              backgroundColor: gradient,
              fill: true,
              pointRadius: 2,
              tension: 0.35,
              spanGaps: false, // null에서 끊기게
            },
            {
              label: "Predicted",
              data: predictedClean,
              borderColor: "#ef4444",
              borderDash: [6, 4],
              fill: false,
              pointRadius: 2,
              tension: 0.35,
              spanGaps: true, // null 건너뛰고 이어 그리기
            },
          ],
        },
        options: {
          plugins: {
            legend: {
              display: true,
              // labels: {
              //   usePointStyle: true,
              //   boxWidth: 8,
              // },
              labels: {
                usePointStyle: true, // 포인트 스타일 사용 (동그라미/사각형 통일)
                pointStyle: "rectRounded", // 🔹 둥근 사각형
                boxWidth: 14, // 네모 크기
                boxHeight: 8,
                padding: 20,
                color: "#374151",
                font: {
                  size: 13,
                  weight: 500,
                },
              },
            },
            tooltip: {
              mode: "nearest",
              intersect: false,
            },
          },
          // x축은 기본 category 스케일 사용 (time 어댑터 문제 싹 제거)
          scales: {
            x: {
              ticks: {
                maxRotation: 0,
                minRotation: 0,
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
    } catch (err) {
      console.error("라인차트 생성 중 오류:", err);
    }
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // 공개 외환환율 API 서비스
  async function fetchUsdKrw() {
    try {
      // 공개 외환환율 API 서비스
      const url = "https://api.manana.kr/exchange/rate/KRW/USD.json";
      const res = await fetch(url);

      if (!res.ok) throw new Error("API 오류");

      const data = await res.json();
      const rate = data[0].rate; // 환율
      const change = data[0].change; // 변동 폭
      const changePercent = data[0].change_percent; // 변동률

      // HTML 요소 업데이트
      const valueEl = document.getElementById("usdkrw-value");
      // const changeEl = document.getElementById("usdkrw-change");

      valueEl.textContent = `₩${rate.toLocaleString()}`;

      // ▲ ▼ 방향 설정
      // if (change > 0) {
      //   changeEl.textContent = `▲ +${change.toFixed(
      //     2
      //   )} (+${changePercent.toFixed(2)}%)`;
      //   changeEl.style.color = "#ef4444"; // 빨강
      // } else if (change < 0) {
      //   changeEl.textContent = `▼ ${change.toFixed(2)} (${changePercent.toFixed(
      //     2
      //   )}%)`;
      //   changeEl.style.color = "#22c55e"; // 초록
      // } else {
      //   changeEl.textContent = `- 0 (0%)`;
      //   changeEl.style.color = "#999";
      // }
    } catch (err) {
      console.error("달러환율 불러오기 실패:", err);
    }
  }

  // 최초 1회 실행
  fetchUsdKrw();

  // 이후 1분마다 자동 갱신
  setInterval(fetchUsdKrw, 60000);
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // 기간 버튼 & 차트 리드로우 공통 함수
  const rangeButtons = document.querySelectorAll(".time-toggle button");

  // function setActiveButton(targetRange) {
  //   rangeButtons.forEach((btn) => {
  //     const r = btn.getAttribute("data-range");
  //     btn.classList.toggle("active", r === targetRange);
  //   });
  // }

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

  // rangeButtons.forEach((btn) => {
  //   btn.addEventListener("click", () => {
  //     const rangeKey = btn.getAttribute("data-range");
  //     if (rangeKey === "1W") {
  //       createWeekCandlestick();
  //     } else {
  //       createLineChart(rangeKey);
  //     }
  //     setActiveButton(rangeKey);
  //   });
  // });

  // 수상함
  // rangeButtons.forEach((btn) => {
  //   btn.addEventListener("click", async () => {
  //     const rangeKey = btn.getAttribute("data-range");
  //     if (rangeKey === "1W") {
  //       await createWeekCandlestick(); // ← 여기만 async/await
  //     } else {
  //       createLineChart(rangeKey);
  //     }
  //     setActiveButton(rangeKey);
  //   });
  // });

  // 최초 로드: 1주 라인차트
  // createLineChart(defaultRange);
  createWeekCandlestick(defaultRange);
  setActiveButton(defaultRange);

  /* =======================================================
    2) Donut Chart (Company Weights)
  ======================================================= */
  let weightsChart = null;
  const ctxDonut = document.getElementById("weightsDonut").getContext("2d");

  const companies = ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL"];
  const companyNamesKo = [
    "애플",
    "마이크로소프트",
    "엔비디아",
    "아마존",
    "구글",
  ];
  const companyNamesEn = ["Apple", "Microsoft", "NVIDIA", "Amazon", "Google"];
  const weights = [8.01, 6.95, 6.44, 4.14, 2.83];
  const colors = ["#5470C6", "#91CC75", "#FAC858", "#EE6666", "#73C0DE"];
  // const donutBgColor = "#f9fafb";

  const sliceLabelPlugin = {
    id: "sliceLabelPlugin",
    afterDatasetsDraw(chart, args, pluginOptions) {
      const { ctx } = chart;
      const meta = chart.getDatasetMeta(0);
      if (!meta) return;

      ctx.save();
      ctx.font =
        "600 14px 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isDarkMode() ? "#f9fafb" : "#0f172a";

      meta.data.forEach((arc, index) => {
        const value = chart.data.datasets[0].data[index];
        if (value == null) return;

        const angle = (arc.startAngle + arc.endAngle) / 2; // 조각 중앙 각도

        // 반지름 중간값: (inner + outer) / 2
        const innerRadius = arc.innerRadius;
        const outerRadius = arc.outerRadius;
        const r = innerRadius + (outerRadius - innerRadius) / 2;

        // 차트 중심 좌표
        const centerX = chart.chartArea.left + chart.width / 2;
        const centerY = chart.chartArea.top + chart.height / 2;

        // 각도 + 반지름을 이용해 좌표 계산
        const x = centerX + Math.cos(angle) * r;
        const y = centerY + Math.sin(angle) * r;

        ctx.fillText(value + "%", x, y);
      });

      ctx.restore();
    },
  };

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
      cutout: "60%",
      rotation: -90,
      responsive: true,
      radius: "90%",
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          titleFont: { size: 18 },
          bodyFont: { size: 17 },
          padding: 12,
          borderWidth: 1,
          backgroundColor: () => (isDarkMode() ? "#1f2937" : "#0f172a"),
          borderColor: () => (isDarkMode() ? "#1f2937" : "#0f172a"),
          titleColor: "#f9fafb",
          bodyColor: "#f9fafb",
          // titleFont: { size: 12 },
          // bodyFont: { size: 11 },
          // padding: 8,

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
    plugins: [sliceLabelPlugin],
  });

  function updateDonutBorderColor() {
    if (!weightsChart) return;
    const color = isDarkMode() ? "#0f172a" : "#ffffff";
    weightsChart.data.datasets[0].borderColor = color;
    weightsChart.update();
  }

  const legendContainer = document.getElementById("weightsLegend");

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
  // 변경: 레전드를 함수로 분리 + 언어별 기업명 사용 + 퍼센트 제거
  function buildWeightsLegend() {
    legendContainer.innerHTML = "";

    const langForLegend = getLang();

    companies.forEach((ticker, i) => {
      const item = document.createElement("div");
      item.className = "legend-item";

      const dot = document.createElement("div");
      dot.className = "legend-dot";
      dot.style.backgroundColor = colors[i];

      const label = document.createElement("span");

      // 언어에 따라 기업명 선택
      const displayName =
        langForLegend === "ko" ? companyNamesKo[i] : companyNamesEn[i];

      // ✅ 변경: 퍼센트 빼고 기업명만 표시
      label.innerText = displayName;

      item.appendChild(dot);
      item.appendChild(label);
      legendContainer.appendChild(item);
    });
  }
  buildWeightsLegend();

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // // GC=F / VIX / SHY 전일 대비 증감률 표시
  // ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // async function fetchMarketDailyChange() {
  //   try {
  //     const res = await fetch("http://localhost:8000/daily-change");
  //     if (!res.ok) {
  //       console.error("daily-change API 에러:", res.status, await res.text());
  //       return;
  //     }

  //     const data = await res.json();
  //     console.log("daily-change 응답:", data);

  //     const base = data.base_values || {};
  //     const comp = data.compare_values || {};
  //     const abs = data.abs_change || {};
  //     const pct = data.pct_change || {};

  //     // 공통 포맷터: 변화값 + 변화율 텍스트
  //     function formatChange(absVal, pctVal) {
  //       if (absVal == null || pctVal == null) return "-";
  //       const absNum = Number(absVal);
  //       const pctNum = Number(pctVal);

  //       const signAbs = absNum > 0 ? "+" : absNum < 0 ? "" : "";
  //       const signPct = pctNum > 0 ? "+" : pctNum < 0 ? "" : "";

  //       return `${signAbs}${absNum.toFixed(2)} (${signPct}${pctNum.toFixed(
  //         2
  //       )}%)`;
  //     }

  //     function setMarketRow(symbolKey, priceElId, changeElId) {
  //       const priceEl = document.getElementById(priceElId);
  //       const changeEl = document.getElementById(changeElId);
  //       if (!priceEl || !changeEl) return;

  //       const latestPrice = comp[symbolKey];
  //       const absVal = abs[symbolKey];
  //       const pctVal = pct[symbolKey];

  //       // 가격 표시 방식 분기
  //       if (latestPrice != null) {
  //         if (symbolKey === "^VIX_Close") {
  //           // 🔹 VIX는 백엔드 데이터가 "단순 지수" 형태이므로 % 단위로 표시
  //           priceEl.textContent = `${Number(latestPrice).toFixed(2)}%`;
  //         } else {
  //           // 🔹 금(GC=F), SHY는 가격 → $ 단위
  //           priceEl.textContent = `$${Number(latestPrice).toFixed(2)}`;
  //         }
  //       } else {
  //         priceEl.textContent = "-";
  //       }

  //       // 변화 텍스트 설정
  //       changeEl.textContent = formatChange(absVal, pctVal);

  //       // 색상: + 빨강 / - 파랑
  //       let color = "";
  //       if (pctVal != null && !Number.isNaN(Number(pctVal))) {
  //         const pctNum = Number(pctVal);
  //         if (pctNum > 0) {
  //           color = "#ef4444"; // 빨강
  //         } else if (pctNum < 0) {
  //           color = "#2563eb"; // 파랑
  //         }
  //       }
  //       changeEl.style.color = color;
  //     }

  //     // 매핑: GC=F_Close → gold, ^VIX_Close → vix, SHY_Close → shy
  //     setMarketRow("GC=F_Close", "gold-price", "gold-change");
  //     setMarketRow("^VIX_Close", "vix-price", "vix-change");
  //     setMarketRow("SHY_Close", "shy-price", "shy-change");
  //   } catch (err) {
  //     console.error("daily-change 데이터 불러오기 실패:", err);
  //   }
  // }

  // fetchMarketDailyChange();

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // GC=F / VIX / SHY 전일 대비 변동성 증감률 표시  (변동성 기준으로 수정됨)
  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  async function fetchMarketDailyChange() {
    try {
      const res = await fetch("http://localhost:8000/daily-change");
      if (!res.ok) {
        console.error("daily-change API 에러:", res.status, await res.text());
        return;
      }

      const data = await res.json();
      console.log("daily-change 응답:", data);

      const base = data.base_values || {};
      const comp = data.compare_values || {};
      const abs = data.abs_change || {};
      const pct = data.pct_change || {};

      // 변화값 + 변화율 텍스트
      function formatChange(absVal, pctVal) {
        if (absVal == null || pctVal == null) return "-";
        const absNum = Number(absVal);
        const pctNum = Number(pctVal);

        const signAbs = absNum > 0 ? "+" : absNum < 0 ? "" : "";
        const signPct = pctNum > 0 ? "+" : pctNum < 0 ? "" : "";

        return `${signAbs}${absNum.toFixed(2)} (${signPct}${pctNum.toFixed(
          2
        )}%)`;
      }

      function setMarketRow(symbolKey, valueElId, changeElId) {
        const valueEl = document.getElementById(valueElId);
        const changeEl = document.getElementById(changeElId);
        if (!valueEl || !changeEl) return;

        const latestVal = comp[symbolKey];
        const absVal = abs[symbolKey];
        const pctVal = pct[symbolKey];

        // 변동성은 % 단위가 아니라 '지표값' 형태 → 소수 2자리
        if (latestVal != null) {
          valueEl.textContent = Number(latestVal).toFixed(2);
        } else {
          valueEl.textContent = "-";
        }

        // 변화 텍스트 표시
        changeEl.textContent = formatChange(absVal, pctVal);

        // 색상: + 빨강 / - 파랑
        let color = "";
        if (pctVal != null && !Number.isNaN(Number(pctVal))) {
          const pctNum = Number(pctVal);
          if (pctNum > 0) color = "#ef4444";
          else if (pctNum < 0) color = "#2563eb";
        }
        changeEl.style.color = color;
      }

      // 매핑 수정: 변동성 기준
      setMarketRow("GC=F_Volatility", "gold-price", "gold-change");
      setMarketRow("^VIX_Volatility", "vix-price", "vix-change");
      setMarketRow("SHY_Volatility", "shy-price", "shy-change");
    } catch (err) {
      console.error("daily-change 데이터 불러오기 실패:", err);
    }
  }

  fetchMarketDailyChange();

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
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

  // const defaultSuggestions = [
  //   "오늘 S&P 500 시장 분위기 요약해 줘",
  //   "내 포트폴리오 리스크를 줄이는 방법 알려줘",
  //   "금리 상승이 주식시장에 미치는 영향 설명해 줘",
  //   "VIX 지수가 높다는 건 어떤 의미야?",
  //   "장기 투자 vs 단기 투자 차이 알려줘",
  // ];

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

  // function nextSuggestionsFromUserMessage(msg) {
  //   const t = msg.toLowerCase();

  //   if (t.includes("gold") || t.includes("금"))
  //     return [
  //       "금 가격이 오를 때 같이 움직이는 자산이 뭐야?",
  //       "금과 주식의 상관관계 설명해 줘",
  //       "인플레이션과 금 가격 관계 알려줘",
  //     ];

  //   if (t.includes("vix") || t.includes("변동성"))
  //     return [
  //       "VIX가 높을 때 어떤 전략을 쓰는 게 좋아?",
  //       "VIX와 S&P 500의 관계를 그래프로 설명해줘",
  //       "변동성이 심할 때 분산투자 전략 추천해줘",
  //     ];

  //   return [
  //     "내가 너무 리스크를 많이 지고 있는지 체크해 줄 수 있어?",
  //     "ETF 위주로 안정적인 포트폴리오 만들려면 어떻게 해야 해?",
  //     "현금 비중은 어느 정도가 좋아?",
  //   ];
  // }

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

  // function renderSuggestions(list) {
  //   chatSuggestions.innerHTML = "";
  //   list.forEach((s) => {
  //     const btn = document.createElement("button");
  //     btn.className = "chat-suggestion-btn";
  //     btn.textContent = s;
  //     btn.onclick = () => sendUserMessage(s);
  //     chatSuggestions.appendChild(btn);
  //   });
  // }

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

  //     const data = await resp.json();
  //     loadingMsg.remove();
  //     appendMessage(data.reply ?? "응답을 가져오지 못했습니다.", false);

  //     renderSuggestions(nextSuggestionsFromUserMessage(trimmed));
  //   } catch (err) {
  //     console.error(err);
  //     loadingMsg.remove();
  //     appendMessage("네트워크 오류가 발생했습니다.", false);
  //   }
  // }

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

  // chatToggleBtn.addEventListener("click", () => {
  //   const isOpen = chatWidget.style.display === "flex";
  //   chatWidget.style.display = isOpen ? "none" : "flex";

  //   if (!isOpen && !chatOpenedOnce) {
  //     chatOpenedOnce = true;
  //     appendMessage(
  //       "안녕하세요! 투자·시장 관련 질문을 도와드리는 챗봇입니다. 아래 추천 질문을 눌러보세요!",
  //       false
  //     );
  //     renderSuggestions(defaultSuggestions);
  //   }
  // });

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
  // const themeIcon = document.getElementById("themeIcon");
  const themeLabel = document.getElementById("themeLabel");
  const themeIcon = themeToggle.querySelector("img");

  let currentLang = localStorage.getItem("lang") || "ko";
  let currentTheme = localStorage.getItem("theme") || "light";

  // const i18n = {
  //   en: {
  //     brandTitle: "Investment Portfolio",
  //     currencyTitle: "USD/KRW",
  //     spTitle: "S&P 500 Chart",
  //     spSubtitle: "SPY ETF line chart (with prediction)",
  //     weightsTitle: "Company Weights",
  //     weightsSubtitle: "Portfolio distribution by company",
  //     marketTitle: "Market Indicators",
  //     time1w: "1W",
  //     time1m: "1M",
  //     time6m: "6M",
  //     time1y: "1Y",
  //     marketGold: "Gold Futures",
  //     marketVix: "VIX Index",
  //     marketTreasury: "Treasury ETF",
  //     chatTitle: "Portfolio Chatbot",
  //     chatPlaceholder: "Ask about your portfolio or the market...",
  //   },
  //   ko: {
  //     brandTitle: "투자 포트폴리오",
  //     currencyTitle: "달러 환율",
  //     spTitle: "S&P 500 차트",
  //     spSubtitle: "SPY ETF 수익률 및 예측 차트",
  //     weightsTitle: "기업 비중",
  //     weightsSubtitle: "기업별 비중",
  //     marketTitle: "시장 지표",
  //     time1w: "1주",
  //     time1m: "1개월",
  //     time6m: "6개월",
  //     time1y: "1년",
  //     marketGold: "금선물",
  //     marketVix: "공포지수",
  //     marketTreasury: "단기국채",
  //     chatTitle: "포트폴리오 챗봇",
  //     chatPlaceholder: "포트폴리오나 시장에 대해 물어보세요...",
  //   },
  // };

  // function applyLanguage(lang) {
  //   const dict = i18n[lang];
  //   if (!dict) return;

  //   document.querySelectorAll("[data-i18n]").forEach((el) => {
  //     const key = el.getAttribute("data-i18n");
  //     if (dict[key]) el.textContent = dict[key];
  //   });

  //   document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
  //     const key = el.getAttribute("data-i18n-placeholder");
  //     if (dict[key]) el.placeholder = dict[key];
  //   });

  //   document.documentElement.lang = lang === "ko" ? "ko" : "en";
  //   langLabel.textContent = lang === "ko" ? "한국어" : "English";
  //   localStorage.setItem("lang", lang);
  // }

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
    buildWeightsLegend();

    // 현재 활성 구간에 맞게 레전드 텍스트 다시 렌더
    const activeBtn =
      document.querySelector(".time-toggle button.active") || rangeButtons[0];
    const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

    // if (activeRange === "1W") {
    // createWeekCandlestick();
    // } else {
    // renderLineLegend();
    // }
  }

  // 페이지 로딩 시 저장된 테마 불러오기
  applyTheme(currentTheme);

  // 버튼 클릭 시 테마 전환
  themeToggle.addEventListener("click", () => {
    const currentTheme = document.body.classList.contains("dark-mode")
      ? "dark"
      : "light";

    const newTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(newTheme);
  });

  // 전환 적용 함수
  function applyTheme(theme) {
    const dark = theme === "dark";
    document.body.classList.toggle("dark-mode", dark);

    if (dark) {
      themeIcon.src = "달.png";
      themeIcon.alt = "moon";
      themeLabel.textContent = "다크";
    } else {
      themeIcon.src = "해.png";
      themeIcon.alt = "sun";
      themeLabel.textContent = "라이트";
    }

    localStorage.setItem("theme", theme);

    // 테마 바뀌면 도넛 차트 테두리 갱신
    updateDonutBorderColor();
  }

  // langToggleBtn.addEventListener("click", () => {
  //   currentLang = currentLang === "ko" ? "en" : "ko";
  //   applyLanguage(currentLang);
  // });
  // langToggleBtn.addEventListener("click", () => {
  //   currentLang = currentLang === "ko" ? "en" : "ko";
  //   applyLanguage(currentLang);

  //   // 🔹 현재 활성화된 기간 버튼 기준으로 차트 다시 그림
  //   const activeBtn = document.querySelector(".time-toggle button.active");
  //   const activeRange = activeBtn?.getAttribute("data-range") || defaultRange;

  //   if (activeRange === "1W") {
  //     createWeekCandlestick();
  //   } else {
  //     createLineChart(activeRange);
  //   }
  // });

  langToggleBtn.addEventListener("click", () => {
    currentLang = currentLang === "ko" ? "en" : "ko";
    applyLanguage(currentLang);
    resetChatForLanguage(currentLang);
    redrawMainChart();
  });

  // themeToggleBtn.addEventListener("click", () => {
  //   currentTheme = currentTheme === "light" ? "dark" : "light";
  //   applyTheme(currentTheme);
  // });

  themeToggleBtn.addEventListener("click", () => {
    currentTheme = currentTheme === "light" ? "dark" : "light";
    applyTheme(currentTheme);
    redrawMainChart();
  });

  applyLanguage(currentLang);
  applyTheme(currentTheme);
});
