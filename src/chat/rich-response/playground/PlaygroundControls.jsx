import { fixtureCategories } from './fixtures.js'

function PlaygroundControls({
  fixtures,
  selectedId,
  category,
  renderPhase,
  renderSourcePanel,
  previewWidth,
  onCategoryChange,
  onFixtureChange,
  onRenderPhaseChange,
  onRenderSourcePanelChange,
  onPreviewWidthChange
}) {
  return (
    <div className="rich-playground__controls">
      <label>
        Category
        <select value={category} onChange={(event) => onCategoryChange(event.target.value)}>
          {fixtureCategories.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>
      </label>

      <label>
        Fixture
        <select value={selectedId} onChange={(event) => onFixtureChange(event.target.value)}>
          {fixtures.map((fixture) => (
            <option key={fixture.id} value={fixture.id}>{fixture.title}</option>
          ))}
        </select>
      </label>

      <label>
        Render phase
        <select value={renderPhase} onChange={(event) => onRenderPhaseChange(event.target.value)}>
          <option value="">auto</option>
          <option value="draft">draft</option>
          <option value="final">final</option>
          <option value="error">error</option>
        </select>
      </label>

      <label>
        Preview width
        <select value={previewWidth} onChange={(event) => onPreviewWidthChange(event.target.value)}>
          <option value="desktop">desktop</option>
          <option value="tablet">tablet</option>
          <option value="mobile">mobile</option>
        </select>
      </label>

      <label className="rich-playground__checkbox">
        <input
          type="checkbox"
          checked={renderSourcePanel}
          onChange={(event) => onRenderSourcePanelChange(event.target.checked)}
        />
        Inline source_panel
      </label>
    </div>
  )
}

export default PlaygroundControls
