// Path: src/components/support/SupportTicketItem.jsx
function SupportTicketItem({ ticket, selected, onSelect }) {
  return (
    <button
      type="button"
      className={`support-ticket ${selected ? 'is-selected' : ''}`}
      onClick={() => onSelect(ticket)}
    >
      <div className="support-ticket-header">
        <span className="support-ticket-id">{ticket.shortId}</span>
        <span className={`support-ticket-status status-${ticket.status}`}
        >
          {ticket.status}
        </span>
      </div>
      <div className="support-ticket-preview">{ticket.lastMessagePreview || 'No messages yet'}</div>
      <div className="support-ticket-meta">
        <span>{ticket.updatedAtLabel || '—'}</span>
        {ticket.unread ? <span className="support-ticket-unread">Unread</span> : null}
      </div>
    </button>
  )
}

export default SupportTicketItem
