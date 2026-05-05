import { useMemo, useState } from 'react'
import { applyV4StreamEvent, createV4StreamState } from '../streaming/streamProtocolV4.js'
import { eventToDisplayName } from './playgroundUtils.js'

function stateToMessage(state) {
  return {
    id: state.messageId || 'v4_simulated_message',
    role: 'assistant',
    status: state.status || 'loading',
    content: state.content || '',
    parts: state.parts || [],
    metadata: state.metadata || {}
  }
}

function V4StreamSimulator({ events, onMessageChange }) {
  const initialState = useMemo(() => createV4StreamState(), [])
  const [state, setState] = useState(initialState)
  const [index, setIndex] = useState(0)

  function applyNext() {
    const event = events[index]
    if (!event) return
    const nextState = applyV4StreamEvent(state, event)
    setState(nextState)
    setIndex(index + 1)
    onMessageChange(stateToMessage(nextState))
  }

  function reset() {
    const nextState = createV4StreamState()
    setState(nextState)
    setIndex(0)
    onMessageChange(stateToMessage(nextState))
  }

  function runAll() {
    const nextState = events.reduce((current, event) => applyV4StreamEvent(current, event), createV4StreamState())
    setState(nextState)
    setIndex(events.length)
    onMessageChange(stateToMessage(nextState))
  }

  return (
    <section className="rich-playground__simulator">
      <div className="rich-playground__simulator-header">
        <h2>V4 stream simulator</h2>
        <div>
          <button type="button" onClick={applyNext} disabled={index >= events.length}>Step</button>
          <button type="button" onClick={runAll}>Run all</button>
          <button type="button" onClick={reset}>Reset</button>
        </div>
      </div>
      <p>Event {Math.min(index, events.length)} of {events.length}</p>
      <ol className="rich-playground__events">
        {events.map((event, eventIndex) => (
          <li
            key={`${eventIndex}-${event.type}`}
            className={eventIndex < index ? 'rich-playground__event--done' : ''}
          >
            {eventToDisplayName(event)}
          </li>
        ))}
      </ol>
    </section>
  )
}

export default V4StreamSimulator
