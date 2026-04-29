import { useState } from 'react'

import SourcesDrawer from './SourcesDrawer.jsx'

function SourcesButton({ sources }) {
  const [isOpen, setIsOpen] = useState(false)

  if (!sources.length) return null

  return (
    <>
      <button
        type="button"
        className="sources-button"
        aria-label="Показать источники ответа"
        onClick={() => setIsOpen(true)}
      >
        Источники · {sources.length}
      </button>
      <SourcesDrawer sources={sources} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

export default SourcesButton
