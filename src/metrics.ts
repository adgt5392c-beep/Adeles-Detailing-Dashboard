import type { Booking, InventoryItem } from './data'

export const sum = (values: number[]) => values.reduce((total, value) => total + value, 0)

export function customersToContact(bookings: Booking[], now = new Date()) {
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now)
  const [year, month, day] = today.split('-').map(Number)
  const cutoffDate = new Date(Date.UTC(year, month - 3, 1))
  const lastDay = new Date(Date.UTC(cutoffDate.getUTCFullYear(), cutoffDate.getUTCMonth() + 1, 0)).getUTCDate()
  cutoffDate.setUTCDate(Math.min(day, lastDay))
  const cutoff = cutoffDate.toISOString().slice(0, 10)
  const scheduled = new Set(bookings.filter((booking) => booking.status === 'planned' && booking.booking_date >= today).map((booking) => booking.customer_alias))
  return customerPerformance(bookings.filter((booking) => booking.status === 'completed' && booking.booking_date <= today))
    .filter((customer) => customer.completed > 1 && customer.lastBooking < cutoff && !scheduled.has(customer.alias))
    .sort((a, b) => a.lastBooking.localeCompare(b.lastBooking) || a.alias.localeCompare(b.alias))
}

export function calculateMetrics(bookings: Booking[], inventory: InventoryItem[]) {
  const completed = bookings.filter((booking) => booking.status === 'completed')
  const planned = bookings.filter((booking) => booking.status === 'planned')
  const completedRevenue = sum(completed.map((booking) => booking.booking_amount))
  const scheduledRevenue = sum(planned.map((booking) => booking.booking_amount))
  const completedHours = sum(completed.map((booking) => booking.duration_hours))
  const plannedHours = sum(planned.map((booking) => booking.duration_hours))
  const totalRevenue = completedRevenue + scheduledRevenue
  const totalHours = completedHours + plannedHours

  return {
    totalBookings: bookings.length,
    completedBookings: completed.length,
    plannedBookings: planned.length,
    completedRevenue,
    scheduledRevenue,
    totalRevenue,
    completedHours,
    plannedHours,
    totalHours,
    averageRevenuePerBooking: totalRevenue / bookings.length,
    revenuePerServiceHour: totalRevenue / totalHours,
    completedRevenuePerHour: completedRevenue / completedHours,
    inventoryItems: inventory.length,
    inventoryValue: sum(inventory.map((item) => item.reference_price)),
  }
}

export function monthlyPerformance(bookings: Booking[]) {
  const months = new Map<string, { month: string; label: string; bookings: number; completedBookings: number; plannedBookings: number; completedRevenue: number; scheduledRevenue: number; revenue: number; hours: number }>()
  bookings.forEach((booking) => {
    const key = booking.booking_date.slice(0, 7)
    const current = months.get(key) ?? {
      month: key,
      label: new Intl.DateTimeFormat('en-US', { month: 'short' }).format(new Date(`${key}-01T00:00:00`)),
      bookings: 0, completedBookings: 0, plannedBookings: 0, completedRevenue: 0,
      scheduledRevenue: 0, revenue: 0, hours: 0,
    }
    current.bookings += 1
    current.hours += booking.duration_hours
    current.revenue += booking.booking_amount
    if (booking.status === 'completed') {
      current.completedBookings += 1
      current.completedRevenue += booking.booking_amount
    } else {
      current.plannedBookings += 1
      current.scheduledRevenue += booking.booking_amount
    }
    months.set(key, current)
  })
  return [...months.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export function customerPerformance(bookings: Booking[]) {
  const customers = new Map<string, { alias: string; bookings: number; completed: number; planned: number; revenue: number; completedRevenue: number; hours: number; firstBooking: string; lastBooking: string }>()
  bookings.forEach((booking) => {
    const current = customers.get(booking.customer_alias) ?? {
      alias: booking.customer_alias, bookings: 0, completed: 0, planned: 0, revenue: 0,
      completedRevenue: 0, hours: 0, firstBooking: booking.booking_date, lastBooking: booking.booking_date,
    }
    current.bookings += 1
    current.revenue += booking.booking_amount
    current.hours += booking.duration_hours
    current.firstBooking = current.firstBooking < booking.booking_date ? current.firstBooking : booking.booking_date
    current.lastBooking = current.lastBooking > booking.booking_date ? current.lastBooking : booking.booking_date
    if (booking.status === 'completed') {
      current.completed += 1
      current.completedRevenue += booking.booking_amount
    } else current.planned += 1
    customers.set(booking.customer_alias, current)
  })
  return [...customers.values()].sort((a, b) => b.bookings - a.bookings || b.revenue - a.revenue)
}
