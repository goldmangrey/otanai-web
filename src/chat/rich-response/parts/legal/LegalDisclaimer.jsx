import { normalizeLegalDisclaimerPart } from './legalBlockUtils.js'

function LegalDisclaimer({ part }) {
  const disclaimer = normalizeLegalDisclaimerPart(part)

  return (
    <details className="otan-legal-block otan-legal-disclaimer" open={!disclaimer.collapsed}>
      <summary className="otan-legal-disclaimer__summary">{disclaimer.title}</summary>
      <p className="otan-legal-block__text">{disclaimer.text}</p>
    </details>
  )
}

export default LegalDisclaimer
