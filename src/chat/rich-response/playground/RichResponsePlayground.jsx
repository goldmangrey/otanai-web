import { useMemo, useState } from 'react'
import PlaygroundControls from './PlaygroundControls.jsx'
import PlaygroundMessagePreview from './PlaygroundMessagePreview.jsx'
import V4StreamSimulator from './V4StreamSimulator.jsx'
import { playgroundFixtures, v4RichLegalAnswerEvents } from './fixtures.js'
import { filterFixtures, getFixtureById } from './playgroundUtils.js'
import { getRichResponseFlags } from '../../../config/richResponseFlags.js'

function RichResponsePlayground() {
  const flags = getRichResponseFlags()
  const [category, setCategory] = useState('all')
  const filteredFixtures = useMemo(() => filterFixtures(playgroundFixtures, category), [category])
  const [selectedId, setSelectedId] = useState(playgroundFixtures[0]?.id || '')
  const [renderPhase, setRenderPhase] = useState('')
  const [renderSourcePanel, setRenderSourcePanel] = useState(flags.inlineSources)
  const [previewWidth, setPreviewWidth] = useState('desktop')
  const [simulatedMessage, setSimulatedMessage] = useState(null)
  const selectedFixture = getFixtureById(filteredFixtures, selectedId) || filteredFixtures[0] || playgroundFixtures[0]
  const message = simulatedMessage || selectedFixture?.message || {}

  function handleCategoryChange(nextCategory) {
    const nextFixtures = filterFixtures(playgroundFixtures, nextCategory)
    setCategory(nextCategory)
    setSelectedId(nextFixtures[0]?.id || '')
    setSimulatedMessage(null)
  }

  function handleFixtureChange(nextId) {
    setSelectedId(nextId)
    setSimulatedMessage(null)
  }

  return (
    <div className="rich-playground">
      <header className="rich-playground__header">
        <div>
          <p className="rich-playground__eyebrow">Internal QA</p>
          <h1>Rich Response Playground</h1>
          <p>Fixtures for Markdown, SmartTable, DocumentPreview, LegalBlocks, Sources, security cases and v4 simulated streaming.</p>
        </div>
        <div className="rich-playground__flag-card" aria-label="Rich response flags">
          <strong>Design Mode {flags.designMode ? 'ON' : 'OFF'}</strong>
          <span>Rich {flags.richRenderer ? 'ON' : 'OFF'} · v4 {flags.streamProtocolV4 ? 'ON' : 'OFF'} · debug {flags.debugPanel ? 'ON' : 'OFF'}</span>
          <code>VITE_ENABLE_RICH_RESPONSE_DESIGN_MODE=true</code>
        </div>
      </header>

      <PlaygroundControls
        fixtures={filteredFixtures}
        selectedId={selectedFixture?.id || ''}
        category={category}
        renderPhase={renderPhase}
        renderSourcePanel={renderSourcePanel}
        previewWidth={previewWidth}
        onCategoryChange={handleCategoryChange}
        onFixtureChange={handleFixtureChange}
        onRenderPhaseChange={setRenderPhase}
        onRenderSourcePanelChange={setRenderSourcePanel}
        onPreviewWidthChange={setPreviewWidth}
      />

      <V4StreamSimulator events={v4RichLegalAnswerEvents} onMessageChange={setSimulatedMessage} />

      <PlaygroundMessagePreview
        fixture={selectedFixture}
        message={message}
        renderPhase={renderPhase}
        renderSourcePanel={renderSourcePanel}
        previewWidth={previewWidth}
      />
    </div>
  )
}

export default RichResponsePlayground
