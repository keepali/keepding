export type Locale = 'en' | 'zh_CN';

export const messages = {
  en: {
    // Context menus
    menu_save_page: 'Save page to Keepding',
    menu_save_selection: 'Save selection to note',
    menu_save_image: 'Save image to note',
    menu_save_link: 'Save link to Keepding',
    menu_open_manager: 'Open Keepding library',

    // Popup
    popup_title_placeholder: 'Title',
    popup_notes_tab_write: 'Write',
    popup_notes_tab_preview: 'Preview',
    popup_notes_placeholder: 'Markdown notes, quotes, thoughts...',
    popup_notes_empty: 'No notes yet',
    popup_tags_placeholder: 'Tags (space separated)',
    popup_unread: 'Read later',
    popup_archived: 'Archive',
    popup_save: 'Save',
    popup_update: 'Update',
    popup_saving: 'Saving...',
    popup_saved: 'Saved',
    popup_captured_selection: 'Captured selected text',
    popup_already_saved: 'Saved in library',

    // Manager
    nav_all: 'All Memos',
    nav_notes: 'Notes & Quotes',
    nav_images: 'Images',
    nav_unread: 'Read Later',
    nav_archived: 'Archive',
    nav_tags: 'Tags',
    btn_clear_tags: 'Clear',

    search_placeholder: 'Search memos, notes, URLs, #tags...',
    quick_compose_placeholder: 'Take a note, thought, or paste link/image...',
    quick_compose_title: 'Title (optional)',
    quick_compose_url: 'Source URL https:// (optional)',
    quick_compose_tags: 'Tags (space separated)',
    quick_compose_cancel: 'Cancel',
    quick_compose_save: 'Save',

    sort_date_desc: 'Recently updated',
    sort_date_asc: 'Oldest first',
    sort_title_asc: 'Title A-Z',

    card_pinned: 'Pinned',
    card_unread: 'Unread',
    card_pin: 'Pin',
    card_unpin: 'Unpin',
    card_mark_read: 'Mark as read',
    card_mark_unread: 'Read later',
    card_copy: 'Copy',
    card_copied: 'Copied to clipboard',
    card_edit: 'Edit',
    card_archive: 'Archive',
    card_unarchive: 'Unarchive',
    card_delete: 'Delete',
    card_delete_confirm: 'Delete this card?',
    empty_state: 'No items found',

    // Modal
    modal_edit_title: 'Edit Card',
    modal_label_notes: 'Notes (Markdown)',
    modal_label_title: 'Title (optional)',
    modal_label_url: 'Source URL (optional)',
    modal_label_tags: 'Tags',
    modal_cancel: 'Cancel',
    modal_save: 'Save',

    // Import / Export
    io_modal_title: 'Backup & Import',
    io_export_section: 'Export Backup',
    io_export_json_title: 'JSON Backup',
    io_export_json_desc: 'Full notes, images and metadata',
    io_export_html_title: 'HTML Bookmarks',
    io_export_html_desc: 'Compatible with browsers',
    io_import_section: 'Import Data',
    io_import_overwrite: 'Overwrite duplicate URLs',
    io_import_dropzone: 'Choose file or drag here',
    io_import_hint: 'Supports .json or .html files',
    io_importing: 'Importing...',
    io_import_success: 'Import complete: {added} added, {updated} updated, {skipped} skipped',
    io_import_error: 'Import failed: {error}',
    io_format_error: 'Only .json or .html files are supported',
  },
  zh_CN: {
    // Context menus
    menu_save_page: '收藏此网页',
    menu_save_selection: '收藏选中文本到笔记',
    menu_save_image: '收藏图片到笔记',
    menu_save_link: '收藏此链接',
    menu_open_manager: '打开管理面板',

    // Popup
    popup_title_placeholder: '标题',
    popup_notes_tab_write: '编辑',
    popup_notes_tab_preview: '预览',
    popup_notes_placeholder: '支持 Markdown 记录备忘、摘录...',
    popup_notes_empty: '暂无笔记',
    popup_tags_placeholder: '添加标签 (空格或逗号分隔)',
    popup_unread: '稍后阅读',
    popup_archived: '归档',
    popup_save: '保存',
    popup_update: '更新',
    popup_saving: '保存中...',
    popup_saved: '已保存',
    popup_captured_selection: '已捕获选中文本',
    popup_already_saved: '已保存在库中',

    // Manager
    nav_all: '全部卡片',
    nav_notes: '笔记与摘录',
    nav_images: '图片收藏',
    nav_unread: '稍后读',
    nav_archived: '归档',
    nav_tags: '标签',
    btn_clear_tags: '清除',

    search_placeholder: '搜索便签、笔记、网址、#标签...',
    quick_compose_placeholder: '记录便签、想法，或粘贴链接/图片...',
    quick_compose_title: '标题 (选填)',
    quick_compose_url: '来源网址 https:// (选填)',
    quick_compose_tags: '标签 (空格分隔)',
    quick_compose_cancel: '取消',
    quick_compose_save: '保存',

    sort_date_desc: '最新更新',
    sort_date_asc: '最早添加',
    sort_title_asc: '标题排序',

    card_pinned: '置顶',
    card_unread: '稍后读',
    card_pin: '置顶',
    card_unpin: '取消置顶',
    card_mark_read: '标为已读',
    card_mark_unread: '稍后阅读',
    card_copy: '复制',
    card_copied: '已复制内容',
    card_edit: '编辑',
    card_archive: '归档',
    card_unarchive: '移出归档',
    card_delete: '删除',
    card_delete_confirm: '确定删除此卡片？',
    empty_state: '暂无内容',

    // Modal
    modal_edit_title: '编辑卡片',
    modal_label_notes: '笔记正文 (Markdown)',
    modal_label_title: '标题 (选填)',
    modal_label_url: '来源网址 (选填)',
    modal_label_tags: '标签',
    modal_cancel: '取消',
    modal_save: '保存',

    // Import / Export
    io_modal_title: '备份与导入',
    io_export_section: '导出备份',
    io_export_json_title: 'JSON 备份',
    io_export_json_desc: '完整便签、笔记与图片',
    io_export_html_title: 'HTML 书签',
    io_export_html_desc: '兼容浏览器书签',
    io_import_section: '导入数据',
    io_import_overwrite: '覆盖已存在相同网址的数据',
    io_import_dropzone: '选择文件或拖入此处',
    io_import_hint: '支持 .json 或 .html 书签',
    io_importing: '正在导入...',
    io_import_success: '导入完成：新增 {added} 条，更新 {updated} 条，跳过 {skipped} 条',
    io_import_error: '导入失败: {error}',
    io_format_error: '仅支持 .json 或 .html 文件',
  }
};

const LOCALE_KEY = 'keepding_locale';

export async function getLocale(): Promise<Locale> {
  try {
    const result = await chrome.storage.local.get(LOCALE_KEY);
    if (result[LOCALE_KEY] === 'zh_CN' || result[LOCALE_KEY] === 'en') {
      return result[LOCALE_KEY];
    }
  } catch {
    // ignore
  }
  return 'en'; // Default English
}

export async function setLocale(locale: Locale): Promise<void> {
  await chrome.storage.local.set({ [LOCALE_KEY]: locale });
  // Notify runtime/background
  try {
    chrome.runtime.sendMessage({ type: 'LOCALE_CHANGED', locale });
  } catch {
    // ignore
  }
}

export function t(key: keyof typeof messages['en'], locale: Locale = 'en', params?: Record<string, string | number>): string {
  const dict = messages[locale] || messages.en;
  let text = dict[key] || messages.en[key] || key;

  if (params) {
    Object.keys(params).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), String(params[k]));
    });
  }

  return text;
}
