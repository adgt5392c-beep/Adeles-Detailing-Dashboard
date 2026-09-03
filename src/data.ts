import Papa from 'papaparse'
import bookingsCsv from '../bookings.csv?raw'
import inventoryCsv from '../inventory.csv?raw'
import businessInfo from '../business_info.md?raw'

export type BookingStatus = 'completed' | 'planned'

export interface Booking {
  booking_id: string
  booking_date: string
  customer_alias: string
  service: string
  vehicle_class: string
  booking_amount: number
  direct_material_cost: number | null
  other_direct_cost: number | null
  duration_hours: number
  status: BookingStatus
  is_repeat_customer: boolean
}

export interface InventoryItem {
  item_id: string
  item_name: string
  category: string
  quantity_in_stock: number
  package_size: string
  reference_price: number
  price_basis: string
  source_or_asin: string
  product_url: string
  pricing_evidence_url: string
  price_checked: string
  confidence: string
  inventory_status: string
  notes: string
  dilution_ratio: string
  estimated_use_per_car: string
  estimated_cars_per_container: string
  usage_guidance_url: string
}

const parse = <T extends Record<string, unknown>>(csv: string) => {
  const result = Papa.parse<T>(csv, { header: true, skipEmptyLines: true })
  if (result.errors.length) throw new Error(result.errors[0].message)
  return result.data
}

const rawBookings = parse<Record<string, string>>(bookingsCsv)
const rawInventory = parse<Record<string, string>>(inventoryCsv)

export const bookings: Booking[] = rawBookings.map((row) => ({
  ...row,
  booking_amount: Number(row.booking_amount),
  duration_hours: Number(row.duration_hours),
  direct_material_cost: row.direct_material_cost ? Number(row.direct_material_cost) : null,
  other_direct_cost: row.other_direct_cost ? Number(row.other_direct_cost) : null,
  status: row.status as BookingStatus,
  is_repeat_customer: row.is_repeat_customer === 'true',
})) as Booking[]

export const inventory: InventoryItem[] = rawInventory.map((row) => ({
  ...row,
  quantity_in_stock: Number(row.quantity_in_stock),
  reference_price: Number(row.reference_price),
})) as InventoryItem[]

const recordedExpenseMatch = businessInfo.match(/recorded cash business expense is \$(\d+(?:\.\d+)?)/i)
export const recordedCashExpense = recordedExpenseMatch ? Number(recordedExpenseMatch[1]) : 0
