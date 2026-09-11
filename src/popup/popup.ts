import { getBookmarkByUrl, saveBookmark, deleteBookmark, getTagStats } from '../db';
import { Bookmark } from '../db/schema';
import { renderMarkdown } from '../utils/markdown';
import { getLocale, setLocale, t, Locale } from '../utils/i18n';

const form = document.getElementById('bookmark-form') as HTMLFormElement;
const inputId = document.getElementById('bookmark-id') as HTMLInputElement;
const inputUrl = document.getElementById('url') as HTMLInputElement;
const inputTitle = document.getElementById('title') as HTMLInputElement;
const inputNotes = document.getElementById('notes') as HTMLTextAreaElement;
const inputTags = document.getElementById('tags-input') as HTMLInputElement;
const checkUnread = document.getElementById('unread') as HTMLInputElement;
const checkArchived = document.getElementById('archived') as HTMLInputElement;
const btnDelete = document.getElementById('btn-delete') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnOpenManager = document.getElementById('btn-open-manager') as HTMLButtonElement;
const btnLang = document.getElementById('btn-lang') as HTMLButtonElement;
const statusPill = document.getElementById('status-pill') as HTMLElement;
const tagSuggestions = document.getElementById('tag-suggestions') as HTMLElement;

const labelNotes = document.getElementById('label-notes') as HTMLElement;
const labelUnread = document.getElementById('label-unread') as HTMLElement;
const labelArchived = document.getElementById('label-archived') as HTMLElement;
const tabWrite = document.getElementById('tab-write') as HTMLButtonElement;
const tabPreview = document.getElementById('tab-preview') as HTMLButtonElement;
const notesPreview = document.getElementById('notes-preview') as HTMLElement;

let currentBookmark: Bookmark | null = null;
let currentLocale: Locale = 'en';

function parseTags(tagStr: string): string[] {
  return tagStr
    .split(/[\s,，]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);
}

function updateTexts() {
  btnLang.textContent = currentLocale === 'en' ? 'EN' : '中';
  inputTitle.placeholder = t('popup_title_placeholder', currentLocale);
  labelNotes.textContent = currentLocale === 'en' ? 'Notes' : '笔记';
  tabWrite.textContent = t('popup_notes_tab_write', currentLocale);
  tabPreview.textContent = t('popup_notes_tab_preview', currentLocale);
  inputNotes.placeholder = t('popup_notes_placeholder', currentLocale);
  inputTags.placeholder = t('popup_tags_placeholder', currentLocale);
  labelUnread.textContent = t('popup_unread', currentLocale);
  labelArchived.textContent = t('popup_archived', currentLocale);

  if (currentBookmark) {
    btnSave.textContent = t('popup_update', currentLocale);
  } else {
    btnSave.textContent = t('popup_save', currentLocale);
  }
}

btnLang.addEventListener('click', async () => {
  currentLocale = currentLocale === 'en' ? 'zh_CN' : 'en';
  await setLocale(currentLocale);
  updateTexts();
});

function toggleTagInInput(tag: string) {
  const currentTags = parseTags(inputTags.value);
  const index = currentTags.indexOf(tag.toLowerCase());
  if (index >= 0) {
    currentTags.splice(index, 1);
  } else {
    currentTags.push(tag.toLowerCase());
  }
  inputTags.value = currentTags.join(' ');
  updateTagSuggestionPills();
}

async function renderTagSuggestions(existingTags: string[]) {
  const topStats = await getTagStats();
  tagSuggestions.innerHTML = '';
  if (topStats.length === 0) return;

  const activeTags = new Set(existingTags.map(t => t.toLowerCase()));

  topStats.slice(0, 6).forEach(stat => {
    const pill = document.createElement('button');
    pill.type = 'button';
    const isSelected = activeTags.has(stat.name.toLowerCase());
    pill.className = `px-1.5 py-0.5 text-[10px] rounded transition-colors ${
      isSelected
        ? 'bg-zinc-800 text-white font-medium'
        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
    }`;
    pill.textContent = `#${stat.name}`;
    pill.addEventListener('click', () => toggleTagInInput(stat.name));
    tagSuggestions.appendChild(pill);
  });
}

function updateTagSuggestionPills() {
  const currentTags = new Set(parseTags(inputTags.value));
  tagSuggestions.querySelectorAll('button').forEach(pill => {
    const tag = (pill.textContent || '').replace(/^#/, '').toLowerCase();
    if (currentTags.has(tag)) {
      pill.className = 'px-1.5 py-0.5 text-[10px] rounded transition-colors bg-zinc-800 text-white font-medium';
    } else {
      pill.className = 'px-1.5 py-0.5 text-[10px] rounded transition-colors bg-zinc-100 text-zinc-600 hover:bg-zinc-200';
    }
  });
}

// Markdown tabs
tabWrite.addEventListener('click', () => {
  tabWrite.className = 'px-1.5 py-0.5 rounded text-zinc-800 font-medium bg-white shadow-2xs';
  tabPreview.className = 'px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-700';
  inputNotes.classList.remove('hidden');
  notesPreview.classList.add('hidden');
});

tabPreview.addEventListener('click', () => {
  tabPreview.className = 'px-1.5 py-0.5 rounded text-zinc-800 font-medium bg-white shadow-2xs';
  tabWrite.className = 'px-1.5 py-0.5 rounded text-zinc-400 hover:text-zinc-700';
  notesPreview.innerHTML = renderMarkdown(inputNotes.value) || `<p class="text-zinc-300 italic text-[11px]">${t('popup_notes_empty', currentLocale)}</p>`;
  inputNotes.classList.add('hidden');
  notesPreview.classList.remove('hidden');
});

inputTags.addEventListener('input', updateTagSuggestionPills);

async function init() {
  currentLocale = await getLocale();
  updateTexts();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    inputUrl.value = tab.url;
    inputTitle.value = tab.title || tab.url;

    const existing = await getBookmarkByUrl(tab.url);
    if (existing) {
      currentBookmark = existing;
      inputId.value = existing.id;
      inputUrl.value = existing.url;
      inputTitle.value = existing.title;
      inputNotes.value = existing.notes || '';
      inputTags.value = existing.tags.join(' ');
      checkUnread.checked = existing.unread;
      checkArchived.checked = existing.archived;

      statusPill.classList.remove('hidden');
      statusPill.textContent = t('popup_already_saved', currentLocale);
      btnDelete.classList.remove('hidden');
      btnSave.textContent = t('popup_update', currentLocale);

      await renderTagSuggestions(existing.tags);
    } else {
      await renderTagSuggestions([]);
    }

    // Auto capture selected text
    if (tab.id && tab.url.startsWith('http')) {
      try {
        const [injection] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => window.getSelection()?.toString().trim() || ''
        });
        const selected = injection?.result;
        if (selected) {
          const quote = `> ${selected}`;
          if (inputNotes.value) {
            if (!inputNotes.value.includes(selected)) {
              inputNotes.value = `${inputNotes.value}\n\n${quote}`;
            }
          } else {
            inputNotes.value = quote;
          }

          statusPill.classList.remove('hidden');
          statusPill.textContent = t('popup_captured_selection', currentLocale);
        }
      } catch {
        // Ignore restricted tabs
      }
    }

    inputTitle.focus();
    inputTitle.select();
  } catch (err) {
    console.error('Failed to initialize popup', err);
  }
}

// Save
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = inputUrl.value.trim();
  const title = inputTitle.value.trim();
  if (!url) return;

  btnSave.disabled = true;
  btnSave.textContent = t('popup_saving', currentLocale);

  try {
    await saveBookmark({
      id: inputId.value || undefined,
      url,
      title: title || url,
      description: '',
      notes: inputNotes.value,
      tags: parseTags(inputTags.value),
      unread: checkUnread.checked,
      archived: checkArchived.checked,
      createdAt: currentBookmark?.createdAt,
    });

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.action.setBadgeText({ text: '✓', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#18181b', tabId: tab.id });
    }

    btnSave.textContent = t('popup_saved', currentLocale);
    setTimeout(() => window.close(), 350);
  } catch (err) {
    console.error('Failed to save bookmark', err);
    btnSave.disabled = false;
    btnSave.textContent = currentBookmark ? t('popup_update', currentLocale) : t('popup_save', currentLocale);
  }
});

// Delete
btnDelete.addEventListener('click', async () => {
  if (!inputId.value) return;
  try {
    await deleteBookmark(inputId.value);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
    window.close();
  } catch (err) {
    console.error('Failed to delete bookmark', err);
  }
});

btnOpenManager.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') });
});

// Shortcuts
window.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
    e.preventDefault();
    form.requestSubmit();
  } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
    e.preventDefault();
    btnOpenManager.click();
  } else if (e.key === 'Escape') {
    window.close();
  }
});

document.addEventListener('DOMContentLoaded', init);
