import { getBookmarkByUrl, saveBookmark } from '../db';

chrome.runtime.onInstalled.addListener(() => {
  // Context menus
  chrome.contextMenus.create({
    id: 'linkding-save-page',
    title: '收藏此网页到 Linkding',
    contexts: ['page']
  });

  chrome.contextMenus.create({
    id: 'linkding-open-manager',
    title: '打开 Linkding 书签管理面板',
    contexts: ['action']
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'linkding-save-page' && tab && tab.url) {
    await saveBookmark({
      url: tab.url,
      title: tab.title || tab.url,
      description: '',
      notes: '',
      tags: ['quick-save'],
      unread: true,
      archived: false
    });
    // Set brief badge notification
    if (tab.id) {
      chrome.action.setBadgeText({ text: 'OK', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#16a34a', tabId: tab.id });
      setTimeout(() => {
        if (tab.id) chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }, 2000);
    }
  } else if (info.menuItemId === 'linkding-open-manager') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') });
  }
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-manager') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') });
  }
});

// Update badge when tab updates
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    try {
      const bm = await getBookmarkByUrl(tab.url);
      if (bm) {
        chrome.action.setBadgeText({ text: '★', tabId });
        chrome.action.setBadgeBackgroundColor({ color: '#2563eb', tabId });
      } else {
        chrome.action.setBadgeText({ text: '', tabId });
      }
    } catch {
      // ignore
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && tab.url.startsWith('http')) {
      const bm = await getBookmarkByUrl(tab.url);
      if (bm) {
        chrome.action.setBadgeText({ text: '★', tabId: tab.id });
        chrome.action.setBadgeBackgroundColor({ color: '#2563eb', tabId: tab.id });
      } else {
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }
    }
  } catch {
    // ignore
  }
});
