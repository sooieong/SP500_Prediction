// server.js
import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 정적 파일 서빙 (index.html, styles.css, script.js)
app.use(express.static("public")); // public 폴더에 프런트 파일 넣는다고 가정

// Perplexity Chat API 프록시
app.post("/api/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;
    if (!userMessage) {
      return res.status(400).json({ error: "message is required" });
    }

    const apiKey = process.env.PPLX_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "PPLX_API_KEY is not set" });
    }

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "sonar", // 필요시 sonar-pro 등으로 변경
        messages: [
          {
            role: "system",
            content:
              "너는 투자 대시보드 안에서 동작하는 금융/일반 지식 챗봇이야. 한국어로 정중하게 답해.",
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        temperature: 0.3,
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Perplexity error:", text);
      return res.status(500).json({ error: "Perplexity API error" });
    }

    const data = await resp.json();
    const reply =
      data?.choices?.[0]?.message?.content ?? "응답을 가져오지 못했습니다.";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
