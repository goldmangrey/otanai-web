import { Children, isValidElement, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { copyText } from '../../chat/utils/clipboard.js'
import {
  getCodeLanguage,
  isDocumentLike,
  isDocumentPlaceholder,
  isStandaloneDocument,
  splitDocumentPlaceholders
} from '../../chat/utils/documentPreview.js'
import { normalizeAssistantMarkdown } from '../../chat/utils/markdown.js'
import { normalizeSources } from '../../chat/utils/sources.js'
import {
  isTableBlockLanguage,
  normalizeStructuredBlocks,
  recoverMalformedTableBlocks,
  stripRecoveredTableArtifacts,
  stripTableArtifacts
} from '../../chat/utils/tableBlock.js'
import CalloutBlock from './CalloutBlock.jsx'
import ResearchActivity from './ResearchActivity.jsx'
import SourcesButton from './SourcesButton.jsx'
import TableBlock from './TableBlock.jsx'
import OtanMessage from '../../chat/rich-response/OtanMessage.jsx'
import RichRendererErrorBoundary from '../../chat/rich-response/RichRendererErrorBoundary.jsx'
import { metadataToSourcePanelPart } from '../../chat/rich-response/parts/sources/sourceUtils.js'
import { safeUrl } from '../../chat/rich-response/security/safeUrl.js'
import {
  isRichRendererEnabled,
  shouldRenderInlineSources
} from '../../config/richResponseFlags.js'

function normalizeUrl(url) {
  return safeUrl(url)
}

function CitationBadge({ sourceId }) {
  return <span className="ai-markdown__citation">source: {String(sourceId).trim()}</span>
}

function renderSourceTextNode(text, keyPrefix) {
  const parts = text.split(/(\[source:\s*[^\]]+\])/gi)

  if (parts.length === 1) return text

  return parts.map((part, index) => {
    const match = part.match(/^\[source:\s*([^\]]+)\]$/i)
    if (!match) return <span key={`${keyPrefix}-text-${index}`}>{part}</span>
    return <CitationBadge key={`${keyPrefix}-source-${index}`} sourceId={match[1]} />
  })
}

function InlineSourceText({ children }) {
  return Children.toArray(children).map((child, index) => {
    if (typeof child !== 'string') return child
    return renderSourceTextNode(child, `inline-${index}`)
  })
}

function getNodeText(node) {
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join('')
  if (isValidElement(node)) return getNodeText(node.props.children)
  return ''
}

function getPlainText(children) {
  return Children.toArray(children)
    .map(getNodeText)
    .join('')
    .trim()
}

function isNumberedHeading(children) {
  return /^\d{1,2}[).]\s+/.test(getPlainText(children))
}

function isCalloutText(children) {
  return /^(важно|предупреждение|warning|note|обратите внимание|нюанс|итог|коротко)[:：]/i.test(getPlainText(children))
}

function isSummaryHeading(children) {
  return /^(короткий ответ|кратко|главное|вывод)$/i.test(getPlainText(children).replace(/[:：.]$/, ''))
}

function getBlockquoteClass(children) {
  const text = getPlainText(children)
  if (/(статья|закон рк|кодекс|постановление)/i.test(text)) return 'ai-markdown__legal-quote'
  if (/^(важно|предупреждение|warning|note|обратите внимание|примечание)[:：]/i.test(text)) {
    return 'ai-markdown__note'
  }
  return 'ai-markdown__quote'
}

function renderDocumentLine(line, keyPrefix) {
  const parts = splitDocumentPlaceholders(line)

  return parts.map((part, index) => {
    if (isDocumentPlaceholder(part)) {
      return <mark key={`${keyPrefix}-placeholder-${index}`}>{part}</mark>
    }
    return <span key={`${keyPrefix}-text-${index}`}>{part}</span>
  })
}

function DocumentPreview({ content }) {
  const [isCopied, setIsCopied] = useState(false)
  const documentText = String(content ?? '').replace(/\n$/, '')
  const lines = documentText.split('\n')

  const handleCopy = async () => {
    try {
      await copyText(documentText)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1600)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <section className="ai-document-preview" aria-label="Document preview">
      <div className="ai-document-preview__toolbar">
        <span>Document preview</span>
        <button type="button" onClick={handleCopy}>
          {isCopied ? 'Скопировано' : 'Скопировать документ'}
        </button>
      </div>
      <div className="ai-document-preview__page">
        {lines.map((line, index) => {
          const trimmed = line.trim()
          const isTitle = /^(заявление|жалоба|шаблон|договор|обращение)$/i.test(trimmed)
          return (
            <p
              key={`document-line-${index}`}
              className={isTitle ? 'ai-document-preview__title' : undefined}
            >
              {line ? renderDocumentLine(line, `document-line-${index}`) : '\u00A0'}
            </p>
          )
        })}
      </div>
    </section>
  )
}

function CodeBlock({ className, children, documentContext = null }) {
  const [isCopied, setIsCopied] = useState(false)
  const normalizedLanguage = getCodeLanguage(className)
  const language = normalizedLanguage || 'Code'
  const content = String(children ?? '').replace(/\n$/, '')

  if (isDocumentLike(content, normalizedLanguage, documentContext)) {
    return <DocumentPreview content={content} />
  }

  if (isTableBlockLanguage(normalizedLanguage)) {
    return <TableBlock content={content} />
  }

  const handleCopy = async () => {
    try {
      await copyText(content)
      setIsCopied(true)
      window.setTimeout(() => setIsCopied(false), 1600)
    } catch {
      setIsCopied(false)
    }
  }

  return (
    <div className="ai-markdown__code-block">
      <div className="ai-markdown__code-header">
        <span>{language}</span>
        <button type="button" onClick={handleCopy}>
          {isCopied ? 'Copied' : 'Copy code'}
        </button>
      </div>
      <pre>
        <code>{content}</code>
      </pre>
    </div>
  )
}

export function LegacyChatMessageContent({ content, metadata = null, showResearchActivity = true }) {
  const sources = normalizeSources(metadata)
  const metadataBlocks = normalizeStructuredBlocks(metadata)
  const recoveredBlocks = metadataBlocks.length ? [] : recoverMalformedTableBlocks(content)
  const blocks = metadataBlocks.length ? metadataBlocks : recoveredBlocks
  const markdownSource = recoveredBlocks.length ? stripRecoveredTableArtifacts(content) : content
  const markdown = normalizeAssistantMarkdown(blocks.length ? stripTableArtifacts(markdownSource) : markdownSource)

  const renderStructuredBlock = (block, index) => {
    if (block.type === 'table') {
      return <TableBlock key={block.id || `table-block-${index}`} block={block} />
    }
    if (block.type === 'callout') {
      return <CalloutBlock key={block.id || `callout-block-${index}`} block={block} />
    }
    return null
  }

  if (isStandaloneDocument(markdown, metadata)) {
    return (
      <div className="ai-markdown">
        <DocumentPreview content={markdown} />
        <SourcesButton sources={sources} metadata={metadata} />
        {showResearchActivity ? <ResearchActivity metadata={metadata} /> : null}
      </div>
    )
  }

  return (
    <div className="ai-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            const safeHref = normalizeUrl(href)
            if (!safeHref) return <>{children}</>
            return (
              <a href={safeHref} rel="noopener noreferrer" target="_blank">
                {children}
              </a>
            )
          },
          code: ({ inline, className, children }) => {
            if (inline) return <code>{children}</code>
            return <CodeBlock className={className} documentContext={metadata}>{children}</CodeBlock>
          },
          h1: ({ children }) => <h1>{children}</h1>,
          h2: ({ children }) => (
            <h2 className={[
              isNumberedHeading(children) ? 'ai-markdown__numbered-heading' : '',
              isSummaryHeading(children) ? 'ai-markdown__summary-heading' : ''
            ].filter(Boolean).join(' ') || undefined}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={[
              isNumberedHeading(children) ? 'ai-markdown__numbered-heading' : '',
              isSummaryHeading(children) ? 'ai-markdown__summary-heading' : ''
            ].filter(Boolean).join(' ') || undefined}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className={isNumberedHeading(children) ? 'ai-markdown__numbered-heading' : undefined}>
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className={isCalloutText(children) ? 'ai-markdown__callout' : undefined}>
              <InlineSourceText>{children}</InlineSourceText>
            </p>
          ),
          blockquote: ({ children }) => <blockquote className={getBlockquoteClass(children)}>{children}</blockquote>,
          li: ({ children }) => <li><InlineSourceText>{children}</InlineSourceText></li>,
          table: ({ children }) => (
            <div className="ai-markdown__table-wrap">
              <table>{children}</table>
            </div>
          )
        }}
      >
        {markdown}
      </ReactMarkdown>
      {blocks.length ? (
        <div className="structured-blocks">
          {blocks.map(renderStructuredBlock)}
        </div>
      ) : null}
      <SourcesButton sources={sources} metadata={metadata} />
      {showResearchActivity ? <ResearchActivity metadata={metadata} /> : null}
    </div>
  )
}

function ChatMessageContent({ message = null, content, metadata = null, showResearchActivity = true }) {
  const resolvedContent = message?.content ?? content
  const resolvedMetadata = message?.metadata ?? metadata
  const resolvedMessage = message || { content: resolvedContent, metadata: resolvedMetadata }

  if (isRichRendererEnabled()) {
    const renderSourcePanel = shouldRenderInlineSources()
    const richSourcePanel = metadataToSourcePanelPart(resolvedMetadata)
    const sources = normalizeSources(resolvedMetadata)
    const drawerSources = sources.length ? sources : richSourcePanel?.sources || []
    const legacyFallback = (
      <LegacyChatMessageContent
        content={resolvedContent}
        metadata={resolvedMetadata}
        showResearchActivity={showResearchActivity}
      />
    )
    return (
      <RichRendererErrorBoundary
        fallback={legacyFallback}
        message={resolvedMessage}
        renderSourcePanel={renderSourcePanel}
        resetKey={`${resolvedMessage?.id || 'message'}:${resolvedContent?.length || 0}:${resolvedMessage?.status || ''}`}
      >
        <OtanMessage
          message={resolvedMessage}
          content={resolvedContent}
          metadata={resolvedMetadata}
          showResearchActivity={showResearchActivity}
          renderSourcePanel={renderSourcePanel}
          defaultSourcesCollapsed
        />
        {!renderSourcePanel ? <SourcesButton sources={drawerSources} metadata={resolvedMetadata} /> : null}
      </RichRendererErrorBoundary>
    )
  }

  return (
    <LegacyChatMessageContent
      content={resolvedContent}
      metadata={resolvedMetadata}
      showResearchActivity={showResearchActivity}
    />
  )
}

export default ChatMessageContent
