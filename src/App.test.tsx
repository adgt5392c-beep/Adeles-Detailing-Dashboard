import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { bookings } from './data'
import { customersToContact } from './metrics'
import { App } from './App'

describe('bookings interface', () => {
  it('shows the contact-soon list and its empty state', () => {
    vi.useFakeTimers()
    try {
      const today = new Date('2026-09-03T12:00:00Z')
      vi.setSystemTime(today)
      const view = render(<MemoryRouter initialEntries={['/customers']}><App /></MemoryRouter>)
      const section = within(screen.getByRole('region', { name: 'Contact soon' }))
      const eligible = customersToContact(bookings, today)
      expect(eligible.length).toBeGreaterThan(0)
      expect(section.getAllByRole('row')).toHaveLength(eligible.length + 1)
      eligible.forEach((customer) => expect(section.getByText(customer.alias)).toBeInTheDocument())
      view.unmount()
      vi.setSystemTime(new Date('2026-01-01T12:00:00Z'))
      render(<MemoryRouter initialEntries={['/customers']}><App /></MemoryRouter>)
      expect(screen.getByText('No repeat customers need a follow-up right now.')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
  it('filters the anonymized booking table by status', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/bookings']}><App /></MemoryRouter>)
    expect(screen.getByText('85 records')).toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Filter by status'), 'planned')
    expect(screen.getByText('26 records')).toBeInTheDocument()
    expect(screen.queryByText('BK-0001')).not.toBeInTheDocument()
  })

  it('shows a useful empty state after an unmatched search', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter initialEntries={['/bookings']}><App /></MemoryRouter>)
    await user.type(screen.getByLabelText('Search bookings'), 'not a real alias')
    expect(screen.getByText('No bookings match')).toBeInTheDocument()
    expect(screen.getByText('0 records')).toBeInTheDocument()
  })

  it('orders returning customers by most recent service date', () => {
    render(<MemoryRouter initialEntries={['/customers']}><App /></MemoryRouter>)
    const newest = screen.getByText('Marley Adams')
    const next = screen.getByText('Quinn Foster')
    expect(newest.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText('Independent Mobile Detailing')).toBeInTheDocument()
  })
})
