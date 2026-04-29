function CalloutBlock({ block }) {
  if (!block?.content) return null

  return (
    <aside className={`structured-callout structured-callout--${block.variant || 'info'}`}>
      {block.title ? <h3 className="structured-callout__title">{block.title}</h3> : null}
      <p className="structured-callout__content">{block.content}</p>
    </aside>
  )
}

export default CalloutBlock
