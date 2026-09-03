import { describe, expect, it } from 'vitest'
import { bookings, inventory } from './data'
import { calculateMetrics, customerPerformance, customersToContact, monthlyPerformance } from './metrics'

describe('business metric calculations', () => {
  it('has valid dates, unique identifiers, numeric amounts and consistent repeat history', () => {
    expect(new Set(bookings.map((booking) => booking.booking_id)).size).toBe(bookings.length)
    const seen = new Set<string>()
    for (const booking of [...bookings].sort((a, b) => a.booking_date.localeCompare(b.booking_date))) {
      expect(new Date(`${booking.booking_date}T00:00:00Z`).toISOString().slice(0, 10)).toBe(booking.booking_date)
      expect(Number.isFinite(booking.booking_amount) && booking.booking_amount >= 0).toBe(true)
      expect(Number.isFinite(booking.duration_hours) && booking.duration_hours > 0).toBe(true)
      expect(['completed', 'planned']).toContain(booking.status)
      expect(booking.is_repeat_customer).toBe(seen.has(booking.customer_alias))
      seen.add(booking.customer_alias)
    }
    expect(new Set(inventory.map((item) => item.item_id)).size).toBe(inventory.length)
    for (const item of inventory) {
      expect(Number.isFinite(item.reference_price) && item.reference_price >= 0).toBe(true)
      expect(Number.isInteger(item.quantity_in_stock) && item.quantity_in_stock >= 0).toBe(true)
      if (item.usage_guidance_url) expect(new URL(item.usage_guidance_url).protocol).toBe('https:')
    }
  })

  it('reconciles monthly and customer totals to the booking records', () => {
    const metrics = calculateMetrics(bookings, inventory)
    const months = monthlyPerformance(bookings)
    const customers = customerPerformance(bookings)
    expect(months.reduce((total, month) => total + month.completedRevenue, 0)).toBe(metrics.completedRevenue)
    expect(months.reduce((total, month) => total + month.scheduledRevenue, 0)).toBe(metrics.scheduledRevenue)
    expect(customers.reduce((total, customer) => total + customer.revenue, 0)).toBe(metrics.totalRevenue)
    expect(customers.reduce((total, customer) => total + customer.bookings, 0)).toBe(metrics.totalBookings)
  })
  it('identifies past repeat customers without recent service or an upcoming booking', () => {
    const visit = (alias: string, date: string, status: 'completed' | 'planned' = 'completed') => ({ ...bookings[0], customer_alias: alias, booking_date: date, status })
    const records = [
      visit('Overdue', '2026-04-01'), visit('Overdue', '2026-07-02'),
      visit('Boundary', '2026-04-01'), visit('Boundary', '2026-07-03'),
      visit('Scheduled', '2026-04-01'), visit('Scheduled', '2026-05-01'), visit('Scheduled', '2026-10-01', 'planned'),
      visit('One visit', '2026-01-01'),
      visit('Oldest', '2026-01-01'), visit('Oldest', '2026-02-01'),
    ]
    expect(customersToContact(records, new Date('2026-09-03T12:00:00Z')).map((customer) => customer.alias)).toEqual(['Oldest', 'Overdue'])
  })

  it('clamps the two-month cutoff at month end', () => {
    const records = ['2026-01-01', '2026-02-28'].map((date) => ({ ...bookings[0], booking_date: date, status: 'completed' as const }))
    expect(customersToContact(records, new Date('2026-04-30T12:00:00Z'))).toHaveLength(0)
    expect(customersToContact(records, new Date('2026-05-01T12:00:00Z'))).toHaveLength(1)
  })
  it('matches every updated booking headline', () => {
    const metrics = calculateMetrics(bookings, inventory)
    expect(metrics).toMatchObject({
      totalBookings: 85,
      completedBookings: 59,
      plannedBookings: 26,
      totalRevenue: 11240,
      completedRevenue: 7545,
      scheduledRevenue: 3695,
      totalHours: 296,
      completedHours: 206,
      plannedHours: 90,
    })
    expect(metrics.averageRevenuePerBooking).toBeCloseTo(132.235, 3)
    expect(metrics.revenuePerServiceHour).toBeCloseTo(37.973, 3)
  })

  it('matches the verified inventory figures without multiplying by quantity', () => {
    const metrics = calculateMetrics(bookings, inventory)
    expect(metrics.inventoryItems).toBe(46)
    expect(metrics.inventoryValue).toBeCloseTo(710.11, 2)
  })

  it('tracks low stock and chemical coverage', () => {
    const lowStockNames = inventory
      .filter((item) => item.inventory_status === 'Running Low')
      .map((item) => item.item_name)

    expect(lowStockNames).toEqual(expect.arrayContaining([
      'P&S Pearl Auto Shampoo',
      'P&S Terminator Enzyme Spot & Stain Remover',
      'Inspire Black Nitrile Disposable Gloves',
    ]))
    expect(inventory.every((item) => ['In Stock', 'Running Low', 'Do Not Buy Again', 'Considering'].includes(item.inventory_status))).toBe(true)
    expect(inventory.find((item) => item.item_id === 'ADD-001')).toMatchObject({
      dilution_ratio: '1:50 to 1:150',
      estimated_cars_per_container: '54 to 160',
    })
    expect(inventory.find((item) => item.item_id === 'ADD-003')).toMatchObject({
      estimated_use_per_car: '6 oz',
      estimated_cars_per_container: '21',
    })
    expect(inventory.find((item) => item.item_id === 'ADD-005')).toMatchObject({
      dilution_ratio: '1 oz per gallon',
      estimated_cars_per_container: '25',
    })
    expect(inventory.find((item) => item.item_id === 'ADD-006')).toMatchObject({
      dilution_ratio: '1:8',
      estimated_use_per_car: '8 oz mixed solution',
      estimated_cars_per_container: '144',
    })
  })

  it('separates monthly completed performance from planned commitments', () => {
    const months = monthlyPerformance(bookings)
    expect(months).toHaveLength(11)
    expect(months.find((month) => month.month === '2026-01')).toMatchObject({ completedBookings: 3, plannedBookings: 0, completedRevenue: 355 })
    expect(months.find((month) => month.month === '2026-02')).toMatchObject({ completedBookings: 4, plannedBookings: 0, completedRevenue: 435 })
    expect(months.find((month) => month.month === '2026-08')).toMatchObject({ completedBookings: 9, plannedBookings: 0, completedRevenue: 1300 })
    expect(months.find((month) => month.month === '2026-09')).toMatchObject({ completedBookings: 0, plannedBookings: 6, scheduledRevenue: 855 })
  })

  it('derives repeat-customer performance from aliases', () => {
    const customers = customerPerformance(bookings)
    expect(customers).toHaveLength(57)
    expect(customers.filter((customer) => customer.bookings > 1)).toHaveLength(25)
    expect(bookings.filter((booking) => booking.is_repeat_customer)).toHaveLength(28)
  })
})
