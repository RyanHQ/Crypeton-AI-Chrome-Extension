document.getElementById("saveKey").addEventListener("click", () => {
    let apiKey = document.getElementById("apiKeyInput").value;
    chrome.storage.local.set({ openai_api_key: apiKey }, () => {  // ✅ Changed storage key
        document.getElementById("status").innerText = "API Key Saved!";
    });
});
