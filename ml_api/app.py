# ml_api/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.preprocessing import MinMaxScaler

import joblib
model = joblib.load("../ml_api/models/다중회귀_best.joblib")
print(model.coef_.shape)

app = Flask(__name__)
CORS(app)  # 개발 단계라 origin 전부 허용

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LOG_PATH = os.path.join(BASE_DIR, "data", "log.csv")
SAMPLE_PATH = os.path.join(BASE_DIR, "data", "SPYlog샘플데이터.csv")
ORIGIN_PATH = os.path.join(BASE_DIR, "data", "log공선성제거_Final_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "models", "다중회귀_best.joblib")

# app.py 맨 위쪽(모델 로딩 근처)에 추가
BEST_SEQ_LEN = 2

FEATURE_COLS = [
    "GC=F_Volume",
    "^VIX_Volatility",
    "GC=F_Volatility",
    "SHY_Volatility",
    "SPY_Premium_pct",
]

# ------------------------
# 1) 데이터 & 모델 한 번만 로드
# ------------------------
log_df = pd.read_csv(LOG_PATH)
sample_df = pd.read_csv(SAMPLE_PATH)
model = joblib.load(MODEL_PATH)
origin_df = pd.read_csv(ORIGIN_PATH)

# 날짜 정렬
log_df["Date"] = pd.to_datetime(log_df["Date"])
sample_df["Date"] = pd.to_datetime(sample_df["Date"])
origin_df["Date"] = pd.to_datetime(origin_df["Date"])

log_df = log_df.sort_values("Date").reset_index(drop=True)
sample_df = sample_df.sort_values("Date").reset_index(drop=True)
origin_df = origin_df.sort_values("Date").reset_index(drop=True)

# level 복원 (exp) - log 값들
log_df["Close"] = np.exp(log_df["y_target_log"])
log_df["High"] = np.exp(log_df["SPY_High"])
log_df["Low"]  = np.exp(log_df["SPY_Low"])

sample_df["Close_true"] = np.exp(sample_df["y_target_log"]) 
origin_df["Close_true"] = np.exp(origin_df["y_target_log"]) 

# ------------------------
# 2) 1주용 캔들 + 예측 데이터 생성
# ------------------------
def build_last_week_candles(num_days: int = 5):
    """
    log.csv 기준으로 마지막 num_days 거래일 캔들 생성
    open 은 전일 close 로 대체
    """
    if len(log_df) < num_days + 1:
        raise ValueError("데이터가 너무 적습니다.")

    sub = log_df.iloc[-(num_days + 1):].copy()  # 이전 종가 포함
    candles = []

    for i in range(1, len(sub)):
        prev_close = sub.iloc[i - 1]["Close"]
        row = sub.iloc[i]
        d = row["Date"].strftime("%Y-%m-%d")

        candles.append({
            "time": d,
            "open": float(prev_close),
            "high": float(row["High"]),
            "low":  float(row["Low"]),
            "close": float(row["Close"]),
        })

    return candles



# def build_prediction_line():
#     """
#     SPYlog샘플데이터.csv 기반으로
#     - FEATURE_COLS(5개) 사용
#     - BEST_SEQ_LEN = 2 슬라이딩 윈도우
#     - ret_prev 예측 후 log level 복원
#     - 실제 가격(np.exp)으로 변환하여 프론트 전달
#     """

#     df = sample_df.sort_values("Date").reset_index(drop=True)
#     print(df.tail())


#     # -------------------------------
#     # 1. 피처 준비
#     # -------------------------------
#     FEATURE_COLS_FOR_PRED = FEATURE_COLS  # 5개
#     price_col = "y_target_log"

#     # y(log) 타깃
#     y_log = df[price_col].astype(float).to_numpy()

#     # X: 5개 피처 선택
#     X_feat = df[FEATURE_COLS_FOR_PRED].astype(float)

#     # 스케일링
#     scaler = MinMaxScaler()
#     X_scaled = scaler.fit_transform(X_feat.values)

#     # -------------------------------
#     # 2. 시퀀스 생성
#     # -------------------------------
#     seq_len = BEST_SEQ_LEN
#     X_list = []
#     y_true_list = []  # 예측 시점 실제 log 값
#     date_list = []

#     for i in range(len(X_scaled) - seq_len + 1):
#         X_list.append(X_scaled[i : i + seq_len])
#         y_true_list.append(y_log[i + seq_len - 1])
#         date_list.append(df.loc[i + seq_len - 1, "Date"])

#     if not X_list:
#         return []

#     X_seq = np.array(X_list)                 # shape = (N, seq_len, 5)
#     n_samples = X_seq.shape[0]
#     X_seq_2d = X_seq.reshape(n_samples, -1)  # shape = (N, seq_len * 5 = 10)

#     # -------------------------------
#     # 3. 모델 예측 (차분 ret_prev)
#     # -------------------------------
#     y_ret_pred = model.predict(X_seq_2d)

#     # -------------------------------
#     # 4. 로그 레벨 복원
#     # logP_pred[t] = logP_true[t-1] + ret_prev[t]
#     # -------------------------------
#     log_prev = y_log[(seq_len - 1) - 1 : (seq_len - 1) - 1 + n_samples]
#     # 첫 시점 이전 로그가 없음 → 패딩 처리
#     if len(log_prev) < n_samples:
#         first_val = y_log[0]
#         log_prev = np.concatenate(([first_val], log_prev))

#     y_log_pred = log_prev + y_ret_pred

#     # -------------------------------
#     # 5. 실제 가격 레벨 복원
#     # -------------------------------
#     y_price_pred = np.exp(y_log_pred)

#     # -------------------------------
#     # 6. JSON 반환
#     # -------------------------------
#     pred_points = []
#     for dt, v in zip(date_list, y_price_pred):
#         pred_points.append({
#             "time": dt.strftime("%Y-%m-%d"),
#             "value": float(v),
#         })

#     return pred_points



def build_prediction_line():
    """
    origin_df + sample_df 을 날짜 기준으로 이어붙여
    하나의 타임라인으로 예측 수행하는 함수.

    - FEATURE_COLS(5개)
    - BEST_SEQ_LEN = 2
    - ret_prev 예측 후 log level 복원
    - exp()로 실제 가격 전환
    """

    # ---------------------------------------------
    # 1. origin_df 로 스케일러 학습
    # ---------------------------------------------
    origin_df1 = origin_df.copy()
    price_col = "y_target_log"
    drop_cols = ["Unnamed: 0", price_col, "Date"]

    # origin_df에서 학습에 사용한 피처만 남김
    X_train_for_scaler = origin_df1[FEATURE_COLS].astype(float)
    X_train_for_scaler = X_train_for_scaler.select_dtypes(include=[np.number])


    # 스케일러 fit (학습 데이터 기준)
    scaler = MinMaxScaler()
    scaler.fit(X_train_for_scaler.values) 


    # -----------------------------
    # 2. origin_df + sample_df 연결
    # -----------------------------
    origin_sorted = origin_df.sort_values("Date").reset_index(drop=True)
    origin_trimmed = origin_sorted.iloc[:-1].copy()   # 마지막 행 제거

    df = pd.concat([origin_trimmed, sample_df], ignore_index=True)
    df = df.sort_values("Date").reset_index(drop=True)
    # print(df.tail())

    # -----------------------------
    # 3. 합쳐진 df에서 FEATURE_COLS만 추출
    # -----------------------------
    X_feat = df[FEATURE_COLS].astype(float)

    # -----------------------------
    # 4. transform만 적용
    # -----------------------------
    X_scaled = scaler.transform(X_feat.values)

    # y(log)
    y_log = df[price_col].astype(float).to_numpy()


    # ---------------------------------------------
    # 1. 시퀀스 생성
    # ---------------------------------------------
    seq_len = BEST_SEQ_LEN
    X_list = []
    y_true_list = []
    date_list = []

    for i in range(len(X_scaled) - seq_len + 1):
        X_list.append(X_scaled[i: i + seq_len])
        y_true_list.append(y_log[i + seq_len - 1])
        date_list.append(df.loc[i + seq_len - 1, "Date"])

    if not X_list:
        return []

    X_seq = np.array(X_list)        # shape = (N, seq_len, 5)
    n_samples = X_seq.shape[0]
    X_seq_2d = X_seq.reshape(n_samples, -1)

    # ---------------------------------------------
    # 2. 모델 예측 (ret_prev)
    # ---------------------------------------------
    y_ret_pred = model.predict(X_seq_2d)

    # ---------------------------------------------
    # 3. 로그 레벨 복원
    # logP_pred[t] = logP_true[t-1] + ret_prev[t]
    # ---------------------------------------------
    log_prev = y_log[(seq_len - 1) - 1 : (seq_len - 1) - 1 + n_samples]

    if len(log_prev) < n_samples:
        first_val = y_log[0]
        log_prev = np.concatenate(([first_val], log_prev))

    y_log_pred = log_prev + y_ret_pred

    # ---------------------------------------------
    # 4. exp()로 실제 가격 복원
    # ---------------------------------------------
    y_price_pred = np.exp(y_log_pred)

    # ---------------------------------------------
    # 5. JSON 반환
    # ---------------------------------------------
    pred_points = []
    for dt, v in zip(date_list, y_price_pred):
        pred_points.append({
            "time": dt.strftime("%Y-%m-%d"),
            "value": float(v),
        })

    return pred_points




def build_actual_line_from_log(range_key: str):
    """
    range_key: '1M', '6M', '1Y'
    log.csv 에서 해당 구간의 실제 SPY_Close (level)를 반환
    """
    # 대략적인 개수(원하시면 조정 가능)
    window_map = {
        "1M": 22,   # 최근 1개월 영업일 22일 정도
        "6M": 22 * 6,
        "1Y": 252,  # 1년 영업일
    }
    n = window_map.get(range_key, 252)

    df = log_df.copy()
    # 로그 → 레벨 복원
    df["SPY_Close_level"] = np.exp(df["y_target_log"])

    # 뒤에서 n개만 사용
    df_range = df.iloc[-n:]
    dates = df_range["Date"].dt.strftime("%Y-%m-%d").tolist()
    values = df_range["SPY_Close_level"].astype(float).tolist()

    # 프론트에서 한 줄로 쓰기 좋게
    points = [{"time": d, "value": v} for d, v in zip(dates, values)]
    return points


def build_prediction_line_all():
    """
    SPYlog샘플데이터 + 모델로 미래 예측 close 생성
    (지금 사용 중이신 build_prediction_line() 그대로 써도 무방)
    """
    return build_prediction_line()  # 이미 {time, value} 리스트를 반환한다고 가정

def build_prediction_line_range(range_key: str):
    """
    range_key: '1M', '6M', '1Y'
    전체 예측값 중에서 뒤에서 n개만 잘라서 반환
    (actual이랑 동일한 window_map 사용)
    """
    window_map = {
        "1M": 22,        # 대략 1개월
        "6M": 22 * 6,    # 대략 6개월
        "1Y": 252,       # 1년 영업일
    }
    n = window_map.get(range_key, 252)

    all_pred = build_prediction_line_all()  # 시간순이라고 가정 (아니면 sort 한 번)

    # 혹시 정렬이 안 돼 있을 수도 있으니 한 번 정렬해 주는 것도 안전함
    all_pred_sorted = sorted(all_pred, key=lambda x: x["time"])

    # 예측 포인트가 n개보다 적으면 다 쓰고, 많으면 뒤에서 n개만 사용
    if len(all_pred_sorted) > n:
        pred_range = all_pred_sorted[-n:]
    else:
        pred_range = all_pred_sorted

    return pred_range



# -------------------------------
# 1) log_df 로드 함수
# -------------------------------
def load_log_df():
    df = pd.read_csv(LOG_PATH)

    if "Date" not in df.columns:
        raise ValueError("CSV 파일에 Date 컬럼이 없습니다.")

    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date").reset_index(drop=True)
    return df

# -------------------------------
# 2) 날짜 비교 계산 함수
# -------------------------------
def calc_daily_change(log_df, base_date, compare_date):
    target_cols = ["GC=F_Close", "^VIX_Close", "SHY_Close"]

    # 날짜 필터
    row_base = log_df.loc[log_df["Date"] == pd.to_datetime(base_date)]
    row_comp = log_df.loc[log_df["Date"] == pd.to_datetime(compare_date)]

    if row_base.empty:
        return {"error": f"{base_date} 데이터가 없습니다."}, 404
    if row_comp.empty:
        return {"error": f"{compare_date} 데이터가 없습니다."}, 404

    base_vals = row_base.iloc[0][target_cols].astype(float)
    comp_vals = row_comp.iloc[0][target_cols].astype(float)

    # 절대 변화량
    abs_change = {col: comp_vals[col] - base_vals[col] for col in target_cols}

    # 증감율 (변화율)
    pct_change = {}
    for col in target_cols:
        b = base_vals[col]
        c = comp_vals[col]
        if b == 0:
            pct_change[col] = None
        else:
            pct_change[col] = (c - b) / b * 100

    # 반올림
    abs_change = {k: round(v, 6) for k, v in abs_change.items()}
    pct_change = {k: round(v, 6) if v is not None else None for k, v in pct_change.items()}

    return {
        "base_date": base_date,
        "compare_date": compare_date,
        "base_values": base_vals.to_dict(),
        "compare_values": comp_vals.to_dict(),
        "abs_change": abs_change,
        "pct_change": pct_change
    }, 200


# -------------------------------
# 3) Flask 라우터
# -------------------------------
@app.get("/daily-change")
def daily_change():
    base_date = request.args.get("base_date", "2025-11-06")
    compare_date = request.args.get("compare_date", "2025-11-07")

    try:
        df = load_log_df()
        result, status = calc_daily_change(df, base_date, compare_date)
        return jsonify(result), status
    except Exception as e:
        return jsonify({"error": str(e)}), 500






# @app.get("/chart-1w")
# def chart_1w():
#     """
#     1주 버튼용:
#       - candles : 실제 OHLC
#       - predicted_line :
#             candles 최소 날짜 ~ (candles 마지막 날짜 + 3일) 범위만 전송
#     """
#     try:
#         candles = build_last_week_candles(num_days=5)
#         predicted_line = build_prediction_line()  # [{time: 'YYYY-MM-DD', value: float}]

#         if candles and predicted_line:
#             # -----------------------------
#             # 1) candles 최소·최대 날짜
#             # -----------------------------
#             min_candle_date = min(c["time"] for c in candles)   # 예: '2025-11-03'
#             max_candle_date = max(c["time"] for c in candles)   # 예: '2025-11-07'

#             # 문자열 → datetime 변환
#             from datetime import datetime, timedelta
#             fmt = "%Y-%m-%d"

#             min_dt = datetime.strptime(min_candle_date, fmt)
#             max_dt = datetime.strptime(max_candle_date, fmt)

#             # -----------------------------
#             # 2) 마지막 캔들 날짜 + 3일
#             # -----------------------------
#             end_dt = max_dt + timedelta(days=3)  # 11/10

#             # -----------------------------
#             # 3) 예측 데이터 중 범위 내만 남기기
#             # -----------------------------
#             filtered_predicted = []
#             for p in predicted_line:
#                 if "time" not in p:
#                     continue
#                 t = datetime.strptime(p["time"], fmt)

#                 # min_candle_date <= p.time <= max_candle_date + 3일
#                 if min_dt <= t <= end_dt:
#                     filtered_predicted.append(p)
#         else:
#             filtered_predicted = predicted_line

#         return jsonify({
#             "candles": candles,
#             "predicted_line": filtered_predicted,
#         })

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500

@app.get("/chart-1w")
def chart_1w():
    """
    1주 버튼용:
      - candles : 실제 OHLC
      - predicted_line :
            candles 최소 날짜 ~
            candles 마지막 날짜 이후 "다음 3개의 거래일" 구간만 전송
            (예: 11/03~11/07 캔들이면 → 11/03~11/07 + 11/10~11/12)
    """
    try:
        candles = build_last_week_candles(num_days=5)
        predicted_line = build_prediction_line()  # [{time: 'YYYY-MM-DD', value: float}]
        # print(predicted_line)

        if candles and predicted_line:
            # 1) candles 최소·최대 날짜
            min_candle_date = min(c["time"] for c in candles)   # 예: '2025-11-03'
            last_candle_date = max(c["time"] for c in candles)  # 예: '2025-11-07'

            # 2) 마지막 캔들 이후의 "거래일(예측 날짜)"만 추출해서 정렬
            future_days = sorted({
                p["time"]
                for p in predicted_line
                if p.get("time") and p["time"] > last_candle_date
            })

            # 3) 그 중 앞에서 최대 3개 거래일까지만 사용
            if future_days:
                # 최대 3개까지만 자르고, 그 중 마지막 날짜가 upper bound
                future_days_limited = future_days[:3]
                end_date = future_days_limited[-1]  # 예: 11/12
            else:
                # 미래 예측이 없으면 그냥 마지막 캔들까지만
                end_date = last_candle_date

            # 4) min_candle_date ~ end_date 범위만 predicted_line에서 선택
            filtered_predicted = [
                p for p in predicted_line
                if p.get("time") is not None
                and (min_candle_date <= p["time"] <= end_date)
            ]
        else:
            filtered_predicted = predicted_line

        return jsonify({
            "candles": candles,
            "predicted_line": filtered_predicted,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500




@app.get("/chart-line")
def chart_line():
    """
    라인차트용 API
      - query: ?range=1M / 6M / 1Y
      - 실제값: log.csv → build_actual_line_from_log(range_key)
      - 예측값: 모델 예측 → build_prediction_line_range(range_key)
      - 예측 범위가 실제 범위보다 항상 넓다고 가정:
        -> x축 기준은 예측 날짜를 사용
    """
    try:
        range_key = request.args.get("range", "1Y")

        # 1) 실제 구간 (range 에 맞게 자름)
        actual_points = build_actual_line_from_log(range_key)      # [{time, value}, ...]
        # print("실제 데이터:", actual_points)

        # 2) 예측 구간 (range 에 맞게 자름)
        pred_points = build_prediction_line_range(range_key)       # [{time, value}, ...]
        # print("예측 데이터:", pred_points)

        # dict 로 바꿔서 날짜별 value 매핑
        actual_map = {p["time"]: p["value"] for p in actual_points}
        pred_map   = {p["time"]: p["value"] for p in pred_points}

        # 타임라인은 "예측 날짜"를 기준으로 사용 (예측 범위가 더 넓다고 가정)
        pred_dates_sorted = sorted(pred_map.keys())

        labels = pred_dates_sorted
        # 예측값은 무조건 다 채워짐
        predicted_values = [pred_map[d] for d in pred_dates_sorted]
        # 실제값은 있는 날짜만 값, 나머지는 None
        actual_values    = [actual_map.get(d) for d in pred_dates_sorted]

        return jsonify({
            "range": range_key,
            "labels": labels,
            "actual": actual_values,
            "predicted": predicted_values,
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500




# @app.get("/chart-line")
# def chart_line():
#     range_key = request.args.get("range", "1Y")  # '1M', '6M', '1Y'

#     actual = build_actual_line_from_log(range_key)
#     predicted = build_prediction_line_range(range_key)

#     try:
#         # 1) 실제 구간
#         actual_points = build_actual_line_from_log(range_key)
#         # 2) 미래 예측 (11/10 ~ 11/18)
#         pred_points = build_prediction_line_all()

#         # 라벨: 실제 + 미래 날짜 전부
#         labels = [p["time"] for p in actual_points] + \
#                  [p["time"] for p in pred_points]

#         # Actual: 실제 구간 값 + 미래 구간에는 None (선이 거기서 끝나도록)
#         actual_values = [p["value"] for p in actual_points] + \
#                         [None] * len(pred_points)

#         # Predicted: 실제 구간은 None, 미래 구간만 값
#         predicted_values = [None] * len(actual_points) + \
#                            [p["value"] for p in pred_points]

#         return jsonify({
#             "labels": labels,
#             "actual": actual_values,
#             "predicted": predicted_values,
#         })
#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


@app.get("/health")
def health():
    return {"status": "ok"}


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=True)
