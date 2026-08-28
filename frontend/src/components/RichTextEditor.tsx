import React, { useRef, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link,
  Undo,
  Redo,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Write your email body here...',
}) => {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      if (value === '' || value === '<p></p>') {
        editorRef.current.innerHTML = '';
      } else {
        editorRef.current.innerHTML = value;
      }
    }
  }, [value]);

  const exec = (command: string, arg?: string) => {
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleAddLink = () => {
    const url = prompt('Enter link URL:');
    if (url) {
      exec('createLink', url);
    }
  };

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden bg-white focus-within:border-emerald-500 transition">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 bg-[#F9FAFB] border-b border-gray-200 text-gray-600 select-none">
        <button
          type="button"
          onClick={() => exec('bold')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('italic')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('underline')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Underline (Ctrl+U)"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('strikeThrough')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1.5" />

        <button
          type="button"
          onClick={() => exec('insertUnorderedList')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('insertOrderedList')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1.5" />

        <button
          type="button"
          onClick={() => exec('justifyLeft')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Align Left"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyCenter')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Align Center"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('justifyRight')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Align Right"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1.5" />

        <button
          type="button"
          onClick={handleAddLink}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Insert Link"
        >
          <Link className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-[1px] bg-gray-300 mx-1.5" />

        <button
          type="button"
          onClick={() => exec('undo')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => exec('redo')}
          className="p-1.5 hover:bg-gray-200 hover:text-gray-900 rounded transition"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editable Canvas */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="rich-editor-content p-3.5 min-h-[160px] max-h-[300px] overflow-y-auto text-xs text-gray-800 leading-relaxed focus:outline-none"
      />
    </div>
  );
};
