// ESC/POS command builder for thermal receipt printers.
// Builds binary buffer from receipt data; transport handled separately.

const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

export type Align = "left" | "center" | "right";
type Bytes = number[];

function pushString(buf: Bytes, str: string) {
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    if (code < 128) buf.push(code);
    else buf.push(0x3f); // unsupported chars → "?"
  }
}

function alignByte(a: Align): number {
  return a === "center" ? 1 : a === "right" ? 2 : 0;
}

export class EscPosBuilder {
  private buf: Bytes = [];
  private width: number;

  constructor(characterWidth = 48) {
    this.width = characterWidth;
    // Init printer
    this.buf.push(ESC, 0x40);
  }

  text(str: string, opts: { align?: Align; bold?: boolean; double?: boolean } = {}): this {
    if (opts.align !== undefined) this.buf.push(ESC, 0x61, alignByte(opts.align));
    if (opts.bold) this.buf.push(ESC, 0x45, 1);
    if (opts.double) this.buf.push(GS, 0x21, 0x11);
    pushString(this.buf, str);
    if (opts.double) this.buf.push(GS, 0x21, 0x00);
    if (opts.bold) this.buf.push(ESC, 0x45, 0);
    return this;
  }

  line(str = "", opts?: { align?: Align; bold?: boolean; double?: boolean }): this {
    this.text(str, opts);
    this.buf.push(LF);
    return this;
  }

  // Two-column: left text + right value, padded to character width
  cols(left: string, right: string): this {
    const space = Math.max(1, this.width - left.length - right.length);
    pushString(this.buf, left + " ".repeat(space) + right);
    this.buf.push(LF);
    return this;
  }

  divider(char = "-"): this {
    pushString(this.buf, char.repeat(this.width));
    this.buf.push(LF);
    return this;
  }

  feed(n = 1): this {
    for (let i = 0; i < n; i++) this.buf.push(LF);
    return this;
  }

  cut(): this {
    this.buf.push(GS, 0x56, 0x42, 0x00);
    return this;
  }

  drawer(): this {
    // Open cash drawer pin 2
    this.buf.push(ESC, 0x70, 0x00, 0x32, 0xfa);
    return this;
  }

  build(): Uint8Array {
    return new Uint8Array(this.buf);
  }
}

// ============================================================
// WebUSB transport
// ============================================================

interface USBDeviceLike {
  open: () => Promise<void>;
  selectConfiguration: (n: number) => Promise<void>;
  claimInterface: (n: number) => Promise<void>;
  transferOut: (endpoint: number, data: BufferSource) => Promise<unknown>;
  close: () => Promise<void>;
  configuration: { interfaces: Array<{ interfaceNumber: number; alternate: { endpoints: Array<{ direction: string; endpointNumber: number }> } }> } | null;
}

export interface WebUSBPrinter {
  device: USBDeviceLike;
  endpoint: number;
  iface: number;
}

export async function requestUsbPrinter(): Promise<WebUSBPrinter> {
  const nav = navigator as unknown as { usb?: { requestDevice: (opts: { filters: Array<Record<string, unknown>> }) => Promise<USBDeviceLike> } };
  if (!nav.usb) throw new Error("WebUSB not supported in this browser");

  const device = await nav.usb.requestDevice({
    filters: [
      { classCode: 7 }, // printer class
      { vendorId: 0x04b8 }, // Epson
      { vendorId: 0x0519 }, // Star Micronics
      { vendorId: 0x0fe6 }, // ICS Advent
      { vendorId: 0x0416 }, // Winbond / generic POS
      { vendorId: 0x1fc9 }, // NXP / generic POS
      { vendorId: 0x28e9 }, // Generic 58mm Chinese
    ],
  });

  await device.open();
  if (device.configuration === null) await device.selectConfiguration(1);

  const iface = device.configuration!.interfaces.find((i) =>
    i.alternate.endpoints.some((e) => e.direction === "out")
  );
  if (!iface) throw new Error("No printer-compatible interface found");
  await device.claimInterface(iface.interfaceNumber);

  const ep = iface.alternate.endpoints.find((e) => e.direction === "out");
  if (!ep) throw new Error("No OUT endpoint");

  return { device, endpoint: ep.endpointNumber, iface: iface.interfaceNumber };
}

export async function sendToUsbPrinter(printer: WebUSBPrinter, data: Uint8Array): Promise<void> {
  await printer.device.transferOut(printer.endpoint, data as unknown as BufferSource);
}

export async function closeUsbPrinter(printer: WebUSBPrinter): Promise<void> {
  try {
    await printer.device.close();
  } catch {
    // ignore
  }
}

// Convenience: print a built buffer in one call (request + send + close)
export async function printOnce(buffer: Uint8Array): Promise<void> {
  const printer = await requestUsbPrinter();
  try {
    await sendToUsbPrinter(printer, buffer);
  } finally {
    await closeUsbPrinter(printer);
  }
}

// ============================================================
// Receipt builder helper
// ============================================================

export interface ReceiptData {
  storeName: string;
  storeAddress?: string;
  storePhone?: string;
  referenceNo: string;
  date: string;
  cashier?: string;
  customer?: string;
  items: Array<{ name: string; qty: number; unitPrice: number; subtotal: number }>;
  subtotal: number;
  tax?: number;
  discount?: number;
  grandTotal: number;
  paid?: number;
  change?: number;
  footer?: string;
  currencySymbol?: string;
}

export function buildReceipt(data: ReceiptData, characterWidth = 48): Uint8Array {
  const b = new EscPosBuilder(characterWidth);
  const sym = data.currencySymbol ?? "";

  b.line(data.storeName, { align: "center", bold: true, double: true });
  if (data.storeAddress) b.line(data.storeAddress, { align: "center" });
  if (data.storePhone) b.line(data.storePhone, { align: "center" });
  b.divider();

  b.cols("Receipt:", data.referenceNo);
  b.cols("Date:", data.date);
  if (data.cashier) b.cols("Cashier:", data.cashier);
  if (data.customer) b.cols("Customer:", data.customer);
  b.divider();

  for (const it of data.items) {
    b.line(it.name);
    b.cols(`  ${it.qty} x ${sym}${it.unitPrice.toFixed(2)}`, `${sym}${it.subtotal.toFixed(2)}`);
  }
  b.divider();

  b.cols("Subtotal", `${sym}${data.subtotal.toFixed(2)}`);
  if (data.tax) b.cols("Tax", `${sym}${data.tax.toFixed(2)}`);
  if (data.discount) b.cols("Discount", `-${sym}${data.discount.toFixed(2)}`);
  b.cols("TOTAL", `${sym}${data.grandTotal.toFixed(2)}`);
  if (data.paid !== undefined) b.cols("Paid", `${sym}${data.paid.toFixed(2)}`);
  if (data.change !== undefined && data.change > 0) b.cols("Change", `${sym}${data.change.toFixed(2)}`);

  b.feed(1);
  if (data.footer) b.line(data.footer, { align: "center" });
  b.feed(3);
  b.cut();

  return b.build();
}

export function buildTestPrint(characterWidth = 48): Uint8Array {
  const b = new EscPosBuilder(characterWidth);
  b.line("Test Print", { align: "center", bold: true, double: true });
  b.divider();
  b.line(`Width: ${characterWidth} chars`);
  b.line(`Date: ${new Date().toLocaleString()}`);
  b.divider();
  b.line("Sample line — left aligned");
  b.line("Sample line — center", { align: "center" });
  b.line("Sample line — right", { align: "right" });
  b.divider();
  b.cols("Item A x 2", "10.00");
  b.cols("Item B x 1", "5.50");
  b.divider();
  b.cols("TOTAL", "15.50");
  b.feed(3);
  b.cut();
  return b.build();
}
