const form = document.getElementById("chatForm");
const input = document.getElementById("input");
const messages = document.getElementById("messages");
const sendButton = document.getElementById("send");
const modeSelect = document.getElementById("mode");
const historyBox = document.getElementById("history");
const newChatButton = document.getElementById("newChat");

const webButton = document.getElementById("webButton");
const fileInput = document.getElementById("fileInput");
const imageInput = document.getElementById("imageInput");
const attachmentStatus =
    document.getElementById("attachmentStatus");

const STORAGE_KEY = "myai_chats_v2";

let chats = loadChats();
let currentChatId = null;
let sending = false;

let attachment = null;
let webSearchEnabled = false;


function loadChats() {
    try {
        const data =
            JSON.parse(
                localStorage.getItem(STORAGE_KEY) || "[]"
            );

        return Array.isArray(data)
            ? data
            : [];
    } catch {
        return [];
    }
}


function saveChats() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(chats)
    );
}


function getCurrentChat() {
    return chats.find(
        chat => chat.id === currentChatId
    );
}


function createChat() {
    const chat = {
        id:
            Date.now().toString() +
            Math.random().toString(16).slice(2),

        title: "Yeni sohbet",

        messages: [],

        updatedAt: Date.now()
    };

    chats.unshift(chat);

    currentChatId = chat.id;

    saveChats();
    renderHistory();
    renderChat();

    return chat;
}


function escapeHtml(text) {
    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;
}


function renderHistory() {
    historyBox.innerHTML = "";

    const sorted = [...chats].sort(
        (a, b) =>
            b.updatedAt - a.updatedAt
    );

    for (const chat of sorted) {

        const row =
            document.createElement("div");

        row.className =
            "history-item" +
            (
                chat.id === currentChatId
                    ? " active"
                    : ""
            );

        const title =
            document.createElement("span");

        title.textContent =
            chat.title;

        const deleteButton =
            document.createElement("button");

        deleteButton.className =
            "history-delete";

        deleteButton.textContent = "×";

        deleteButton.addEventListener(
            "click",
            event => {
                event.stopPropagation();

                chats =
                    chats.filter(
                        item =>
                            item.id !== chat.id
                    );

                if (
                    currentChatId === chat.id
                ) {
                    currentChatId =
                        chats[0]?.id || null;
                }

                saveChats();

                if (!currentChatId) {
                    createChat();
                } else {
                    renderHistory();
                    renderChat();
                }
            }
        );

        row.appendChild(title);
        row.appendChild(deleteButton);

        row.addEventListener(
            "click",
            () => {
                currentChatId =
                    chat.id;

                renderHistory();
                renderChat();

                input.focus();
            }
        );

        historyBox.appendChild(row);
    }
}


function renderChat() {

    const chat =
        getCurrentChat();

    if (
        !chat ||
        chat.messages.length === 0
    ) {
        renderWelcome();
        return;
    }

    messages.innerHTML = "";

    for (
        const message
        of chat.messages
    ) {
        renderMessage(
            message.role,
            message.content
        );
    }

    messages.scrollTop =
        messages.scrollHeight;
}


function renderWelcome() {

    messages.innerHTML = `
        <div class="welcome" id="welcome">

            <div class="welcome-logo">
                ⚡
            </div>

            <h1>
                What can I help you with?
            </h1>

            <p>
                School, coding, study,
                research veya aklına gelen başka bir şey.
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

    connectPromptButtons();
}


function renderMessage(
    role,
    content
) {
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
                escapeHtml(content)
                    .replace(/\n/g, "<br>")
            }
        </div>
    `;

    messages.appendChild(message);
}


function addMessage(
    role,
    content
) {
    const chat =
        getCurrentChat();

    if (!chat) {
        return;
    }

    chat.messages.push({
        role,
        content
    });

    chat.updatedAt =
        Date.now();

    if (
        role === "user" &&
        chat.title === "Yeni sohbet"
    ) {
        chat.title =
            content.length > 40
                ? content.slice(0, 40) + "..."
                : content;
    }

    saveChats();

    renderMessage(
        role,
        content
    );

    renderHistory();

    messages.scrollTop =
        messages.scrollHeight;
}


function showLoading() {

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

    document
        .getElementById(
            "ai-loading"
        )
        ?.remove();
}


function fileToBase64(file) {

    return new Promise(
        (resolve, reject) => {

            const reader =
                new FileReader();

            reader.onload = () => {

                const result =
                    String(reader.result);

                resolve(result);
            };

            reader.onerror =
                reject;

            reader.readAsDataURL(
                file
            );
        }
    );
}


async function prepareFile(file) {

    if (!file) {
        return;
    }

    if (file.size > 4 * 1024 * 1024) {

        alert(
            "Şimdilik 4 MB'dan küçük dosyalar kullan."
        );

        return;
    }

    const dataUrl =
        await fileToBase64(file);

    attachment = {
        name: file.name,
        type: file.type,
        data: dataUrl
    };

    attachmentStatus.textContent =
        `📎 ${file.name}`;

    input.focus();
}


webButton.addEventListener(
    "click",
    () => {

        webSearchEnabled =
            !webSearchEnabled;

        webButton.classList.toggle(
            "active",
            webSearchEnabled
        );

        webButton.textContent =
            webSearchEnabled
                ? "🌐 Web Açık"
                : "🌐 Web Search";

        input.focus();
    }
);


fileInput.addEventListener(
    "change",
    async () => {

        await prepareFile(
            fileInput.files?.[0]
        );

        fileInput.value = "";
    }
);


imageInput.addEventListener(
    "change",
    async () => {

        const file =
            imageInput.files?.[0];

        if (!file) {
            return;
        }

        if (file.size > 4 * 1024 * 1024) {

            alert(
                "Şimdilik 4 MB'dan küçük görseller kullan."
            );

            return;
        }

        const dataUrl =
            await fileToBase64(file);

        attachment = {
            name: file.name,
            type: file.type,
            data: dataUrl,
            image: true
        };

        attachmentStatus.textContent =
            `🖼 ${file.name}`;

        input.focus();
    }
);


function clearAttachment() {

    attachment = null;

    attachmentStatus.textContent =
        "";
}


async function sendToAI(text) {

    if (sending) {
        return;
    }

    let chat =
        getCurrentChat();

    if (!chat) {
        chat =
            createChat();
    }

    const userText =
        attachment
            ? `${text}\n\n[Ek: ${attachment.name}]`
            : text;

    addMessage(
        "user",
        userText
    );

    showLoading();

    sending = true;

    sendButton.disabled =
        true;

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

                    body:
                        JSON.stringify({
                            message: text,

                            history:
                                chat.messages.slice(
                                    -20
                                ),

                            mode:
                                modeSelect.value,

                            webSearch:
                                webSearchEnabled,

                            attachment:
                                attachment
                        })
                }
            );

        const contentType =
            response.headers.get(
                "content-type"
            ) || "";

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
                raw ||
                "Sunucudan geçersiz cevap geldi."
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

        clearAttachment();

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

    } finally {

        sending = false;

        sendButton.disabled =
            false;

        sendButton.textContent =
            "↑";

        input.focus();
    }
}


function connectPromptButtons() {

    document
        .querySelectorAll(
            "[data-prompt]"
        )
        .forEach(button => {

            button.onclick =
                () => {

                    input.value =
                        button.dataset.prompt;

                    input.focus();
                };
        });
}


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


newChatButton.addEventListener(
    "click",
    () => {
        createChat();

        clearAttachment();

        input.value = "";

        input.focus();
    }
);


if (chats.length === 0) {
    createChat();
} else {

    currentChatId =
        chats[0].id;

    renderHistory();
    renderChat();
}
