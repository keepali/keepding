import { getBookmarkByUrl, saveBookmark } from '../db';

chrome.runtime.onInstalled.addListener(() => {
  // Save page
  chrome.contextMenus.create({
    id: 'keepding-save-page',
    title: '收藏此网页',
    contexts: ['page']
  });

  // Save selected text (Google Keep style)
  chrome.contextMenus.create({
    id: 'keepding-save-selection',
    title: '收藏选中文本到笔记',
    contexts: ['selection']
  });

  // Save image
  chrome.contextMenus.create({
    id: 'keepding-save-image',
    title: '收藏图片到笔记',
    contexts: ['image']
  });

  // Save link
  chrome.contextMenus.create({
    id: 'keepding-save-link',
    title: '收藏此链接',
    contexts: ['link']
  });

  // Open manager
  chrome.contextMenus.create({
    id: 'keepding-open-manager',
    title: '打开管理面板',
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
  if (!tab || !tab.id) return;
  const pageUrl = info.pageUrl || tab.url || '';

  if (info.menuItemId === 'keepding-save-selection') {
    const selectedText = (info.selectionText || '').trim();
    if (!selectedText) return;

    const quote = `> ${selectedText}`;
    const existing = pageUrl ? await getBookmarkByUrl(pageUrl) : undefined;

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
        url: pageUrl,
        title: tab.title || pageUrl || '文本摘录',
        description: '',
        notes: quote,
        tags: [],
        unread: true,
        archived: false
      });
    }

    flashBadge(tab.id, '✓');
  } else if (info.menuItemId === 'keepding-save-image' && info.srcUrl) {
    const imageUrl = info.srcUrl.trim();
    const existing = pageUrl ? await getBookmarkByUrl(pageUrl) : undefined;

    if (existing) {
      const currentImages = existing.images || [];
      const updatedImages = currentImages.includes(imageUrl) ? currentImages : [...currentImages, imageUrl];
      const imageMd = `![](${imageUrl})`;
      const updatedNotes = existing.notes ? `${existing.notes}\n\n${imageMd}` : imageMd;

      await saveBookmark({
        ...existing,
        images: updatedImages,
        notes: updatedNotes,
      });
    } else {
      await saveBookmark({
        url: pageUrl,
        title: tab.title || '图片收藏',
        description: '',
        notes: `![](${imageUrl})`,
        images: [imageUrl],
        tags: ['images'],
        unread: true,
        archived: false
      });
    }

    flashBadge(tab.id, '✓');
  } else if (info.menuItemId === 'keepding-save-link' && info.linkUrl) {
    const linkUrl = info.linkUrl.trim();
    const existing = await getBookmarkByUrl(linkUrl);
    if (!existing) {
      await saveBookmark({
        url: linkUrl,
        title: linkUrl,
        description: '',
        notes: '',
        tags: [],
        unread: true,
        archived: false
      });
    }
    flashBadge(tab.id, '✓');
  } else if (info.menuItemId === 'keepding-save-page' && pageUrl) {
    const existing = await getBookmarkByUrl(pageUrl);
    if (!existing) {
      await saveBookmark({
        url: pageUrl,
        title: tab.title || pageUrl,
        description: '',
        notes: '',
        tags: [],
        unread: true,
        archived: false
      });
    }
    flashBadge(tab.id, '✓');
  } else if (info.menuItemId === 'keepding-open-manager') {
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
