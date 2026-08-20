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
                error:
                    "OPENROUTER_API_KEY eksik."
            });
        }

        const {
            message,
            history = [],
            mode = "Auto",
            webSearch = false,
            attachment = null
        } = req.body || {};

        if (
            typeof message !== "string" ||
            !message.trim()
        ) {
            return res.status(400).json({
                error:
                    "Mesaj boş."
            });
        }


        const safeHistory =
            Array.isArray(history)
                ? history
                    .slice(-20)
                    .filter(
                        item =>
                            item &&
                            (
                                item.role ===
                                    "user" ||
                                item.role ===
                                    "assistant"
                            ) &&
                            typeof item.content ===
                                "string"
                    )
                : [];


        const messages = [

            {
                role: "system",

                content:
                    `
You are MY AI.

Current mode: ${mode}

Help with school, coding, study,
research and general questions.

Be accurate and useful.

Never invent sources.

${
    webSearch
        ? `
WEB SEARCH IS ENABLED.
Use the web search tool when useful.
Clearly distinguish current web information
from your own reasoning.
`
        : ""
}
                    `.trim()
            },

            ...safeHistory

        ];


        let userContent = message.trim();


        /*
         * IMAGE INPUT
         */

        if (
            attachment &&
            attachment.image &&
            typeof attachment.data ===
                "string"
        ) {

            userContent = [

                {
                    type: "text",

                    text:
                        message.trim() ||
                        "Bu görseli analiz et."
                },

                {
                    type: "image_url",

                    image_url: {
                        url:
                            attachment.data
                    }
                }

            ];

        }


        /*
         * PDF INPUT
         */

        else if (
            attachment &&
            attachment.type ===
                "application/pdf" &&
            typeof attachment.data ===
                "string"
        ) {

            userContent = [

                {
                    type: "text",

                    text:
                        message.trim() ||
                        `Bu PDF'yi analiz et: ${attachment.name}`
                },

                {
                    type: "file",

                    file: {
                        filename:
                            attachment.name,

                        file_data:
                            attachment.data
                    }
                }

            ];

        }


        /*
         * TEXT-LIKE FILES
         *
         * TXT / MD / JSON / CSV
         */

        else if (
            attachment &&
            typeof attachment.data ===
                "string" &&
            (
                attachment.type ===
                    "text/plain" ||
                attachment.type ===
                    "text/markdown" ||
                attachment.type ===
                    "application/json" ||
                attachment.type ===
                    "text/csv"
            )
        ) {

            const prefix =
                attachment.data.includes(",")
                    ? attachment.data
                        .split(",")
                        .slice(1)
                        .join(",")
                    : attachment.data;

            const decoded =
                Buffer
                    .from(
                        prefix,
                        "base64"
                    )
                    .toString(
                        "utf8"
                    );

            userContent =
                `
Dosya adı: ${attachment.name}

Dosya içeriği:

${decoded}

Kullanıcı isteği:

${message.trim()}
                `.trim();
        }


        messages.push({

            role: "user",

            content: userContent

        });


        const requestBody = {

            model:
                "openrouter/free",

            messages,

            temperature:
                0.7
        };


        /*
         * WEB SEARCH
         *
         * OpenRouter server tool.
         */

        if (webSearch) {

            requestBody.tools = [

                {
                    type:
                        "openrouter:web_search",

                    parameters: {

                        engine:
                            "auto",

                        max_results:
                            5,

                        max_total_results:
                            10
                    }
                }

            ];

            requestBody.max_tool_calls =
                3;
        }


        const response =
            await fetch(
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

                    body:
                        JSON.stringify(
                            requestBody
                        )
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
            data
                ?.choices
                ?. [0]
                ?.message
                ?.content;


        if (!answer) {

            return res.status(502).json({

                error:
                    "AI boş cevap döndürdü."

            });

        }


        return res.status(200).json({

            answer,

            model:
                "openrouter/free",

            webSearch:
                webSearch === true

        });


    } catch (error) {

        return res.status(500).json({

            error:
                error?.message ||
                "Sunucu hatası."

        });

    }

}
