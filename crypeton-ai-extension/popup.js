document.addEventListener("DOMContentLoaded", () => {
    const apiKeyInput = document.getElementById("apiKeyInput");
    const saveApiKeyBtn = document.getElementById("saveApiKey");
    const apiKeyContainer = document.getElementById("apiKeyContainer");
    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const analyzePageBtn = document.getElementById("analyzePage");
    const resultText = document.getElementById("result");
    const showHistoryBtn = document.getElementById("showHistory");
    const historyContainer = document.getElementById("historyContainer");

    let storedPageSummary = "";
    let conversationHistory = [];

    // Load stored OpenAI API key and previous data
    chrome.storage.local.get(["openai_api_key", "page_summary", "ai_history"], (data) => {
        if (data.openai_api_key) {
            apiKeyContainer.style.display = "none";
        }
        if (data.page_summary) {
            storedPageSummary = data.page_summary;
        }
        if (data.ai_history) {
            conversationHistory = data.ai_history;
            updateHistoryDisplay();
        }
    });

    // Save API key
    saveApiKeyBtn.addEventListener("click", () => {
        let apiKey = apiKeyInput.value.trim();
        if (!apiKey.startsWith("sk-")) {
            alert("Invalid OpenAI API Key! Make sure it starts with 'sk-'");
            return;
        }

        chrome.storage.local.set({ openai_api_key: apiKey }, () => {
            alert("API Key Saved Successfully!");
            apiKeyContainer.style.display = "none";
        });
    });

    // Function to send request to OpenAI
    function sendToOpenAI(query) {
        resultText.innerText = "Thinking...";

        chrome.storage.local.get("openai_api_key", async (data) => {
            let apiKey = data.openai_api_key;
            if (!apiKey) {
                resultText.innerText = "API Key not set! Please enter it in settings.";
                return;
            }

            let fullQuery = query;
            if (storedPageSummary) {
                fullQuery = `The user is asking this in the context of a webpage they analyzed earlier. Here is the webpage summary: "${storedPageSummary}". Now, answer their question: "${query}"`;
            }

            try {
                let response = await fetch("https://api.openai.com/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: "gpt-3.5-turbo",
                        messages: [
                            { role: "system", content: "You are an AI assistant named Crypeton AI." },
                            { role: "user", content: fullQuery }
                        ]
                    })
                });

                let responseData = await response.json();
                console.log("OpenAI API Response:", responseData);

                if (responseData.error) {
                    resultText.innerText = "Error: " + responseData.error.message;
                    return;
                }

                let aiResponse = responseData.choices[0].message.content;
                resultText.innerText = aiResponse;

                // Save response to history
                conversationHistory.push({ question: query, answer: aiResponse });
                chrome.storage.local.set({ "ai_history": conversationHistory });

                updateHistoryDisplay();
            } catch (error) {
                console.error("Fetch Error:", error);
                resultText.innerText = "Error: API request failed!";
            }
        });
    }

    // Function to ensure `content.js` is loaded before sending a message
    function ensureContentScript(tabId, callback) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ["content.js"]
        }, () => {
            console.log("Injected content.js into tab:", tabId);
            callback();
        });
    }

    // Search button click event (Ask Anything)
    searchBtn.addEventListener("click", () => {
        let query = searchInput.value;
        if (!query) return;
        sendToOpenAI(query);
    });

    // Analyze Webpage button click event
    analyzePageBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            let tabId = tabs[0].id;

            ensureContentScript(tabId, () => {
                chrome.tabs.sendMessage(tabId, { action: "getPageContent" }, (response) => {
                    if (response && response.text) {
                        storedPageSummary = response.text;
                        chrome.storage.local.set({ "page_summary": storedPageSummary });

                        sendToOpenAI("Analyze this webpage: " + response.text);
                    } else {
                        resultText.innerText = "Error: Could not extract readable content from this page.";
                    }
                });
            });
        });
    });

    // Show conversation history
    showHistoryBtn.addEventListener("click", () => {
        historyContainer.style.display = historyContainer.style.display === "none" ? "block" : "none";
    });

    // Function to update history display
    function updateHistoryDisplay() {
        historyContainer.innerHTML = "<h3>Previous Responses</h3>";
        conversationHistory.forEach(entry => {
            let historyItem = document.createElement("div");
            historyItem.innerHTML = `<strong>Q:</strong> ${entry.question} <br><strong>A:</strong> ${entry.answer}<hr>`;
            historyContainer.appendChild(historyItem);
        });
    }
});
