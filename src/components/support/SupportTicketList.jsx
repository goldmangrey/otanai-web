// Path: src/components/support/SupportTicketList.jsx
import SupportTicketItem from './SupportTicketItem.jsx'

function SupportTicketList({ tickets, selectedId, onSelect }) {
  return (
    <div className="support-ticket-list">
      {tickets.length === 0 ? (
        <div className="support-empty">No tickets found.</div>
      ) : (
        tickets.map((ticket) => (
          <SupportTicketItem
            key={ticket.id}
            ticket={ticket}
            selected={ticket.id === selectedId}
            onSelect={onSelect}
          />
        ))
      )}
    </div>
  )
}

export default SupportTicketList
