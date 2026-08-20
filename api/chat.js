export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({
            error: "Only POST is allowed"
        });
    }

    try {
        const apiKey =
            process.env.OPENROUTER_API_KEY;

        if (!apiKey) {
            return res.status(500).json({
                error: "OPENROUTER_API_KEY eksik."
            });
        }

        const {
            message,
            history = [],
            mode = "Auto"
        } = req.body || {};

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                error: "Mesaj boş."
            });
        }

        const safeHistory =
            Array.isArray(history)
                ? history.slice(-20).filter(
                    item =>
                        item &&
                        (
                            item.role === "user" ||
                            item.role === "assistant"
                        ) &&
                        typeof item.content === "string"
                )
                : [];

        const messages = [
            {
                role: "system",
                content: `
You are MY AI.

Current mode: ${mode}

Help with school, coding, study,
research and general questions.

Be accurate, useful and clear.

Never claim to browse the web
unless a real web tool was used.

Do not invent sources.
                `.trim()
            },
            ...safeHistory,
            {
                role: "user",
                content: message.trim()
            }
        ];

        const response = await fetch(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    "Authorization":
                        `Bearer ${apiKey}`,
                    "Content-Type":
                        "application/json",
                    "X-Title":
                        "MY AI"
                },
                body: JSON.stringify({
                    model: "openrouter/free",
                    messages,
                    temperature: 0.7
                })
            }
        );

        const data =
            await response.json();

        if (!response.ok) {
            return res.status(
                response.status
            ).json({
                error:
                    data?.error?.message ||
                    "OpenRouter hatası"
            });
        }

        const answer =
            data?.choices?.[0]
                ?.message?.content;

        if (!answer) {
            return res.status(502).json({
                error:
                    "AI boş cevap döndürdü."
            });
        }

        return res.status(200).json({
            answer,
            model: "openrouter/free"
        });

    } catch (error) {

        return res.status(500).json({
            error:
                error?.message ||
                "Sunucu hatası"
        });
    }
}
