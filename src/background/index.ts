import { getBookmarkByUrl, saveBookmark } from '../db';
import { getLocale, t, Locale } from '../utils/i18n';

async function setupContextMenus(locale?: Locale) {
  const currentLocale = locale || await getLocale();

  chrome.contextMenus.removeAll(() => {
    // Save page
    chrome.contextMenus.create({
      id: 'keepding-save-page',
      title: t('menu_save_page', currentLocale),
      contexts: ['page']
    });

    // Save selected text
    chrome.contextMenus.create({
      id: 'keepding-save-selection',
      title: t('menu_save_selection', currentLocale),
      contexts: ['selection']
    });

    // Save image
    chrome.contextMenus.create({
      id: 'keepding-save-image',
      title: t('menu_save_image', currentLocale),
      contexts: ['image']
    });

    // Save link
    chrome.contextMenus.create({
      id: 'keepding-save-link',
      title: t('menu_save_link', currentLocale),
      contexts: ['link']
    });

    // Open manager
    chrome.contextMenus.create({
      id: 'keepding-open-manager',
      title: t('menu_open_manager', currentLocale),
      contexts: ['action']
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  setupContextMenus();
});

chrome.runtime.onStartup.addListener(() => {
  setupContextMenus();
});

// Listen for locale changes
chrome.runtime.onMessage.addListener((message) => {
  if (message && message.type === 'LOCALE_CHANGED') {
    setupContextMenus(message.locale);
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local' && changes.keepding_locale) {
    setupContextMenus(changes.keepding_locale.newValue);
  }
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
        title: tab.title || pageUrl || 'Text clip',
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
        title: tab.title || 'Image clip',
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
