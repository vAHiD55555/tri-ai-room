export default {
  async fetch(req, env) {
    try {
      if (req.method !== "POST")
        return new Response("Tri-AI Room Active");

      const { message } = await req.json();
      if (!message)
        return new Response("No message", { status: 400 });

      const profile = await env.MEMORY.get("profile") || "{}";

      const system = `
Persistent triadic conversation.
User: Vahid
Tone: Persian, natural
Profile: ${profile}
`;

      const gpt = await gptCall(env, system, message);
      const gemini = await geminiCall(env, system, message);

      return Response.json({ gpt, gemini });

    } catch (e) {
      return Response.json({ error: e.message }, { status: 500 });
    }
  }
};

async function gptCall(env, system, msg) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: system },
        { role: "user", content: msg }
      ]
    })
  });
  const j = await r.json();
  return j?.choices?.[0]?.message?.content || "GPT silent";
}

async function geminiCall(env, system, msg) {
  const r = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${env.GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: system + msg }] }]
      })
    }
  );
  const j = await r.json();
  return j?.candidates?.[0]?.content?.parts?.[0]?.text || "Gemini silent";
}
