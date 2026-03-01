import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose prose-slate max-w-none prose-headings:font-semibold prose-h3:text-indigo-600 prose-strong:text-slate-900 prose-code:bg-slate-100 prose-code:px-1 prose-code:rounded prose-pre:bg-slate-900 prose-pre:text-slate-100 pdf-export-container">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </div>
  );
}
