import {
  getAllBookmarks,
  saveBookmark,
  deleteBookmark,
  togglePinned,
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
let isSingleColumn = false;

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
const btnLayoutToggle = document.getElementById('btn-layout-toggle') as HTMLButtonElement;

// Sidebar counts
const countAll = document.getElementById('count-all') as HTMLElement;
const countNotes = document.getElementById('count-notes') as HTMLElement;
const countImages = document.getElementById('count-images') as HTMLElement;
const countUnread = document.getElementById('count-unread') as HTMLElement;
const countArchived = document.getElementById('count-archived') as HTMLElement;

// Quick Compose elements
const composeCollapsed = document.getElementById('compose-collapsed') as HTMLElement;
const composeForm = document.getElementById('compose-form') as HTMLFormElement;
const quickNotes = document.getElementById('quick-notes') as HTMLTextAreaElement;
const quickTitle = document.getElementById('quick-title') as HTMLInputElement;
const quickUrl = document.getElementById('quick-url') as HTMLInputElement;
const quickTags = document.getElementById('quick-tags') as HTMLInputElement;
const btnCancelCompose = document.getElementById('btn-cancel-compose') as HTMLButtonElement;

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
const modalTitle = document.getElementById("modal-title") as HTMLElement;
const modalForm = document.getElementById('modal-form') as HTMLFormElement;
const modalId = document.getElementById('modal-id') as HTMLInputElement;
const modalUrl = document.getElementById('modal-url') as HTMLInputElement;
const modalBmTitle = document.getElementById('modal-bm-title') as HTMLInputElement;
const modalNotes = document.getElementById('modal-notes') as HTMLTextAreaElement;
const modalTags = document.getElementById('modal-tags') as HTMLInputElement;
const modalPinned = document.getElementById('modal-pinned') as HTMLInputElement;
const modalUnread = document.getElementById('modal-unread') as HTMLInputElement;
const modalArchived = document.getElementById('modal-archived') as HTMLInputElement;
const modalNotesEdit = document.getElementById('modal-notes-edit') as HTMLElement;
const modalNotesPreview = document.getElementById('modal-notes-preview') as HTMLElement;
const modalTogglePreview = document.getElementById('modal-toggle-preview') as HTMLButtonElement;
const modalTagSuggestions = document.getElementById('modal-tag-suggestions') as HTMLElement;
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

// Quick compose handling
composeCollapsed.addEventListener('click', () => {
  composeCollapsed.classList.add('hidden');
  composeForm.classList.remove('hidden');
  quickNotes.focus();
});

btnCancelCompose.addEventListener('click', () => {
  composeForm.reset();
  composeForm.classList.add('hidden');
  composeCollapsed.classList.remove('hidden');
});

composeForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const notes = quickNotes.value.trim();
  const title = quickTitle.value.trim();
  const url = quickUrl.value.trim();
  const tags = quickTags.value.split(/[\s,，]+/).filter(Boolean);

  if (!notes && !url && !title) return;

  // Extract images from markdown if any
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
  const extractedImages: string[] = [];
  let match;
  while ((match = imageRegex.exec(notes)) !== null) {
    extractedImages.push(match[1]);
  }

  await saveBookmark({
    url,
    title: title || (url ? url : notes.slice(0, 30)),
    description: '',
    notes,
    images: extractedImages,
    tags,
    unread: false,
    archived: false,
  });

  composeForm.reset();
  composeForm.classList.add('hidden');
  composeCollapsed.classList.remove('hidden');
  await reloadData();
  showToast('便签已保存');
});

// Layout toggle (2 cols vs 1 col)
btnLayoutToggle.addEventListener('click', () => {
  isSingleColumn = !isSingleColumn;
  if (isSingleColumn) {
    bookmarksContainer.className = 'grid grid-cols-1 max-w-2xl mx-auto gap-3.5 w-full items-start';
  } else {
    bookmarksContainer.className = 'grid grid-cols-1 md:grid-cols-2 gap-3.5 items-start';
  }
});

async function reloadData() {
  bookmarks = await getAllBookmarks();
  updateSidebarCounts();
  await updateSidebarTags();
  render();
}

function updateSidebarCounts() {
  const activeList = bookmarks.filter(b => !b.archived);
  countAll.textContent = String(activeList.length);
  countNotes.textContent = String(activeList.filter(b => b.notes && b.notes.trim().length > 0).length);
  countImages.textContent = String(activeList.filter(b => (b.images && b.images.length > 0) || (b.notes && b.notes.includes('!['))).length);
  countUnread.textContent = String(activeList.filter(b => b.unread).length);
  countArchived.textContent = String(bookmarks.filter(b => b.archived).length);
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
  if (activeFilter === 'notes') {
    viewTitle.textContent = '笔记与摘录';
  } else if (activeFilter === 'images') {
    viewTitle.textContent = '图片收藏';
  } else if (activeFilter === 'unread') {
    viewTitle.textContent = '稍后读';
  } else if (activeFilter === 'archived') {
    viewTitle.textContent = '归档';
  } else {
    viewTitle.textContent = '全部卡片';
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

// Create Memos & Keep style Card
function createBookmarkCard(bm: Bookmark): HTMLElement {
  const domain = bm.url ? getDomain(bm.url) : '';
  const timeAgo = formatTimeAgo(bm.createdAt);

  const card = document.createElement('div');
  card.className = `group bg-white rounded-xl border p-4 transition-all flex flex-col gap-2.5 ${
    bm.pinned ? 'border-zinc-300 ring-1 ring-zinc-200 shadow-2xs' : 'border-zinc-200/80 hover:border-zinc-300 shadow-2xs'
  }`;

  // 1. Image preview if any (from bm.images)
  let imagesHtml = '';
  if (bm.images && bm.images.length > 0) {
    const firstImg = bm.images[0];
    imagesHtml = `
      <div class="rounded-lg overflow-hidden bg-zinc-100 max-h-48 border border-zinc-150">
        <img src="${escapeHtml(firstImg)}" alt="" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.display='none'">
      </div>
    `;
  }

  // 2. Rendered Markdown notes (shown directly like Memos / Keep)
  let notesHtml = '';
  if (bm.notes && bm.notes.trim()) {
    notesHtml = `
      <div class="markdown-body text-xs text-zinc-800 leading-relaxed">
        ${renderMarkdown(bm.notes)}
      </div>
    `;
  }

  // 3. Source Link Box (Linkding style source link if URL present)
  let sourceLinkHtml = '';
  if (bm.url) {
    sourceLinkHtml = `
      <div class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 border border-zinc-150 text-[11px] hover:bg-zinc-100/70 transition-colors">
        <a href="${bm.url}" target="_blank" rel="noopener noreferrer" class="flex-1 min-w-0 font-medium text-zinc-800 hover:text-indigo-600 truncate flex items-center gap-1.5">
          <svg class="w-3 h-3 text-zinc-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span class="truncate">${escapeHtml(bm.title || domain || bm.url)}</span>
        </a>
        <span class="text-[10px] font-mono text-zinc-400 shrink-0 ml-2">${domain}</span>
      </div>
    `;
  } else if (bm.title && !bm.notes.includes(bm.title)) {
    // Pure memo with title
    sourceLinkHtml = `
      <div class="text-xs font-semibold text-zinc-900">${escapeHtml(bm.title)}</div>
    `;
  }

  // 4. Tags
  let tagsHtml = '';
  if (bm.tags && bm.tags.length > 0) {
    tagsHtml = `
      <div class="flex flex-wrap gap-1 mt-0.5">
        ${bm.tags.map(t => `
          <button type="button" data-tag="${t}" class="btn-card-tag inline-block px-1.5 py-0.2 rounded text-[10px] bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors">
            #${t}
          </button>
        `).join('')}
      </div>
    `;
  }

  // Card assembly
  card.innerHTML = `
    <!-- Top badge bar if pinned or unread -->
    ${
      bm.pinned || bm.unread
        ? `<div class="flex items-center gap-1.5 text-[10px]">
            ${bm.pinned ? '<span class="inline-flex items-center gap-0.5 text-zinc-700 font-medium">📌 置顶</span>' : ''}
            ${bm.unread ? '<span class="inline-flex items-center gap-0.5 text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded font-medium">稍后读</span>' : ''}
          </div>`
        : ''
    }

    <!-- Image preview -->
    ${imagesHtml}

    <!-- Notes body -->
    ${notesHtml}

    <!-- Source URL box -->
    ${sourceLinkHtml}

    <!-- Tags -->
    ${tagsHtml}

    <!-- Footer Toolbar -->
    <div class="flex items-center justify-between pt-1 text-[10px] text-zinc-400 font-mono border-t border-zinc-100">
      <span>${timeAgo}</span>

      <div class="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
        <button type="button" class="btn-pin p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="${bm.pinned ? '取消置顶' : '置顶'}">
          <svg class="w-3.5 h-3.5 ${bm.pinned ? 'text-indigo-600 fill-indigo-100' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
        </button>

        <button type="button" class="btn-unread p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="${bm.unread ? '标为已读' : '稍后阅读'}">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button type="button" class="btn-copy p-1 text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 rounded-md transition-colors" title="复制内容">
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
  `;

  // Tag click
  card.querySelectorAll('.btn-card-tag').forEach(tagBtn => {
    tagBtn.addEventListener('click', () => {
      const tag = tagBtn.getAttribute('data-tag');
      if (tag) toggleTagFilter(tag);
    });
  });

  // Pin toggle
  card.querySelector('.btn-pin')!.addEventListener('click', async () => {
    await togglePinned(bm.id);
    await reloadData();
  });

  // Unread toggle
  card.querySelector('.btn-unread')!.addEventListener('click', async () => {
    await toggleUnread(bm.id);
    await reloadData();
  });

  // Copy
  card.querySelector('.btn-copy')!.addEventListener('click', async () => {
    const textToCopy = bm.notes || bm.url || bm.title;
    await copyToClipboard(textToCopy);
    showToast('已复制内容');
  });

  // Edit
  card.querySelector('.btn-edit')!.addEventListener('click', () => {
    openEditModal(bm);
  });

  // Archive
  card.querySelector('.btn-archive')!.addEventListener('click', async () => {
    await toggleArchived(bm.id);
    await reloadData();
  });

  // Delete
  card.querySelector('.btn-delete')!.addEventListener('click', async () => {
    if (confirm('确定删除此卡片？')) {
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

async function openEditModal(bm: Bookmark) {
  modalTitle.textContent = '编辑卡片';
  modalId.value = bm.id;
  modalUrl.value = bm.url || '';
  modalBmTitle.value = bm.title || '';
  modalNotes.value = bm.notes || '';
  modalTags.value = bm.tags.join(' ');
  modalPinned.checked = !!bm.pinned;
  modalUnread.checked = bm.unread;
  modalArchived.checked = bm.archived;

  resetModalPreview();
  await renderModalTagSuggestions(bm.tags);
  bookmarkModal.classList.remove('hidden');
  modalNotes.focus();
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
  const notes = modalNotes.value;
  const url = modalUrl.value.trim();
  const title = modalBmTitle.value.trim();
  const id = modalId.value || undefined;
  const tags = modalTags.value.split(/[\s,，]+/).map(t => t.trim().toLowerCase()).filter(Boolean);

  // Extract images from markdown
  const imageRegex = /!\[.*?\]\((https?:\/\/[^\s\)]+)\)/g;
  const extractedImages: string[] = [];
  let match;
  while ((match = imageRegex.exec(notes)) !== null) {
    extractedImages.push(match[1]);
  }

  await saveBookmark({
    id,
    url,
    title: title || (url ? url : notes.slice(0, 30)),
    description: '',
    notes,
    images: extractedImages,
    tags,
    pinned: modalPinned.checked,
    unread: modalUnread.checked,
    archived: modalArchived.checked,
  });

  bookmarkModal.classList.add('hidden');
  await reloadData();
  showToast('已更新');
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
