// ── Thermal receipt printing ───────────────────────────────────────────────
// On Android, the browser's window.print() cannot reach a USB/Bluetooth thermal
// printer — it only offers "Save as PDF". So on Android we hand the receipt to
// RawBT (https://rawbt.ru), the de-facto ESC/POS print service for Android.
// The user installs RawBT once, picks their USB printer + paper width, and from
// then on we send the receipt straight to it via the `rawbt:` / `intent:` URL
// scheme. On desktop we keep the normal window.print() path.

import { fmt, fmtDate } from './utils.js'

// ESC/POS control codes (RawBT interprets these inside the text stream)
const ESC = '\x1B'
const GS  = '\x1D'
const INIT       = ESC + '@'            // initialise printer
const ALIGN_L    = ESC + 'a' + '\x00'
const ALIGN_C    = ESC + 'a' + '\x01'
const BOLD_ON    = ESC + 'E' + '\x01'
const BOLD_OFF   = ESC + 'E' + '\x00'
const FEED_CUT   = '\n\n\n' + GS + 'V' + '\x01'  // feed + partial cut

export function isAndroid() {
  return typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent || '')
}

// Number of characters that fit on one line for the configured paper width.
// 58mm ≈ 32 chars, 80mm ≈ 48 chars.
function lineWidth(settings) {
  return Number(settings?.receipt_width) === 80 ? 48 : 32
}

const repeat = (ch, n) => ch.repeat(Math.max(0, n))

// "label" on the right, "value" on the left, padded to the full width.
// (Receipt is RTL, but the column math stays simple this way and reads fine.)
function row(label, value, width) {
  const v = String(value)
  const l = String(label)
  const gap = width - l.length - v.length
  return gap > 0 ? l + repeat(' ', gap) + v : l + ' ' + v
}

// Build the plain-text receipt body. RawBT renders this as Unicode graphics, so
// Arabic prints correctly (unlike raw ESC/POS code-page text mode).
export function buildReceiptText(invoice, settings) {
  const cur   = settings?.currency || 'درهم'
  const width = lineWidth(settings)
  const sep   = repeat('-', width)
  const items = invoice.items || invoice.pos_invoice_items || []

  let t = INIT
  t += ALIGN_C
  t += BOLD_ON + (settings?.store_name || 'joud') + BOLD_OFF + '\n'
  if (settings?.phone) t += settings.phone + '\n'
  t += ALIGN_L
  t += fmtDate(invoice.created_at) + '\n'
  t += `فاتورة #${invoice.order_number}\n`
  if (invoice.customer_name) t += `الزبون: ${invoice.customer_name}\n`
  t += `الكاشير: ${settings?.cashier_name || '—'}\n`
  t += sep + '\n'

  for (const it of items) {
    const qty   = it.quantity || it.qty || 1
    const name  = (it.isReturn ? '↩ ' : '') + (it.product_name || it.name || '')
    t += name + '\n'
    t += row(`  ${qty} × ${fmt(it.unit_price || it.price || (it.total / qty))}`, fmt(it.total), width) + '\n'
  }

  t += sep + '\n'
  if (invoice.discount_amt > 0) t += row('الخصم', '-' + fmt(invoice.discount_amt), width) + '\n'
  if (invoice.tva_amt > 0)      t += row(`TVA ${invoice.tva_rate}%`, fmt(invoice.tva_amt), width) + '\n'
  t += BOLD_ON + row('المجموع', `${fmt(invoice.total)} ${cur}`, width) + BOLD_OFF + '\n'
  if (invoice.payment_label)    t += row('طريقة الدفع', invoice.payment_label, width) + '\n'
  if (invoice.amount_paid > 0)  t += row('المدفوع', fmt(invoice.amount_paid), width) + '\n'
  if (invoice.change_given > 0) t += row('الباقي', fmt(invoice.change_given), width) + '\n'
  if (invoice.notes) t += sep + '\n' + 'ملاحظات: ' + invoice.notes + '\n'

  t += '\n' + ALIGN_C + 'شكراً لتسوقكم معنا 🙏' + ALIGN_L + '\n'
  t += FEED_CUT
  return t
}

// Send a built text payload to RawBT. Uses the intent: form so that if RawBT is
// not installed, the browser opens its Play Store page instead of erroring.
export function sendToRawBT(text) {
  const payload = encodeURIComponent(text)
  window.location.href =
    `intent:${payload}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`
}

// Print a receipt. On Android → RawBT (USB/BT thermal printer).
// Elsewhere → the existing window.print() HTML path (#print-area).
export function printReceipt(invoice, settings) {
  if (!invoice) return
  if (isAndroid()) {
    sendToRawBT(buildReceiptText(invoice, settings))
  } else {
    setTimeout(() => window.print(), 300)
  }
}
