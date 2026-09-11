import { getBookmarkByUrl, saveBookmark, deleteBookmark, getTagStats } from '../db';
import { Bookmark } from '../db/schema';
import { renderMarkdown } from '../utils/markdown';

const form = document.getElementById('bookmark-form') as HTMLFormElement;
const inputId = document.getElementById('bookmark-id') as HTMLInputElement;
const inputUrl = document.getElementById('url') as HTMLInputElement;
const inputTitle = document.getElementById('title') as HTMLInputElement;
const inputDescription = document.getElementById('description') as HTMLTextAreaElement;
const inputNotes = document.getElementById('notes') as HTMLTextAreaElement;
const inputTags = document.getElementById('tags-input') as HTMLInputElement;
const checkUnread = document.getElementById('unread') as HTMLInputElement;
const checkArchived = document.getElementById('archived') as HTMLInputElement;
const btnDelete = document.getElementById('btn-delete') as HTMLButtonElement;
const btnSave = document.getElementById('btn-save') as HTMLButtonElement;
const btnOpenManager = document.getElementById('btn-open-manager') as HTMLButtonElement;
const statusBadge = document.getElementById('status-badge') as HTMLElement;
const alertBanner = document.getElementById('alert-banner') as HTMLElement;
const btnTogglePreview = document.getElementById('btn-toggle-notes-preview') as HTMLButtonElement;
const notesEditContainer = document.getElementById('notes-edit-container') as HTMLElement;
const notesPreviewContainer = document.getElementById('notes-preview-container') as HTMLElement;
const tagSuggestions = document.getElementById('tag-suggestions') as HTMLElement;

let isPreviewingNotes = false;
let currentExistingBookmark: Bookmark | null = null;

function showAlert(message: string, type: 'success' | 'error' = 'success') {
  alertBanner.textContent = message;
  alertBanner.className = `my-2 p-2 rounded text-xs ${
    type === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-red-100 text-red-800 border border-red-200'
  }`;
  alertBanner.classList.remove('hidden');
}

function parseTags(tagStr: string): string[] {
  return tagStr
    .split(/[\s,，]+/)
    .map(t => t.trim().toLowerCase())
    .filter(t => t.length > 0);
}

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

  const activeTags = new Set(existingTags.map(t => t.toLowerCase()));

  // Show top 8 tags
  const tagsToShow = topStats.slice(0, 8);
  if (tagsToShow.length === 0) return;

  tagsToShow.forEach(stat => {
    const pill = document.createElement('button');
    pill.type = 'button';
    const isSelected = activeTags.has(stat.name.toLowerCase());
    pill.className = `px-2 py-0.5 text-[11px] rounded-full border transition-colors ${
      isSelected
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-medium'
        : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
    }`;
    pill.textContent = `#${stat.name}`;
    pill.addEventListener('click', () => {
      toggleTagInInput(stat.name);
    });
    tagSuggestions.appendChild(pill);
  });
}

function updateTagSuggestionPills() {
  const currentTags = new Set(parseTags(inputTags.value));
  const pills = tagSuggestions.querySelectorAll('button');
  pills.forEach(pill => {
    const tag = (pill.textContent || '').replace(/^#/, '').toLowerCase();
    if (currentTags.has(tag)) {
      pill.className = 'px-2 py-0.5 text-[11px] rounded-full border transition-colors bg-emerald-100 text-emerald-800 border-emerald-300 font-medium';
    } else {
      pill.className = 'px-2 py-0.5 text-[11px] rounded-full border transition-colors bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200';
    }
  });
}

async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      showAlert('无法读取当前标签页地址', 'error');
      return;
    }

    const url = tab.url;
    const title = tab.title || url;

    inputUrl.value = url;
    inputTitle.value = title;

    // Check if already in DB
    const existing = await getBookmarkByUrl(url);
    if (existing) {
      currentExistingBookmark = existing;
      inputId.value = existing.id;
      inputUrl.value = existing.url;
      inputTitle.value = existing.title;
      inputDescription.value = existing.description || '';
      inputNotes.value = existing.notes || '';
      inputTags.value = existing.tags.join(' ');
      checkUnread.checked = existing.unread;
      checkArchived.checked = existing.archived;

      statusBadge.classList.remove('hidden');
      statusBadge.textContent = '已在收藏库中';
      btnSave.querySelector('span')!.textContent = '更新书签';
      btnDelete.classList.remove('hidden');

      await renderTagSuggestions(existing.tags);
    } else {
      await renderTagSuggestions([]);
    }
  } catch (err) {
    console.error('Init popup failed', err);
  }
}

// Notes preview toggle
btnTogglePreview.addEventListener('click', () => {
  isPreviewingNotes = !isPreviewingNotes;
  if (isPreviewingNotes) {
    notesPreviewContainer.innerHTML = renderMarkdown(inputNotes.value) || '<p class="text-slate-400 italic">暂无笔记内容</p>';
    notesEditContainer.classList.add('hidden');
    notesPreviewContainer.classList.remove('hidden');
    btnTogglePreview.textContent = '编辑';
  } else {
    notesEditContainer.classList.remove('hidden');
    notesPreviewContainer.classList.add('hidden');
    btnTogglePreview.textContent = '预览';
  }
});

// Input tags change listener for pills
inputTags.addEventListener('input', () => {
  updateTagSuggestionPills();
});

// Form submit
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const url = inputUrl.value.trim();
  const title = inputTitle.value.trim();
  if (!url) return;

  btnSave.disabled = true;
  btnSave.querySelector('span')!.textContent = '保存中...';

  try {
    await saveBookmark({
      id: inputId.value || undefined,
      url,
      title: title || url,
      description: inputDescription.value.trim(),
      notes: inputNotes.value,
      tags: parseTags(inputTags.value),
      unread: checkUnread.checked,
      archived: checkArchived.checked,
      createdAt: currentExistingBookmark?.createdAt,
    });

    // Update active tab badge
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.action.setBadgeText({ text: '★', tabId: tab.id });
      chrome.action.setBadgeBackgroundColor({ color: '#2563eb', tabId: tab.id });
    }

    showAlert('书签保存成功！', 'success');

    setTimeout(() => {
      window.close();
    }, 600);
  } catch (err: any) {
    console.error('Save bookmark failed', err);
    showAlert(`保存失败: ${err.message || '未知错误'}`, 'error');
    btnSave.disabled = false;
    btnSave.querySelector('span')!.textContent = inputId.value ? '更新书签' : '保存书签';
  }
});

// Delete bookmark
btnDelete.addEventListener('click', async () => {
  if (!inputId.value) return;
  if (!confirm('确定要删除此书签吗？')) return;

  try {
    await deleteBookmark(inputId.value);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      chrome.action.setBadgeText({ text: '', tabId: tab.id });
    }
    showAlert('书签已删除', 'success');
    setTimeout(() => {
      window.close();
    }, 500);
  } catch (err: any) {
    showAlert(`删除失败: ${err.message}`, 'error');
  }
});

// Open manager
btnOpenManager.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('src/manager/index.html') });
});

// Keyboard shortcut (Ctrl+Enter / Cmd+Enter)
window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    form.requestSubmit();
  }
});

document.addEventListener('DOMContentLoaded', init);
