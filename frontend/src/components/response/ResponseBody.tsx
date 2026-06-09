import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { ResponseBodyFormat } from '@/utils/responseFormat';
import {
  isHtmlResponse,
  looksLikeJson,
  looksLikeXml,
  tryFormatJson,
  tryFormatXml,
} from '@/utils/responseFormat';

interface ResponseBodyProps {
  body: string;
  contentType: string;
  format: ResponseBodyFormat;
}

const highlighterStyle = {
  margin: 0,
  padding: '1rem',
  background: 'transparent',
  fontSize: '12px',
};

export function ResponseBody({ body, contentType, format }: ResponseBodyProps) {
  switch (format) {
    case 'preview':
      if (!isHtmlResponse(contentType, body)) {
        return (
          <div className="flex items-center justify-center h-full p-8">
            <p className="text-xs text-gray-500 text-center">
              Preview is only available for HTML responses.
              <br />
              Try JSON, Raw, or Text view instead.
            </p>
          </div>
        );
      }
      return (
        <iframe
          sandbox=""
          srcDoc={body}
          title="HTML Preview"
          className="w-full h-full min-h-[120px] border-0 bg-white"
        />
      );

    case 'json': {
      const display = tryFormatJson(body);
      const isValidJson = looksLikeJson(body);
      if (!isValidJson && !contentType.includes('json')) {
        return (
          <div className="p-4">
            <p className="text-xs text-amber-400/80 mb-3">Response does not appear to be valid JSON.</p>
            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">{body}</pre>
          </div>
        );
      }
      return (
        <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={highlighterStyle} showLineNumbers>
          {display}
        </SyntaxHighlighter>
      );
    }

    case 'xml': {
      const display = looksLikeXml(body) ? tryFormatXml(body) : body;
      if (!looksLikeXml(body) && !contentType.includes('xml')) {
        return (
          <div className="p-4">
            <p className="text-xs text-amber-400/80 mb-3">Response does not appear to be valid XML.</p>
            <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">{body}</pre>
          </div>
        );
      }
      return (
        <SyntaxHighlighter language="xml" style={vscDarkPlus} customStyle={highlighterStyle} showLineNumbers>
          {display}
        </SyntaxHighlighter>
      );
    }

    case 'text':
      return (
        <div className="p-4 text-sm text-gray-300 leading-relaxed whitespace-pre-wrap break-words font-sans">
          {body}
        </div>
      );

    case 'raw':
    default:
      return (
        <pre className="p-4 text-xs font-mono text-gray-300 whitespace-pre-wrap break-all">{body}</pre>
      );
  }
}
