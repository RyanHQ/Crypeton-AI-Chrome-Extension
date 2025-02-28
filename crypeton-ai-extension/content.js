// Extract visible text from the webpage
function getVisibleText() {
    let elements = document.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, div");
    let text = "";

    elements.forEach(el => {
        let computedStyle = window.getComputedStyle(el);
        if (
            computedStyle.display !== "none" &&
            computedStyle.visibility !== "hidden" &&
            el.offsetWidth > 0 &&
            el.offsetHeight > 0 &&
            el.innerText.trim().length > 10
        ) {
            text += el.innerText + " ";
        }
    });

    return text.trim().slice(0, 5000);
}

// Extract text from iframes
async function extractIframeText() {
    let iframeText = "";
    let iframes = document.querySelectorAll("iframe");

    for (let iframe of iframes) {
        try {
            let doc = iframe.contentDocument || iframe.contentWindow.document;
            if (doc) {
                let elements = doc.querySelectorAll("p, h1, h2, h3, h4, h5, h6, span, div");
                elements.forEach(el => {
                    if (el.innerText.trim().length > 10) {
                        iframeText += el.innerText + " ";
                    }
                });
            }
        } catch (error) {
            console.warn("Iframe text extraction blocked:", error);
        }
    }

    return iframeText.trim();
}

// Listen for messages from popup.js
chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (request.action === "getPageContent") {
        let pageText = getVisibleText();
        let iframeText = await extractIframeText();

        let fullText = (pageText + " " + iframeText).trim();
        console.log("Extracted Content:", fullText);

        if (fullText.length === 0) {
            sendResponse({ error: "No readable content extracted" });
        } else {
            sendResponse({ text: fullText });
        }
    }
});
