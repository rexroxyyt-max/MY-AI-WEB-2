const form = document.getElementById("chatForm");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("send");
const modeSelect = document.getElementById("mode");
const historyBox = document.getElementById("history");
const newChatButton = document.getElementById("newChat");

let chatHistory = [];
let sending = false;


// ============================================================
// HTML GÜVENLİĞİ
// ============================================================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}


// ============================================================
// MESAJ
// ============================================================

function addMessage(role, text) {

    const welcome =
        document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }

    const message =
        document.createElement("div");

    message.className =
        role === "user"
            ? "message user"
            : "message ai";

    message.innerHTML = `
        <div class="message-title">
            ${
                role === "user"
                    ? "You"
                    : "⚡ MY AI"
            }
        </div>

        <div class="message-content">
            ${
                escapeHtml(text)
                    .replace(/\n/g, "<br>")
            }
        </div>
    `;

    messages.appendChild(message);

    messages.scrollTop =
        messages.scrollHeight;
}


// ============================================================
// LOADING
// ============================================================

function showLoading() {

    const old =
        document.getElementById(
            "ai-loading"
        );

    if (old) {
        old.remove();
    }

    const loading =
        document.createElement("div");

    loading.id =
        "ai-loading";

    loading.className =
        "message ai";

    loading.innerHTML = `
        <div class="message-title">
            ⚡ MY AI
        </div>

        <div class="message-content">
            Düşünüyor...
        </div>
    `;

    messages.appendChild(
        loading
    );

    messages.scrollTop =
        messages.scrollHeight;
}


function hideLoading() {

    const loading =
        document.getElementById(
            "ai-loading"
        );

    if (loading) {
        loading.remove();
    }
}


// ============================================================
// YENİ SOHBET
// ============================================================

function startNewChat() {

    chatHistory = [];

    messages.innerHTML = `
        <div
            class="welcome"
            id="welcome"
        >

            <div class="welcome-logo">
                ⚡
            </div>

            <h1>
                What can I help you with?
            </h1>

            <p>
                School, coding, study, research
                veya aklına gelen başka bir şey.
            </p>

            <div class="prompts">

                <button
                    type="button"
                    data-prompt="Bana bir matematik sorusu sor."
                >
                    📚 Matematik
                </button>

                <button
                    type="button"
                    data-prompt="Python ile basit bir program yaz."
                >
                    💻 Coding
                </button>

                <button
                    type="button"
                    data-prompt="Bana verimli bir çalışma planı hazırla."
                >
                    ◷ Study
                </button>

                <button
                    type="button"
                    data-prompt="Yapay zekanın ne olduğunu açıkla."
                >
                    🔬 Research
                </button>

            </div>

        </div>
    `;

    historyBox.innerHTML = "";

    connectPromptButtons();

    input.value = "";

    input.focus();

    resetSendButton();
}


// ============================================================
// HIZLI PROMPTLAR
// ============================================================

function connectPromptButtons() {

    document
        .querySelectorAll(
            "[data-prompt]"
        )
        .forEach(button => {

            button.addEventListener(
                "click",
                () => {

                    input.value =
                        button.dataset.prompt;

                    input.focus();

                }
            );

        });
}


// ============================================================
// GEÇMİŞ
// ============================================================

function addHistory(text) {

    const item =
        document.createElement("div");

    item.className =
        "history-item";

    item.textContent =
        text.length > 42
            ? text.slice(0, 42) + "..."
            : text;

    historyBox.prepend(item);
}


// ============================================================
// BUTON RESET
// ============================================================

function resetSendButton() {

    sending = false;

    sendButton.disabled = false;

    sendButton.textContent = "↑";

    input.disabled = false;

    input.focus();
}


// ============================================================
// AI'YA GÖNDER
// ============================================================

async function sendToAI(text) {

    if (sending) {
        return;
    }

    const cleanText =
        String(text || "").trim();

    if (!cleanText) {
        return;
    }

    sending = true;

    input.disabled = true;

    sendButton.disabled = true;

    sendButton.textContent = "...";

    addMessage(
        "user",
        cleanText
    );

    chatHistory.push({
        role: "user",
        content: cleanText
    });

    addHistory(
        cleanText
    );

    showLoading();

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",

                        "Accept":
                            "application/json"
                    },

                    body:
                        JSON.stringify({
                            message:
                                cleanText,

                            history:
                                chatHistory.slice(
                                    -20
                                ),

                            mode:
                                modeSelect.value
                        })
                }
            );


        const contentType =
            (
                response.headers.get(
                    "content-type"
                ) || ""
            ).toLowerCase();


        if (!contentType.includes(
            "application/json"
        )) {

            const raw =
                await response.text();

            throw new Error(
                raw ||
                "Sunucudan JSON yerine farklı bir cevap geldi."
            );
        }


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data?.error ||
                `HTTP ${response.status}`
            );
        }


        if (
            !data ||
            typeof data.answer !==
                "string" ||
            !data.answer.trim()
        ) {

            throw new Error(
                "AI boş cevap döndürdü."
            );
        }


        hideLoading();


        addMessage(
            "assistant",
            data.answer
        );


        chatHistory.push({
            role: "assistant",
            content: data.answer
        });


    } catch (error) {

        hideLoading();


        addMessage(
            "assistant",
            "❌ " +
            (
                error instanceof Error
                    ? error.message
                    : "Bilinmeyen hata."
            )
        );


        console.error(
            "MY AI ERROR:",
            error
        );


    } finally {

        resetSendButton();
    }
}


// ============================================================
// FORM GÖNDERİMİ
// ============================================================

if (form) {

    form.addEventListener(
        "submit",
        event => {

            event.preventDefault();

            event.stopPropagation();

            if (sending) {
                return;
            }

            const text =
                input.value.trim();

            if (!text) {
                input.focus();
                return;
            }

            input.value = "";

            sendToAI(text);
        }
    );

}


// ============================================================
// ENTER / SHIFT+ENTER
// ============================================================

if (input) {

    input.addEventListener(
        "keydown",
        event => {

            if (
                event.key !==
                "Enter"
            ) {
                return;
            }


            // Shift + Enter:
            // Yeni satır bırak.
            if (event.shiftKey) {
                return;
            }


            // Enter:
            // Gönder.
            event.preventDefault();

            event.stopPropagation();


            if (sending) {
                return;
            }


            const text =
                input.value.trim();

            if (!text) {
                return;
            }


            input.value = "";

            sendToAI(text);

        }
    );

}


// ============================================================
// GÖNDER BUTONU
// ============================================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            event.stopPropagation();


            if (sending) {
                return;
            }


            const text =
                input.value.trim();

            if (!text) {
                input.focus();
                return;
            }


            input.value = "";

            sendToAI(text);

        }
    );

}


// ============================================================
// YENİ SOHBET
// ============================================================

if (newChatButton) {

    newChatButton.addEventListener(
        "click",
        event => {

            event.preventDefault();

            startNewChat();

        }
    );

}


// ============================================================
// BAŞLANGIÇ
// ============================================================

connectPromptButtons();

resetSendButton();
