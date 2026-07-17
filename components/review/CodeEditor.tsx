'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState } from 'react';
import type { editor as MonacoEditor } from 'monaco-editor';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const MonacoEditorComponent = dynamic(() => import('@monaco-editor/react').then((mod) => mod.Editor), {
  ssr: false,
});

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  className?: string;
}

const languageMap: Record<string, string> = {
  JavaScript: 'javascript',
  TypeScript: 'typescript',
  Python: 'python',
  Java: 'java',
  'C++': 'cpp',
  C: 'c',
  Go: 'go',
  Rust: 'rust',
  PHP: 'php',
  'C#': 'csharp',
};

export function CodeEditor({ value, language, onChange, className }: CodeEditorProps) {
  const editorRef = useRef<MonacoEditor.IStandaloneCodeEditor | null>(null);
  const [isEditorReady, setIsEditorReady] = useState(false);

  useEffect(() => {
    if (editorRef.current && isEditorReady) {
      editorRef.current.getAction('editor.action.formatDocument')?.run();
    }
  }, [language, isEditorReady]);

  return (
    <div className={cn('flex h-full flex-col overflow-hidden bg-[#09090d]', className)}>
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3 text-sm text-zinc-400">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-400" />
          <span>Code Input</span>
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-900/70 px-3 py-1 text-xs uppercase tracking-[0.2em] text-zinc-500">
          {language}
        </span>
      </div>
      <div className="flex-1 min-h-0">
        <MonacoEditorComponent
          key={language}
          height="100%"
          defaultLanguage={languageMap[language] ?? 'javascript'}
          language={languageMap[language] ?? 'javascript'}
          value={value}
          onMount={(editor) => {
            editorRef.current = editor;
            setIsEditorReady(true);
          }}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineNumbers: 'on',
            minimap: { enabled: false },
            padding: { top: 16 },
            wordWrap: 'on',
            smoothScrolling: true,
            automaticLayout: true,
            scrollBeyondLastLine: false,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

