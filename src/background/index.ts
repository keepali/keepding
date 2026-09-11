import { getBookmarkByUrl, saveBookmark } from '../db';

chrome.runtime.onInstalled.addListener(() => {
  // Context menu for page
  chrome.contextMenus.create({
    id: 'pinscribe-save-page',
    title: '收藏此网页',
    contexts: ['page']
  });

  // Context menu for selected text (similar to Google Keep "Save to Keep")
  chrome.contextMenus.create({
    id: 'pinscribe-save-selection',
    title: '保存选中内容到笔记',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: 'pinscribe-open-manager',
    title: '打开书签管理面板',
    contexts: ['action']
  });
});

function flashBadge(tabId: number, text: string = '✓') {
  chrome.action.setBadgeText({ text, tabId });
  chrome.action.setBadgeBackgroundColor({ color: '#18181b', tabId });
  setTimeout(() => {
    chrome.action.setBadgeText({ text: '', tabId });
  }, 2200);
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.url || !tab.id) return;

  if (info.menuItemId === 'pinscribe-save-selection') {
    const selectedText = (info.selectionText || '').trim();
    if (!selectedText) return;

    const quote = `> ${selectedText}`;
    const existing = await getBookmarkByUrl(tab.url);

    if (existing) {
      const mergedNotes = existing.notes
        ? `${existing.notes}\n\n${quote}`
        : quote;

      await saveBookmark({
        ...existing,
        notes: mergedNotes,
      });
    } else {
      await saveBookmark({
        url: tab.url,
        title: tab.title || tab.url,
        description: '',
        notes: quote,
        tags: [],
        unread: true,
        archived: false
      });
    }

    flashBadge(tab.id, '✓');
  } else if (info.menuItemId === 'pinscribe-save-page') {
    const existing = await getBookmarkByUrl(tab.url);
    if (!existing) {
      await saveBookmark({
        url: tab.url,
        title: tab.title || tab.url,
        description: '',
        notes: '',
        tags: [],
        unread: true,
        archived: false
      });
    }
    flashBadge(tab.id, '✓');
  } else if (info.menuItemId === 'pinscribe-open-manager') {
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
        chrome.action.setBadgeBackgroundColor({ color: '#71717a', tabId });
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
        chrome.action.setBadgeBackgroundColor({ color: '#71717a', tabId: tab.id });
      } else {
        chrome.action.setBadgeText({ text: '', tabId: tab.id });
      }
    }
  } catch {
    // ignore
  }
});
