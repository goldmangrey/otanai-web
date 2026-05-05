import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { normalizeAssistantMarkdown } from '../../utils/markdown.js'
import { createMarkdownComponents } from './markdownComponents.jsx'
import { prepareMarkdownForRender } from './streamingMarkdown.js'

function OtanMarkdown({
  text = '',
  isStreaming = false,
  className = '',
  documentContext = null,
  renderDocumentPreview = null
}) {
  const normalizedText = normalizeAssistantMarkdown(String(text || ''))
  const markdown = prepareMarkdownForRender(normalizedText, { isStreaming })
  const classNames = ['ai-markdown', className].filter(Boolean).join(' ')

  return (
    <div className={classNames}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={createMarkdownComponents({
          documentContext,
          renderDocumentPreview
        })}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

export default OtanMarkdown
