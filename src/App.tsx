import { ArrowLeft, ArrowRight, ArrowUpRight, BarChart3, CalendarDays, CheckCircle2, Clock3, Filter, Gauge, Menu, Package, Search, ShieldCheck, Sparkles, TrendingUp, Users, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { bookings, inventory, recordedCashExpense, type Booking } from './data'
import { calculateMetrics, customerPerformance, customersToContact, monthlyPerformance } from './metrics'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })
const preciseCurrency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const number = new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 })
const dateLabel = (date: string) => new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${date}T00:00:00`))
const metrics = calculateMetrics(bookings, inventory)
const monthly = monthlyPerformance(bookings)
const customers = customerPerformance(bookings)
const repeatBookings = bookings.filter((booking) => booking.is_repeat_customer).length
const returningCustomers = customers.filter((customer) => customer.bookings > 1).length
const peakMonth = monthly.reduce((peak, month) => month.revenue > peak.revenue ? month : peak, monthly[0])
const longMonth = (month: string) => new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(`${month}-01T00:00:00`))

const nav = [
  ['Overview', '/', BarChart3], ['Growth', '/growth', TrendingUp], ['Bookings', '/bookings', Filter],
  ['Calendar', '/calendar', CalendarDays], ['Customers', '/customers', Users], ['Efficiency', '/efficiency', Gauge],
  ['Inventory', '/inventory', Package], ['Business model', '/methodology', ShieldCheck],
] as const

function Shell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mobile, setMobile] = useState(() => window.matchMedia?.('(max-width: 760px)').matches ?? false)
  const sidebarRef = useRef<HTMLElement>(null)
  const menuRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (!window.matchMedia) return
    const query = window.matchMedia('(max-width: 760px)')
    const update = () => { setMobile(query.matches); setOpen(false) }
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  useEffect(() => {
    if (!open || !mobile) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const controls = () => Array.from(sidebarRef.current?.querySelectorAll<HTMLElement>('button, a') ?? [])
    controls()[0]?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); setOpen(false) }
      if (event.key === 'Tab') {
        const items = controls()
        const first = items[0]
        const last = items.at(-1)
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', onKey)
      menuRef.current?.focus()
    }
  }, [open, mobile])
  return <div className="app-shell">
    <aside id="sidebar" ref={sidebarRef} inert={mobile && !open} className={open ? 'sidebar sidebar-open' : 'sidebar'}>
      <div className="brand-row"><div className="brand-mark"><Sparkles size={19} /></div><div><strong>Adele's Mobile Detailing</strong><span>Business dashboard</span></div><button className="icon-button close-menu" onClick={() => setOpen(false)} aria-label="Close navigation"><X /></button></div>
      <nav aria-label="Primary navigation">{nav.map(([label, to, Icon]) => <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}><Icon size={17} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-note"><span className="status-dot" />Calculated from my business records<strong>{metrics.totalBookings} bookings · {metrics.inventoryItems} inventory items</strong></div>
    </aside>
    {open && <button className="scrim" onClick={() => setOpen(false)} aria-label="Close menu backdrop" tabIndex={-1} />}
    <main className="main-area" inert={mobile && open}><header className="topbar"><button ref={menuRef} aria-expanded={open} aria-controls="sidebar" className="icon-button menu-button" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu /></button><div><span>Atlanta, GA</span><strong>Independent Mobile Detailing</strong></div><strong className="mobile-brand">Adele's Mobile Detailing</strong><div className="privacy-pill">Customer names anonymized</div></header>{children}</main>
  </div>
}

function PageHeading({ eyebrow, title, children, action }: { eyebrow: string; title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="page-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{children}</p></div>{action}</section>
}

function MetricCard({ label, value, note }: { label: string; value: string; note: string }) {
  return <article className="metric-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></article>
}

function ChartPanel({ title, eyebrow, children, className = '' }: { title: string; eyebrow: string; children: React.ReactNode; className?: string }) {
  return <article className={`panel chart-panel ${className}`}><div className="panel-title"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{children}</article>
}

function Overview() {
  return <div className="page"><PageHeading eyebrow="Overview" title="Bookings and revenue" action={<Link className="button" to="/methodology">How I run the business <ArrowUpRight size={17} /></Link>}>Completed work is earned revenue. Planned work stays in my schedule.</PageHeading>
    <section className="spotlight-grid">
      <article className="spotlight spotlight-earned"><span>Completed revenue</span><strong>{currency.format(metrics.completedRevenue)}</strong><p>Earned across {metrics.completedBookings} finished appointments</p><div className="mini-stat"><Clock3 size={16} /> {metrics.completedHours} completed hours</div></article>
      <article className="spotlight spotlight-planned"><span>Scheduled revenue</span><strong>{currency.format(metrics.scheduledRevenue)}</strong><p>Planned across {metrics.plannedBookings} future appointments</p><div className="mini-stat"><CalendarDays size={16} /> Future commitments</div></article>
      <article className="spotlight spotlight-total"><span>Total booked revenue</span><strong>{currency.format(metrics.totalRevenue)}</strong><p>Completed plus planned bookings</p><div className="progress-track"><span style={{ width: `${(metrics.completedRevenue / metrics.totalRevenue) * 100}%` }} /></div><small>{Math.round((metrics.completedRevenue / metrics.totalRevenue) * 100)}% earned</small></article>
    </section>
    <section className="metric-grid"><MetricCard label="Total bookings" value={String(metrics.totalBookings)} note={`${metrics.completedBookings} completed · ${metrics.plannedBookings} planned`} /><MetricCard label="Total service hours" value={`${metrics.totalHours}`} note={`${metrics.completedHours} completed · ${metrics.plannedHours} planned`} /><MetricCard label="Average per booking" value={preciseCurrency.format(metrics.averageRevenuePerBooking)} note="All booked appointments" /><MetricCard label="Revenue per service hour" value={preciseCurrency.format(metrics.revenuePerServiceHour)} note="Booked revenue ÷ booked hours" /></section>
    <section className="dashboard-grid"><ChartPanel eyebrow="Revenue status" title="Earned and scheduled"><div className="chart-wrap small" aria-label="Pie chart showing completed and scheduled revenue"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie isAnimationActive={false} data={[{ name: 'Completed', value: metrics.completedRevenue }, { name: 'Scheduled', value: metrics.scheduledRevenue }]} innerRadius={58} outerRadius={84} paddingAngle={3} dataKey="value"><Cell fill="#0d9488" /><Cell fill="#2563eb" /></Pie><Tooltip formatter={(value) => currency.format(Number(value))} /><Legend /></PieChart></ResponsiveContainer></div></ChartPanel>
      <ChartPanel eyebrow="By month" title="Booked revenue"><div className="chart-wrap small" aria-label="Area chart of monthly booked revenue"><ResponsiveContainer width="100%" height="100%"><AreaChart data={monthly} margin={{ top: 10, right: 8, left: -12, bottom: 0 }}><defs><linearGradient id="overviewRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.25}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#e7edf4" vertical={false}/><XAxis dataKey="label" tickLine={false}/><YAxis tickFormatter={(value) => `$${value}`} tickLine={false}/><Tooltip formatter={(value) => currency.format(Number(value))}/><Area isAnimationActive={false} type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} fill="url(#overviewRevenue)" name="Booked revenue" /></AreaChart></ResponsiveContainer></div></ChartPanel></section>
    <section className="two-column"><article className="panel"><div className="panel-heading"><div><p className="eyebrow">Business model</p><h2>Pricing and service hours</h2></div><Users /></div><p>I price by vehicle and service, then compare booked revenue with service hours.</p><Link className="text-link" to="/efficiency">View revenue and labor <ArrowUpRight size={16} /></Link></article><article className="panel data-note"><p className="eyebrow">Costs</p><h2>Expenses still to track</h2><p>Gas and supplies are not fully quantified. Completed and scheduled revenue stay separate.</p></article></section>
  </div>
}

function Growth() {
  return <div className="page"><PageHeading eyebrow="Growth" title="Monthly growth">Bookings and revenue show how my business grew from January.</PageHeading>
    <section className="metric-grid"><MetricCard label="Business start" value={longMonth(monthly[0].month)} note="I launched the company in January" /><MetricCard label="Peak booked month" value={longMonth(peakMonth.month).replace(' 2026', '')} note={`${currency.format(peakMonth.revenue)} across ${peakMonth.bookings} bookings`} /><MetricCard label="Months represented" value={String(monthly.length)} note={`${monthly[0].label} through ${monthly.at(-1)?.label}`} /><MetricCard label="Scheduled revenue" value={currency.format(metrics.scheduledRevenue)} note={`${metrics.plannedBookings} planned bookings`} /></section>
    <section className="section-stack"><ChartPanel eyebrow="Revenue" title="Revenue by month"><div className="chart-wrap" aria-label="Stacked bar chart of monthly completed and scheduled revenue"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke="#e7edf4" vertical={false}/><XAxis dataKey="label" tickLine={false}/><YAxis tickFormatter={(value) => `$${value}`} tickLine={false}/><Tooltip formatter={(value) => currency.format(Number(value))}/><Legend/><Bar isAnimationActive={false} dataKey="completedRevenue" stackId="revenue" fill="#0d9488" name="Completed revenue" radius={[4,4,0,0]}/><Bar isAnimationActive={false} dataKey="scheduledRevenue" stackId="revenue" fill="#2563eb" name="Scheduled revenue" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></ChartPanel></section><div className="notice"><CheckCircle2/><div><strong>Completed vs. planned</strong><span>Completed bookings are earned. Planned bookings are scheduled.</span></div></div>
  </div>
}

function StatusBadge({ status }: { status: Booking['status'] }) { return <span className={`badge ${status}`}>{status}</span> }

function Bookings() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const [service, setService] = useState('all')
  const services = [...new Set(bookings.map((booking) => booking.service))]
  const filtered = useMemo(() => bookings.filter((booking) => {
    const text = `${booking.booking_id} ${booking.customer_alias} ${booking.service} ${booking.vehicle_class}`.toLowerCase()
    return text.includes(query.trim().toLowerCase()) && (status === 'all' || booking.status === status) && (service === 'all' || booking.service === service)
  }).sort((a, b) => a.booking_date.localeCompare(b.booking_date)), [query, status, service])
  return <div className="page"><PageHeading eyebrow="All appointments" title="Bookings">Search completed and planned appointments.</PageHeading>
    <div className="toolbar"><label className="search-field"><Search size={17}/><span className="sr-only">Search bookings</span><input aria-label="Search bookings" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bookings"/></label><label><span>Status</span><select aria-label="Filter by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="all">All statuses</option><option value="completed">Completed</option><option value="planned">Planned</option></select></label><label><span>Service</span><select aria-label="Filter by service" value={service} onChange={(event) => setService(event.target.value)}><option value="all">All services</option>{services.map((value) => <option value={value} key={value}>{value.includes('Hydroseal') ? 'Detail + Hydroseal' : 'Full detail'}</option>)}</select></label><strong className="result-count">{filtered.length} records</strong></div>
    <div className="table-card"><div className="table-scroll"><table><caption className="sr-only">Bookings</caption><thead><tr><th>Date</th><th>Customer</th><th>Service</th><th>Vehicle</th><th>Status</th><th className="numeric">Hours</th><th className="numeric">Amount</th></tr></thead><tbody>{filtered.map((booking) => <tr key={booking.booking_id}><td><strong>{dateLabel(booking.booking_date)}</strong><small>{booking.booking_id}</small></td><td>{booking.customer_alias}{booking.is_repeat_customer && <span className="repeat-tag">Repeat</span>}</td><td>{booking.service.includes('Hydroseal') ? 'Full detail + Hydroseal' : 'Full interior & exterior detail'}</td><td>{booking.vehicle_class}</td><td><StatusBadge status={booking.status}/></td><td className="numeric">{booking.duration_hours}</td><td className="numeric"><strong>{currency.format(booking.booking_amount)}</strong></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="empty-state"><Search/><strong>No bookings match</strong><span>Try clearing or changing the filters.</span></div>}</div>
  </div>
}

function Calendar() {
  const months = [...new Set(bookings.map((booking) => booking.booking_date.slice(0,7)))].sort()
  const [monthIndex, setMonthIndex] = useState(0)
  const activeMonth = months[monthIndex]
  const first = new Date(`${activeMonth}-01T00:00:00`)
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate()
  const leading = first.getDay()
  const slots = [...Array(leading).fill(null), ...Array.from({ length: daysInMonth }, (_, index) => index + 1)]
  const byDay = new Map<number, Booking[]>()
  bookings.filter((booking) => booking.booking_date.startsWith(activeMonth)).forEach((booking) => { const day = Number(booking.booking_date.slice(-2)); byDay.set(day, [...(byDay.get(day) ?? []), booking]) })
  const title = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(first)
  return <div className="page"><PageHeading eyebrow="Schedule" title="Booking calendar">Completed and planned appointments by service date.</PageHeading>
    <div className="calendar-toolbar"><button onClick={() => setMonthIndex((value) => Math.max(0, value - 1))} disabled={monthIndex === 0} aria-label="Previous month"><ArrowLeft/></button><h2>{title}</h2><button onClick={() => setMonthIndex((value) => Math.min(months.length - 1, value + 1))} disabled={monthIndex === months.length - 1} aria-label="Next month"><ArrowRight/></button></div>
    <div className="calendar-legend"><span><i className="legend-dot completed"/>Completed</span><span><i className="legend-dot planned"/>Planned</span></div>
    <div className="calendar"><div className="weekdays">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((day) => <strong key={day}>{day}</strong>)}</div><div className="calendar-grid">{slots.map((day, index) => <div key={`${day}-${index}`} className={`calendar-day ${day ? '' : 'blank'}`}>{day && <><span className="day-number">{day}</span>{(byDay.get(day) ?? []).map((booking) => <article key={booking.booking_id} className={`calendar-booking ${booking.status}`}><strong>{booking.customer_alias}</strong><span>{booking.service.includes('Hydroseal') ? 'Detail + Hydroseal' : 'Full detail'}</span><small>{booking.vehicle_class} · {booking.status}</small></article>)}</>}</div>)}</div></div>
  </div>
}

function Customers() {
  const contactSoon = customersToContact(bookings)
  const returning = customers
    .filter((customer) => customer.bookings > 1)
    .sort((a, b) => b.lastBooking.localeCompare(a.lastBooking))
  return <div className="page"><PageHeading eyebrow="Retention" title="Repeat customers">I track return visits and booked revenue by customer.</PageHeading>
    <section className="table-card" aria-labelledby="contact-soon-heading">
      <div className="table-title"><div><h2 id="contact-soon-heading">Contact soon</h2><p className="muted">Repeat customers with no service in over two months and no upcoming booking.</p></div><span>{contactSoon.length} customers</span></div>
      {contactSoon.length ? <div className="table-scroll"><table><thead><tr><th>Customer</th><th>Last service</th><th className="numeric">Completed visits</th></tr></thead><tbody>{contactSoon.map((customer) => <tr key={customer.alias}><td><strong>{customer.alias}</strong></td><td>{dateLabel(customer.lastBooking)}</td><td className="numeric">{customer.completed}</td></tr>)}</tbody></table></div> : <p className="empty-note muted">No repeat customers need a follow-up right now.</p>}
    </section>
    <section className="metric-grid"><MetricCard label="Customers" value={String(customers.length)} note="Unique customers"/><MetricCard label="Repeat bookings" value={String(repeatBookings)} note={`${number.format(repeatBookings / bookings.length * 100)}% of all bookings`}/><MetricCard label="Returning customers" value={String(returningCustomers)} note={`${number.format(returningCustomers / customers.length * 100)}% of customers`}/><MetricCard label="Repeat booked revenue" value={currency.format(bookings.filter((booking) => booking.is_repeat_customer).reduce((sum, booking) => sum + booking.booking_amount, 0))} note="Completed and planned repeat visits"/></section>
    <section className="dashboard-grid"><ChartPanel eyebrow="Booking mix" title="First and repeat bookings"><div className="chart-wrap small" aria-label="Pie chart of first and repeat bookings"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie isAnimationActive={false} data={[{ name: 'First booking', value: bookings.length - repeatBookings }, { name: 'Repeat booking', value: repeatBookings }]} innerRadius={58} outerRadius={84} paddingAngle={3} dataKey="value"><Cell fill="#2563eb"/><Cell fill="#0d9488"/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div></ChartPanel><article className="panel"><p className="eyebrow">Repeat goal</p><h2>{repeatBookings / bookings.length >= 0.3 ? '30% target reached' : '30% repeat-booking target'}</h2><div className="goal-value"><strong>{number.format(repeatBookings / bookings.length * 100)}%</strong><span>of bookings are return visits</span></div><div className="goal-track"><span style={{ width: `${Math.min(100, repeatBookings / bookings.length * 100 / 30 * 100)}%` }}/></div><p className="muted">Repeat bookings and returning customers are tracked separately.</p></article></section>
    <div className="table-card"><div className="table-title"><div><p className="eyebrow">Repeat performance</p><h2>Customers with multiple bookings</h2></div><span>Most recent booking first</span></div><div className="table-scroll"><table><thead><tr><th>Customer</th><th className="numeric">Bookings</th><th className="numeric">Completed</th><th className="numeric">Planned</th><th className="numeric">Booked revenue</th><th>Latest booking date</th></tr></thead><tbody>{returning.map((customer) => <tr key={customer.alias}><td><strong>{customer.alias}</strong></td><td className="numeric">{customer.bookings}</td><td className="numeric">{customer.completed}</td><td className="numeric">{customer.planned}</td><td className="numeric"><strong>{currency.format(customer.revenue)}</strong></td><td>{dateLabel(customer.lastBooking)}</td></tr>)}</tbody></table></div></div>
  </div>
}

function Efficiency() {
  const efficiency = monthly.map((month) => ({ ...month, revenuePerHour: Math.round(month.revenue / month.hours * 10) / 10 }))
  return <div className="page"><PageHeading eyebrow="Efficiency" title="Revenue and labor">I compare booked revenue with service hours to guide pricing and scheduling.</PageHeading>
    <section className="metric-grid"><MetricCard label="Completed revenue / hour" value={preciseCurrency.format(metrics.completedRevenuePerHour)} note="Earned revenue ÷ completed hours"/><MetricCard label="Booked revenue / hour" value={preciseCurrency.format(metrics.revenuePerServiceHour)} note="All booked revenue ÷ all service hours"/><MetricCard label="Average service time" value={`${number.format(metrics.totalHours / metrics.totalBookings)} hrs`} note="Per completed or planned booking"/><MetricCard label="Completed operating contribution" value={currency.format(metrics.completedRevenue - recordedCashExpense)} note={`Revenue less ${currency.format(recordedCashExpense)} recorded cash expense*`}/></section>
    <div className="notice caution"><ShieldCheck/><div><strong>*Operating contribution</strong><span>Market research compensation paid for gas and about $400 of inventory. Gas use is not fully quantified. My separate cash expense is {currency.format(recordedCashExpense)} for business cards.</span></div></div>
    <section className="section-stack"><ChartPanel eyebrow="Hourly rate" title="Revenue per service hour"><div className="chart-wrap" aria-label="Line chart of monthly revenue per service hour"><ResponsiveContainer width="100%" height="100%"><LineChart data={efficiency} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke="#e7edf4" vertical={false}/><XAxis dataKey="label"/><YAxis domain={[0, 'auto']} tickFormatter={(value) => `$${value}`}/><Tooltip formatter={(value) => preciseCurrency.format(Number(value))}/><Line isAnimationActive={false} type="monotone" dataKey="revenuePerHour" stroke="#0d9488" strokeWidth={3} dot={{ r: 4 }} name="Revenue / hour"/></LineChart></ResponsiveContainer></div></ChartPanel><ChartPanel eyebrow="Workload" title="Bookings and hours"><div className="chart-wrap" aria-label="Bar chart comparing monthly bookings and service hours"><ResponsiveContainer width="100%" height="100%"><BarChart data={monthly} margin={{ top: 12, right: 10, left: 0, bottom: 0 }}><CartesianGrid stroke="#e7edf4" vertical={false}/><XAxis dataKey="label"/><YAxis/><Tooltip/><Legend/><Bar isAnimationActive={false} dataKey="bookings" fill="#2563eb" name="Appointments" radius={[4,4,0,0]}/><Bar isAnimationActive={false} dataKey="hours" fill="#94a3b8" name="Service hours" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer></div></ChartPanel></section>
  </div>
}

function Inventory() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('all')
  const categories = [...new Set(inventory.map((item) => item.category))].sort()
  const filtered = inventory.filter((item) => `${item.item_name} ${item.category} ${item.inventory_status}`.toLowerCase().includes(query.trim().toLowerCase()) && (category === 'all' || item.category === category))
  const lowStock = inventory.filter((item) => item.inventory_status === 'Running Low').length
  return <div className="page"><PageHeading eyebrow="Supplies and equipment" title="Inventory">I track each item and its recorded value.</PageHeading>
    <section className="metric-grid"><MetricCard label="Inventory items" value={String(metrics.inventoryItems)} note="Items tracked"/><MetricCard label="Recorded value" value={preciseCurrency.format(metrics.inventoryValue)} note="Sum of recorded prices"/><MetricCard label="Categories" value={String(categories.length)} note="Product and equipment types"/><MetricCard label="Running low" value={String(lowStock)} note="Items to restock"/></section>
    <div className="notice caution"><Package/><div><strong>Inventory value</strong><span>{preciseCurrency.format(metrics.inventoryValue)} is the sum of recorded prices, not a current replacement quote.</span></div></div>
    <div className="notice"><Package/><div><strong>Chemical coverage</strong><span>Coverage is per full container, not remaining stock. Ratios show product to water. My usage varies with vehicle condition.</span></div></div>
    <div className="toolbar"><label className="search-field"><Search size={17}/><input aria-label="Search inventory" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search inventory"/></label><label><span>Category</span><select aria-label="Filter inventory by category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All categories</option>{categories.map((value) => <option value={value} key={value}>{value}</option>)}</select></label><strong className="result-count">{filtered.length} items</strong></div>
    <div className="table-card"><div className="table-scroll"><table><thead><tr><th>Item</th><th>Category</th><th className="numeric">In stock</th><th>Package / basis</th><th>Status</th><th>Chemical use</th><th className="numeric">Reference price</th></tr></thead><tbody>{filtered.map((item) => <tr key={item.item_id}><td><strong>{item.item_name}</strong><small>{item.item_id}</small></td><td>{item.category}</td><td className="numeric">{item.quantity_in_stock}</td><td>{item.package_size}<small>{item.price_basis}</small></td><td><span className={`inventory-badge ${item.inventory_status.toLowerCase().replaceAll(' ', '-')}`}>{item.inventory_status}</span></td><td className="usage-estimate">{item.dilution_ratio ? <><strong>{item.dilution_ratio}</strong><small>{item.estimated_use_per_car} per car · about {item.estimated_cars_per_container} cars per full container</small><a href={item.usage_guidance_url} target="_blank" rel="noopener noreferrer" aria-label={`Product information for ${item.item_name} (opens in a new tab)`}>Product information</a></> : null}</td><td className="numeric"><strong>{preciseCurrency.format(item.reference_price)}</strong></td></tr>)}</tbody></table></div>{filtered.length === 0 && <div className="empty-state"><Search/><strong>No inventory matches</strong><span>Try clearing the search or category filter.</span></div>}</div>
  </div>
}

function Methodology() {
  return <div className="page story-page"><PageHeading eyebrow="Business model" title="How I run Adele's Mobile Detailing">I manage the business and complete every service.</PageHeading>
    <section className="story-hero"><div><p className="eyebrow">Why I started</p><h2>A schedule I can control</h2><p>I started the business in January 2026 while in high school. Detailing lets me earn money without late weeknight shifts. I learned the process on my own car before taking customer bookings.</p></div><div className="story-facts"><div><span>Started</span><strong>January 2026</strong></div><div><span>Initial expenses recovered</span><strong>End of February</strong></div></div></section>
    <section className="method-grid"><article className="panel"><p className="eyebrow">Pricing</p><h2>Price by job</h2><p>Vehicle size and Hydroseal upgrades change the price.</p></article><article className="panel"><p className="eyebrow">Scheduling</p><h2>Plan service days</h2><p>I plan around travel and service hours.</p></article><article className="panel"><p className="eyebrow">Repeat business</p><h2>Track return visits</h2><p>Booking history shows which customers return.</p></article><article className="panel"><p className="eyebrow">Inventory</p><h2>Restock supplies</h2><p>Stock status guides what I restock next.</p></article></section>
    <section className="status-grid"><article className="panel"><CheckCircle2/><h2>Completed</h2><strong>{currency.format(metrics.completedRevenue)}</strong><p>{metrics.completedBookings} finished bookings and {metrics.completedHours} hours.</p></article><article className="panel"><CalendarDays/><h2>Planned</h2><strong>{currency.format(metrics.scheduledRevenue)}</strong><p>{metrics.plannedBookings} future bookings and {metrics.plannedHours} hours.</p></article></section>
    <section className="goals panel"><p className="eyebrow">Goals</p><h2>What I am working toward</h2><ul><li>Six completed details per month.</li><li>$900 in monthly completed revenue.</li><li>$145 average completed booking value.</li><li>At least $42 per completed service hour.</li><li>30% repeat-booking rate.</li><li>75 completed bookings.</li></ul></section>
    <div className="notice"><ShieldCheck/><div><strong>Low cash overhead</strong><span>Market research compensation paid for gas and about $400 of inventory. I recovered my initial expenses by the end of February. Customer names are aliases.</span></div></div>
  </div>
}

export function App() { return <Shell><Routes><Route path="/" element={<Overview/>}/><Route path="/growth" element={<Growth/>}/><Route path="/bookings" element={<Bookings/>}/><Route path="/calendar" element={<Calendar/>}/><Route path="/customers" element={<Customers/>}/><Route path="/efficiency" element={<Efficiency/>}/><Route path="/inventory" element={<Inventory/>}/><Route path="/methodology" element={<Methodology/>}/><Route path="*" element={<Overview/>}/></Routes></Shell> }
