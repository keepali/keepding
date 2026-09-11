import {
  getAllBookmarks,
  saveBookmark,
  deleteBookmark,
  toggleUnread,
  toggleArchived,
  getTagStats,
  bulkImportBookmarks
} from '../db';
import { Bookmark, BookmarkFilter } from '../db/schema';
import { filterBookmarks } from '../services/search';
import { exportToJSON, exportToNetscapeHTML, downloadFile } from '../services/exporter';
import { parseJSONImport, parseHTMLBookmarks } from '../services/importer';
import { renderMarkdown } from '../utils/markdown';
import { getDomain, formatTimeAgo, copyToClipboard } from '../utils/helpers';

// State
let bookmarks: Bookmark[] = [];
let activeFilter: BookmarkFilter = 'all';
let selectedTags: string[] = [];
let searchQuery: string = '';
let sortOrder: 'date_desc' | 'date_asc' | 'title_asc' = 'date_desc';
let expandedNotes = new Set<string>();

// DOM Elements
const searchInput = document.getElementById('search-input') as HTMLInputElement;
const btnClearSearch = document.getElementById('btn-clear-search') as HTMLButtonElement;
const sortSelect = document.getElementById('sort-select') as HTMLSelectElement;
const bookmarksContainer = document.getElementById('bookmarks-container') as HTMLElement;
const emptyState = document.getElementById('empty-state') as HTMLElement;
const viewTitle = document.getElementById('view-title') as HTMLElement;
const viewCount = document.getElementById('view-count') as HTMLElement;
const activeTagPills = document.getElementById('active-tag-pills') as HTMLElement;
const tagsList = document.getElementById('tags-list') as HTMLElement;
const btnClearTags = document.getElementById('btn-clear-tags') as HTMLButtonElement;

// Sidebar counts
const countAll = document.getElementById('count-all') as HTMLElement;
const countUnread = document.getElementById('count-unread') as HTMLElement;
const countArchived = document.getElementById('count-archived') as HTMLElement;

// Toast
const toast = document.getElementById('toast') as HTMLElement;
let toastTimeout: any = null;

function showToast(message: string) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.remove('hidden');
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 2000);
}

// Modal Elements
const bookmarkModal = document.getElementById('bookmark-modal') as HTMLElement;
const modalForm = document.getElementById('modal-form') as HTMLFormElement;
const modalTitle = document.getElementById('modal-title') as HTMLElement;
const modalId = document.getElementById('modal-id') as HTMLInputElement;
const modalUrl = document.getElementById('modal-url') as HTMLInputElement;
const modalBmTitle = document.getElementById('modal-bm-title') as HTMLInputElement;
const modalNotes = document.getElementById('modal-notes') as HTMLTextAreaElement;
const modalTags = document.getElementById('modal-tags') as HTMLInputElement;
const modalUnread = document.getElementById('modal-unread') as HTMLInputElement;
const modalArchived = document.getElementById('modal-archived') as HTMLInputElement;
const modalNotesEdit = document.getElementById('modal-notes-edit') as HTMLElement;
const modalNotesPreview = document.getElementById('modal-notes-preview') as HTMLElement;
const modalTogglePreview = document.getElementById('modal-toggle-preview') as HTMLButtonElement;
const modalTagSuggestions = document.getElementById('modal-tag-suggestions') as HTMLElement;
const btnOpenAddModal = document.getElementById('btn-open-add-modal') as HTMLButtonElement;
const btnCloseModal = document.getElementById('btn-close-modal') as HTMLButtonElement;
const btnCancelModal = document.getElementById('btn-cancel-modal') as HTMLButtonElement;

// Import / Export Elements
const ioModal = document.getElementById('io-modal') as HTMLElement;
const btnOpenIoModal = document.getElementById('btn-open-io-modal') as HTMLButtonElement;
const btnCloseIo = document.getElementById('btn-close-io') as HTMLButtonElement;
const btnExportJson = document.getElementById('btn-export-json') as HTMLButtonElement;
const btnExportHtml = document.getElementById('btn-export-html') as HTMLButtonElement;
const dropZone = document.getElementById('drop-zone') as HTMLElement;
const fileImport = document.getElementById('file-import') as HTMLInputElement;
const importOverwrite = document.getElementById('import-overwrite') as HTMLInputElement;
const importResult = document.getElementById('import-result') as HTMLElement;

let isModalPreviewingNotes = false;

async function reloadData() {
  bookmarks = await getAllBookmarks();
  updateSidebarCounts();
  await updateSidebarTags();
  render();
}

function updateSidebarCounts() {
  const allCount = bookmarks.filter(b => !b.archived).length;
  const unreadCount = bookmarks.filter(b => b.unread && !b.archived).length;
  const archivedCount = bookmarks.filter(b => b.archived).length;

  countAll.textContent = String(allCount);
  countUnread.textContent = String(unreadCount);
  countArchived.textContent = String(archivedCount);
}

async function updateSidebarTags() {
  const stats = await getTagStats();
  tagsList.innerHTML = '';

  if (stats.length === 0) {
    tagsList.innerHTML = '<div class="text-[11px] text-zinc-400 py-1 px-1">暂无标签</div>';
    btnClearTags.classList.add('hidden');
    return;
  }

  btnClearTags.classList.toggle('hidden', selectedTags.length === 0);

  stats.forEach(stat => {
    const isSelected = selectedTags.includes(stat.name);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `w-full flex items-center justify-between px-2 py-1 rounded-md text-xs transition-colors ${
      isSelected
        ? 'bg-zinc-200/70 text-zinc-900 font-medium'
        : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
    }`;
    btn.innerHTML = `
      <span class="truncate">#${stat.name}</span>
      <span class="text-[10px] font-mono text-zinc-400">${stat.count}</span>
    `;
    btn.addEventListener('click', () => toggleTagFilter(stat.name));
    tagsList.appendChild(btn);
  });
}

function toggleTagFilter(tagName: string) {
  const index = selectedTags.indexOf(tagName);
  if (index >= 0) {
    selectedTags.splice(index, 1);
  } else {
    selectedTags.push(tagName);
  }
  updateSidebarTags();
  render();
}

function renderActiveTagPills() {
  activeTagPills.innerHTML = '';
  if (selectedTags.length === 0) return;

  selectedTags.forEach(tag => {
    const pill = document.createElement('span');
    pill.className = 'inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-200/70 text-zinc-800';
    pill.innerHTML = `
      <span>#${tag}</span>
      <button type="button" class="text-zinc-400 hover:text-zinc-800">
        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
    `;
    pill.querySelector('button')!.addEventListener('click', () => toggleTagFilter(tag));
    activeTagPills.appendChild(pill);
  });
}

function render() {
  if (activeFilter === 'unread') {
    viewTitle.textContent = '稍后读';
  } else if (activeFilter === 'archived') {
    viewTitle.textContent = '归档';
  } else {
    viewTitle.textContent = '全部';
  }

  renderActiveTagPills();

  const filtered = filterBookmarks(bookmarks, searchQuery, activeFilter, selectedTags, sortOrder);
  viewCount.textContent = String(filtered.length);

  bookmarksContainer.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  filtered.forEach(bm => {
    bookmarksContainer.appendChild(createBookmarkCard(bm));
  });
}

function createBookmarkCard(bm: Bookmark): HTMLElement {
  const domain = getDomain(bm.url);
  const timeAgo = formatTimeAgo(bm.createdAt);
  const isNotesExpanded = expandedNotes.has(bm.id);

  const card = document.createElement('div');
  card.className = `group bg-white rounded-xl border p-3.5 transition-all ${
    bm.unread ? 'border-zinc-300 shadow-2xs' : 'border-zinc-200/80 hover:border-zinc-300'
  }`;

  let tagsHtml = '';
  if (bm.tags && bm.tags.length > 0) {
    tagsHtml = bm.tags.map(tag => `
      <button type="button" data-tag="${tag}" class="btn-card-tag inline-block px-1.5 py-0.2 rounded text-[10px] bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
        #${tag}
      </button>
    `).join('');
  }

  let notesToggleHtml = '';
  let notesContentHtml = '';
  if (bm.notes && bm.notes.trim().length > 0) {
    notesToggleHtml = `
      <button type="button" class="btn-toggle-notes text-[11px] text-zinc-500 hover:text-zinc-800 flex items-center gap-1 transition-colors">
        <svg class="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span>${isNotesExpanded ? '收起' : '笔记'}</span>
      </button>
    `;
    notesContentHtml = `
      <div class="notes-body ${isNotesExpanded ? '' : 'hidden'} mt-2.5 p-3 bg-zinc-50 border border-zinc-150 rounded-lg text-xs markdown-body">
        ${renderMarkdown(bm.notes)}
      </div>
    `;
  }

  card.innerHTML = `
    <div class="flex items-start justify-between gap-3">
      <div class="flex-1 min-w-0">
        <div class="flex flex-wrap items-center gap-2 mb-1">
          <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="text-[13px] font-medium text-zinc-900 hover:text-indigo-600 transition-colors line-clamp-1 break-all">
            ${escapeHtml(bm.title || bm.url)}
          </a>
          <span class="text-[11px] font-mono text-zinc-400">${domain}</span>
          ${bm.unread ? '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" title="稍后读"></span>' : ''}
        </div>

        <div class="flex flex-wrap items-center gap-2 mt-1.5">
          ${tagsHtml}
          ${notesToggleHtml}
        </div>

        ${notesContentHtml}
      </div>

      <div class="flex items-center gap-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
        <button type="button" class="btn-unread p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="${bm.unread ? '标为已读' : '稍后阅读'}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button type="button" class="btn-copy p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="复制网址">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" />
          </svg>
        </button>

        <button type="button" class="btn-edit p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="编辑">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>

        <button type="button" class="btn-archive p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="${bm.archived ? '移出归档' : '归档'}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </button>

        <button type="button" class="btn-delete p-1 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors" title="删除">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <div class="mt-2 text-[10px] text-zinc-400 font-mono">
      ${timeAgo}
    </div>
  `;

  card.querySelectorAll('.btn-card-tag').forEach(tagBtn => {
    tagBtn.addEventListener('click', () => {
      const tag = tagBtn.getAttribute('data-tag');
      if (tag) toggleTagFilter(tag);
    });
  });

  const btnNotes = card.querySelector('.btn-toggle-notes');
  if (btnNotes) {
    btnNotes.addEventListener('click', () => {
      if (expandedNotes.has(bm.id)) {
        expandedNotes.delete(bm.id);
      } else {
        expandedNotes.add(bm.id);
      }
      render();
    });
  }

  card.querySelector('.btn-unread')!.addEventListener('click', async () => {
    await toggleUnread(bm.id);
    await reloadData();
  });

  card.querySelector('.btn-copy')!.addEventListener('click', async () => {
    await copyToClipboard(bm.url);
    showToast('已复制网址');
  });

  card.querySelector('.btn-edit')!.addEventListener('click', () => {
    openEditModal(bm);
  });

  card.querySelector('.btn-archive')!.addEventListener('click', async () => {
    await toggleArchived(bm.id);
    await reloadData();
  });

  card.querySelector('.btn-delete')!.addEventListener('click', async () => {
    if (confirm(`删除书签 "${bm.title}"？`)) {
      await deleteBookmark(bm.id);
      await reloadData();
      showToast('已删除');
    }
  });

  return card;
}

function escapeHtml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function openAddModal() {
  modalTitle.textContent = '新建书签';
  modalId.value = '';
  modalUrl.value = '';
  modalBmTitle.value = '';
  modalNotes.value = '';
  modalTags.value = '';
  modalUnread.checked = false;
  modalArchived.checked = false;

  resetModalPreview();
  await renderModalTagSuggestions([]);
  bookmarkModal.classList.remove('hidden');
  modalUrl.focus();
}

async function openEditModal(bm: Bookmark) {
  modalTitle.textContent = '编辑书签';
  modalId.value = bm.id;
  modalUrl.value = bm.url;
  modalBmTitle.value = bm.title;
  modalNotes.value = bm.notes || '';
  modalTags.value = bm.tags.join(' ');
  modalUnread.checked = bm.unread;
  modalArchived.checked = bm.archived;

  resetModalPreview();
  await renderModalTagSuggestions(bm.tags);
  bookmarkModal.classList.remove('hidden');
  modalBmTitle.focus();
}

function resetModalPreview() {
  isModalPreviewingNotes = false;
  modalNotesEdit.classList.remove('hidden');
  modalNotesPreview.classList.add('hidden');
  modalTogglePreview.textContent = '预览';
}

async function renderModalTagSuggestions(existingTags: string[]) {
  const topStats = await getTagStats();
  modalTagSuggestions.innerHTML = '';
  const currentTags = new Set(existingTags.map(t => t.toLowerCase()));

  topStats.slice(0, 8).forEach(stat => {
    const pill = document.createElement('button');
    pill.type = 'button';
    const isSelected = currentTags.has(stat.name.toLowerCase());
    pill.className = `px-1.5 py-0.5 text-[10px] rounded transition-colors ${
      isSelected
        ? 'bg-zinc-800 text-white font-medium'
        : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'
    }`;
    pill.textContent = `#${stat.name}`;
    pill.addEventListener('click', () => {
      const tags = modalTags.value.split(/[\s,，]+/).filter(Boolean);
      const idx = tags.indexOf(stat.name);
      if (idx >= 0) {
        tags.splice(idx, 1);
      } else {
        tags.push(stat.name);
      }
      modalTags.value = tags.join(' ');
      renderModalTagSuggestions(tags);
    });
    modalTagSuggestions.appendChild(pill);
  });
}

modalForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const url = modalUrl.value.trim();
  const title = modalBmTitle.value.trim();
  if (!url) return;

  const id = modalId.value || undefined;
  const tags = modalTags.value
    .split(/[\s,，]+/)
    .map(t => t.trim().toLowerCase())
    .filter(Boolean);

  await saveBookmark({
    id,
    url,
    title: title || url,
    description: '',
    notes: modalNotes.value,
    tags,
    unread: modalUnread.checked,
    archived: modalArchived.checked,
  });

  bookmarkModal.classList.add('hidden');
  await reloadData();
  showToast(id ? '已更新' : '已保存');
});

modalTogglePreview.addEventListener('click', () => {
  isModalPreviewingNotes = !isModalPreviewingNotes;
  if (isModalPreviewingNotes) {
    modalNotesPreview.innerHTML = renderMarkdown(modalNotes.value) || '<p class="text-zinc-400 italic text-[11px]">暂无笔记</p>';
    modalNotesEdit.classList.add('hidden');
    modalNotesPreview.classList.remove('hidden');
    modalTogglePreview.textContent = '编辑';
  } else {
    modalNotesEdit.classList.remove('hidden');
    modalNotesPreview.classList.add('hidden');
    modalTogglePreview.textContent = '预览';
  }
});

btnCloseModal.addEventListener('click', () => bookmarkModal.classList.add('hidden'));
btnCancelModal.addEventListener('click', () => bookmarkModal.classList.add('hidden'));
btnOpenAddModal.addEventListener('click', openAddModal);

// Import / Export
btnOpenIoModal.addEventListener('click', () => {
  importResult.classList.add('hidden');
  ioModal.classList.remove('hidden');
});
btnCloseIo.addEventListener('click', () => ioModal.classList.add('hidden'));

btnExportJson.addEventListener('click', async () => {
  const all = await getAllBookmarks();
  const jsonContent = exportToJSON(all);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(jsonContent, `pinscribe-backup-${dateStr}.json`, 'application/json');
  showToast('已导出 JSON');
});

btnExportHtml.addEventListener('click', async () => {
  const all = await getAllBookmarks();
  const htmlContent = exportToNetscapeHTML(all);
  const dateStr = new Date().toISOString().slice(0, 10);
  downloadFile(htmlContent, `pinscribe-bookmarks-${dateStr}.html`, 'text/html');
  showToast('已导出 HTML 书签');
});

dropZone.addEventListener('click', () => fileImport.click());
fileImport.addEventListener('change', async () => {
  if (fileImport.files && fileImport.files.length > 0) {
    await handleFileImport(fileImport.files[0]);
    fileImport.value = '';
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('border-zinc-400', 'bg-zinc-100/50');
});
dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('border-zinc-400', 'bg-zinc-100/50');
});
dropZone.addEventListener('drop', async (e) => {
  e.preventDefault();
  dropZone.classList.remove('border-zinc-400', 'bg-zinc-100/50');
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    await handleFileImport(e.dataTransfer.files[0]);
  }
});

async function handleFileImport(file: File) {
  const overwrite = importOverwrite.checked;
  const isJson = file.name.endsWith('.json');
  const isHtml = file.name.endsWith('.html') || file.name.endsWith('.htm');

  if (!isJson && !isHtml) {
    showImportFeedback('仅支持 .json 或 .html 文件', 'error');
    return;
  }

  showImportFeedback('正在导入...', 'info');

  try {
    const text = await file.text();
    const parsedItems = isJson ? parseJSONImport(text) : parseHTMLBookmarks(text);

    if (parsedItems.length === 0) {
      showImportFeedback('未找到有效书签条目', 'error');
      return;
    }

    const result = await bulkImportBookmarks(parsedItems, overwrite);
    showImportFeedback(`导入完成：新增 ${result.added} 条，更新 ${result.updated} 条，跳过 ${result.skipped} 条`, 'success');
    await reloadData();
  } catch (err: any) {
    showImportFeedback(`导入失败: ${err.message || '文件格式错误'}`, 'error');
  }
}

function showImportFeedback(message: string, type: 'success' | 'error' | 'info') {
  importResult.textContent = message;
  importResult.className = `text-xs p-2.5 rounded-lg ${
    type === 'success' ? 'bg-zinc-100 text-zinc-900' : type === 'error' ? 'bg-red-50 text-red-700' : 'bg-zinc-100 text-zinc-600'
  }`;
  importResult.classList.remove('hidden');
}

// Search
searchInput.addEventListener('input', () => {
  searchQuery = searchInput.value;
  btnClearSearch.classList.toggle('hidden', searchQuery.length === 0);
  render();
});

btnClearSearch.addEventListener('click', () => {
  searchInput.value = '';
  searchQuery = '';
  btnClearSearch.classList.add('hidden');
  render();
  searchInput.focus();
});

sortSelect.addEventListener('change', () => {
  sortOrder = sortSelect.value as any;
  render();
});

document.querySelectorAll('.sidebar-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    document.querySelectorAll('.sidebar-nav-item').forEach(el => {
      el.classList.remove('active', 'bg-zinc-200/60', 'text-zinc-900');
      el.classList.add('text-zinc-600');
    });
    item.classList.add('active', 'bg-zinc-200/60', 'text-zinc-900');
    item.classList.remove('text-zinc-600');

    activeFilter = item.getAttribute('data-filter') as BookmarkFilter;
    render();
  });
});

btnClearTags.addEventListener('click', () => {
  selectedTags = [];
  updateSidebarTags();
  render();
});

// Shortcuts: '/' or ⌘K to focus search, Esc to dismiss
window.addEventListener('keydown', (e) => {
  if ((e.key === '/' || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k')) &&
      document.activeElement !== searchInput &&
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault();
    searchInput.focus();
  } else if (e.key === 'Escape') {
    if (!bookmarkModal.classList.contains('hidden')) {
      bookmarkModal.classList.add('hidden');
    } else if (!ioModal.classList.contains('hidden')) {
      ioModal.classList.add('hidden');
    } else if (searchQuery) {
      searchInput.value = '';
      searchQuery = '';
      btnClearSearch.classList.add('hidden');
      render();
    }
  }
});

document.addEventListener('DOMContentLoaded', reloadData);
