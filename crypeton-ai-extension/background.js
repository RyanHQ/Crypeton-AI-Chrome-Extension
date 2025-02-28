chrome.action.onClicked.addListener((tab) => {
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: openSidebar
    });
});

// Function to open Crypeton AI as a sidebar
function openSidebar() {
    let sidebar = document.getElementById("crypetonSidebar");
    
    if (sidebar) {
        sidebar.remove(); // Close if already open
        return;
    }

    sidebar = document.createElement("iframe");
    sidebar.id = "crypetonSidebar";
    sidebar.src = chrome.runtime.getURL("popup.html");
    sidebar.style.position = "fixed";
    sidebar.style.top = "0";
    sidebar.style.right = "0";
    sidebar.style.width = "350px";
    sidebar.style.height = "100%";
    sidebar.style.border = "none";
    sidebar.style.zIndex = "10000";
    sidebar.style.backgroundColor = "white";
    sidebar.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    
    document.body.appendChild(sidebar);
}
