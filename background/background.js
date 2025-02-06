chrome.runtime.onInstalled.addListener(() => {
  console.log('CloudTabs extension installed');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'getTabs') {
    chrome.tabs.query({ currentWindow: true }, tabs => {
      sendResponse(tabs.map(tab => ({ url: tab.url, title: tab.title })));
    });
    return true;
  }
});