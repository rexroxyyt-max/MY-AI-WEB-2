const form = document.getElementById("chatForm");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("send");
const modeSelect = document.getElementById("mode");
const historyBox = document.getElementById("history");
const newChatButton = document.getElementById("newChat");

let chatHistory = [];


// ============================================================
// GÜVENLİ HTML
// ============================================================

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text);
    return div.innerHTML;
}


// ============================================================
// MESAJ EKLE
// ============================================================

function addMessage(role, text) {

    const welcome = document.getElementById("welcome");

    if (welcome) {
        welcome.remove();
    }

    const message = document.createElement("div");

    message.className =
        role === "user"
            ? "message user"
            : "message ai";

    message.innerHTML = `
        <div class="message-title">
            ${role === "user" ? "You" : "⚡ MY AI"}
        </div>

        <div class="message-content">
            ${escapeHtml(text).replace(/\n/g, "<br>")}
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

    const loading = document.createElement("div");

    loading.id = "ai-loading";

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

    messages.appendChild(loading);

    messages.scrollTop =
        messages.scrollHeight;
}


function hideLoading() {

    const loading =
        document.getElementById("ai-loading");

    if (loading) {
        loading.remove();
    }
}


// ============================================================
// SON SOHBET
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

    item.addEventListener(
        "click",
        () => {
            input.focus();
        }
    );

    historyBox.prepend(item);
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
}


// ============================================================
// HIZLI PROMPTLAR
// ============================================================

function connectPromptButtons() {

    document
        .querySelectorAll("[data-prompt]")
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
// AI'YA SOR
// ============================================================

async function sendToAI(text) {

    addMessage(
        "user",
        text
    );

    chatHistory.push({
        role: "user",
        content: text
    });

    addHistory(text);

    showLoading();

    sendButton.disabled = true;

    sendButton.textContent =
        "...";

    try {

        const response =
            await fetch(
                "/api/chat",
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: text,

                        history:
                            chatHistory.slice(-20),

                        mode:
                            modeSelect.value
                    })
                }
            );

        const contentType =
            response.headers
                .get("content-type") || "";

        let data;

        if (
            contentType.includes(
                "application/json"
            )
        ) {

            data =
                await response.json();

        } else {

            const raw =
                await response.text();

            throw new Error(
                raw || "Sunucudan geçersiz cevap geldi."
            );

        }

        if (!response.ok) {

            throw new Error(
                data.error ||
                `HTTP ${response.status}`
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
            "❌ " + error.message
        );

        console.error(
            "MY AI ERROR:",
            error
        );

    } finally {

        sendButton.disabled =
            false;

        sendButton.textContent =
            "↑";

        input.focus();

    }
}


// ============================================================
// FORM
// ============================================================

form.addEventListener(
    "submit",
    event => {

        event.preventDefault();

        const text =
            input.value.trim();

        if (!text) {
            return;
        }

        input.value = "";

        sendToAI(text);

    }
);


// ============================================================
// ENTER / SHIFT+ENTER
// ============================================================

input.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            form.requestSubmit();

        }

    }
);


// ============================================================
// YENİ SOHBET BUTONU
// ============================================================

newChatButton.addEventListener(
    "click",
    startNewChat
);


// ============================================================
// BAŞLANGIÇ PROMPTLARI
// ============================================================

connectPromptButtons();

input.focus();
