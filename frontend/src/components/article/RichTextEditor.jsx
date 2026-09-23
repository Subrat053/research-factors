import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Link as LinkIcon,
  Unlink,
  List,
  ListOrdered,
  Quote,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
  Check,
  X
} from 'lucide-react';

export function RichTextEditor({
  content = '',
  onChange,
  placeholder = 'Begin drafting your paragraph text...',
  className = ''
}) {
  const isUpdatingRef = useRef(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const linkInputRef = useRef(null);

  // Initialize initial HTML or plain text
  const initialContent = typeof content === 'object'
    ? (content?.html || content?.text || '')
    : (content || '');

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Headings are separate block types in this architecture
        horizontalRule: false // Dividers are separate block types
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'editorial-link text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-800 dark:hover:text-blue-300 transition-colors',
          target: '_blank',
          rel: 'noopener noreferrer'
        }
      }),
      Underline,
      Subscript,
      Superscript
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          'min-h-[130px] p-4 text-sm sm:text-base leading-relaxed text-slate-800 dark:text-slate-200 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 font-normal',
        'data-placeholder': placeholder
      }
    },
    onUpdate: ({ editor }) => {
      isUpdatingRef.current = true;
      const html = editor.getHTML();
      const text = editor.getText();
      const isEmpty = editor.isEmpty;

      if (onChange) {
        onChange({
          text: isEmpty ? '' : text,
          html: isEmpty ? '' : html
        });
      }

      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  });

  // Synchronize when content is changed externally (e.g. draft fetch or undo), without interrupting active typing
  useEffect(() => {
    if (!editor || isUpdatingRef.current) return;
    const target = typeof content === 'object' ? (content?.html || content?.text || '') : (content || '');
    const currentHtml = editor.getHTML();
    const currentText = editor.getText();

    if (target !== currentHtml && target !== currentText) {
      editor.commands.setContent(target || '', false);
    }
  }, [content, editor]);

  // Focus link input automatically when modal opens
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      linkInputRef.current.focus();
      linkInputRef.current.select();
    }
  }, [showLinkInput]);

  if (!editor) {
    return (
      <div className="h-32 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 animate-pulse">
        Initializing editorial block editor...
      </div>
    );
  }

  const handleOpenLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkInput(true);
  };

  const handleApplyLink = () => {
    if (!linkUrl || !linkUrl.trim()) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkInput(false);
      return;
    }

    let urlToSet = linkUrl.trim();
    // Normalize web URLs lacking protocol
    if (!/^https?:\/\//i.test(urlToSet) && !urlToSet.startsWith('/') && !urlToSet.startsWith('#') && !urlToSet.startsWith('mailto:')) {
      urlToSet = `https://${urlToSet}`;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: urlToSet }).run();
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl('');
  };

  const wordCount = editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0;
  const charCount = editor.getText().length;

  return (
    <div className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/70 overflow-hidden shadow-2xs transition-colors ${className}`}>
      {/* Editor Formatting Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-1 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800/80 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-xs">
        <div className="flex flex-wrap items-center gap-0.5">
          {/* Bold */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            title="Bold (Ctrl+B)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('bold')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            title="Italic (Ctrl+I)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('italic')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            title="Underline (Ctrl+U)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('underline')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <UnderlineIcon className="w-3.5 h-3.5" />
          </button>

          {/* Strike */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            title="Strikethrough"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('strike')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          {/* Inline Code */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={!editor.can().chain().focus().toggleCode().run()}
            title="Inline Code"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('code')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />

          {/* Subscript (H₂O) */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            disabled={!editor.can().chain().focus().toggleSubscript().run()}
            title="Subscript (e.g. H₂O)"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('subscript')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <SubscriptIcon className="w-3.5 h-3.5" />
          </button>

          {/* Superscript (10⁹, [1]) */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            disabled={!editor.can().chain().focus().toggleSuperscript().run()}
            title="Superscript (e.g. 10⁹, citation [1])"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('superscript')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <SuperscriptIcon className="w-3.5 h-3.5" />
          </button>

          {/* Hyperlink */}
          <button
            type="button"
            onClick={handleOpenLinkModal}
            title={editor.isActive('link') ? 'Edit Link' : 'Insert Hyperlink'}
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('link')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          {/* Unlink (when link is active) */}
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={handleRemoveLink}
              title="Remove Hyperlink"
              className="p-1.5 rounded-lg text-xs text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />

          {/* Bullet List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            title="Bullet List"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('bulletList')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <List className="w-3.5 h-3.5" />
          </button>

          {/* Ordered List */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            title="Numbered List"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('orderedList')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Blockquote */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            title="Blockquote"
            className={`p-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
              editor.isActive('blockquote')
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          {/* Clear Formatting */}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
            title="Clear formatting"
            className="p-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </button>

          <span className="w-px h-4 bg-slate-300 dark:bg-slate-800 mx-1" />

          {/* Undo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="Undo (Ctrl+Z)"
            className="p-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Redo */}
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="Redo (Ctrl+Y)"
            className="p-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Live Word Count Indicator */}
        <div className="text-[11px] text-slate-400 dark:text-slate-500 font-medium select-none px-1">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span className="mx-1.5 text-slate-300 dark:text-slate-700">•</span>
          <span>{charCount} chars</span>
        </div>
      </div>

      {/* Interactive Link Popover Bar */}
      {showLinkInput && (
        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50/90 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-900/60 transition-all">
          <LinkIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
          <input
            ref={linkInputRef}
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyLink();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowLinkInput(false);
              }
            }}
            placeholder="Paste URL (e.g. https://doi.org/... or https://wikipedia.org/...)"
            className="flex-1 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-md px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleApplyLink}
            title="Apply link"
            className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
          >
            <Check className="w-3 h-3" />
            Apply
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={handleRemoveLink}
              title="Remove link"
              className="px-2 py-1 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200 text-xs font-medium cursor-pointer transition-colors"
            >
              Unlink
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLinkInput(false)}
            title="Cancel"
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tiptap Canvas */}
      <div className="editor-canvas prose-editor">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
