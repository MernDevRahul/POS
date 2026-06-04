"use strict";

const PDFDocument = require("pdfkit");
const path = require("path");

function fmt(val) {
  return (
    "Rs " +
    Number(val || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

function fmtDateTime(date) {
  return new Date(date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

async function generateInvoicePDF(sale, storeDetails = {}) {
  return new Promise((resolve, reject) => {
    // A4 size
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const buffers = [];
    doc.on("data", buffers.push.bind(buffers));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    generateHeader(doc, sale, storeDetails);
    generateCustomerInformation(doc, sale);
    generateInvoiceTable(doc, sale);
    // generateFooter(doc, storeDetails);

    doc.end();
  });
}

function generateHeader(doc, sale, storeDetails) {
  const logoPath = path.resolve(__dirname, "../../../frontend/public/logo.png");
  try {
    doc.image(logoPath, 50, 45, { width: 50 });
  } catch (err) {
    // Fallback if image not found
    doc.rect(50, 45, 50, 50).stroke("#cccccc");
    doc.fillColor("#999999").fontSize(10).text("LOGO", 60, 65);
  }

  doc
    .fillColor("#444444")
    .fontSize(20)
    .font("Helvetica-Bold")
    .text(storeDetails.storeName || "Imkaa", 110, 57)
    .fontSize(10)
    .font("Helvetica")
    .text(
      storeDetails.address ||
        "1084, Ramphal Chowk, Behind Kali Ghata, New Delhi- 110075",
      110,
      80,
    )
    .text(
      `Phone: ${storeDetails.phone || "9871147666"} | Email: ${storeDetails.email || "imkaaofficial01@gmail.com"}`,
      110,
      95,
    )
    .text(
      `Website: ${storeDetails.website || "Imkaa.com"} | GSTIN: ${storeDetails.gstin || "N/A"}`,
      110,
      110,
    )

    // TAX INVOICE LABEL
    .fontSize(26)
    .font("Helvetica-Bold")
    .text("TAX INVOICE", 50, 50, { align: "right" })
    .moveDown();

  doc.moveTo(50, 140).lineTo(545, 140).stroke("#cccccc");
}

function generateCustomerInformation(doc, sale) {
  doc
    .fillColor("#444444")
    .fontSize(10)
    .font("Helvetica")
    .text("Invoice Number:", 50, 160)
    .font("Helvetica-Bold")
    .text(sale.invoiceNo, 150, 160)
    .font("Helvetica")
    .text("Invoice Date:", 50, 175)
    .text(fmtDateTime(sale.createdAt), 150, 175)
    .text("Payment Status:", 50, 190);

  const isPaid = sale.status === "COMPLETED";
  doc
    .font("Helvetica-Bold")
    .fillColor(isPaid ? "#228B22" : "#FF0000")
    .text(isPaid ? "PAID" : "PENDING", 150, 190)
    .fillColor("#444444");

  doc
    .font("Helvetica")
    .text("Billed To:", 300, 160)
    .font("Helvetica-Bold")
    .text(sale.customerName || "Walk-in Customer", 300, 175)
    .font("Helvetica")
    .text(`Phone: ${sale.customerPhone || "N/A"}`, 300, 190);

  doc.moveTo(50, 215).lineTo(545, 215).stroke("#cccccc");
}

function generateInvoiceTable(doc, sale) {
  let i;
  const invoiceTableTop = 240;

  doc.font("Helvetica-Bold");
  generateTableRow(
    doc,
    invoiceTableTop,
    "SKU",
    "Item",
    "HSN",
    "Unit Cost",
    "Qty",
    "Discount",
    "Tax %",
    "Line Total",
  );
  generateHr(doc, invoiceTableTop + 20);
  doc.font("Helvetica");

  let position = invoiceTableTop + 30;

  for (i = 0; i < sale.items.length; i++) {
    const item = sale.items[i];

    // Ensure text wraps properly if item name is long
    const nameHeight = doc.heightOfString(item.nameSnapshot, {
      width: 140,
      fontSize: 8,
    });

    generateTableRow(
      doc,
      position,
      item.skuSnapshot || "-",
      item.nameSnapshot,
      item.hsn || "-",
      Number(item.unitPrice).toFixed(2),
      item.qty.toString(),
      Number(item.discount).toFixed(2),
      Number(item.gstRateSnapshot) + "%",
      Number(item.lineTotal).toFixed(2),
    );

    const rowHeight = Math.max(nameHeight, 15);

    generateHr(doc, position + rowHeight + 5);
    position += rowHeight + 15;

    if (position > 650) {
      doc.addPage();
      position = 50;
    }
  }

  const itemDiscountTotal = sale.items.reduce(
    (s, it) => s + (Number(it.discount) || 0),
    0,
  );
  const displaySubTotal = Number(sale.subTotal) + itemDiscountTotal;
  const displayDiscount = Number(sale.discountTotal) + itemDiscountTotal;

  // Calculate CGST and SGST
  // Using the first item's GST rate to display in the label, and splitting the total tax.
  const gstRate =
    sale.items.length > 0 ? Number(sale.items[0].gstRateSnapshot) : 0;
  const totalTax = Number(sale.taxTotal);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;

  let summaryPosition = position + 10;

  doc.font("Helvetica-Bold");
  generateSummaryRow(doc, summaryPosition, "Subtotal", fmt(displaySubTotal));
  summaryPosition += 20;

  if (displayDiscount > 0) {
    generateSummaryRow(
      doc,
      summaryPosition,
      "Discount",
      "-" + fmt(displayDiscount),
    );
    summaryPosition += 20;
  }

  if (totalTax > 0) {
    doc.font("Helvetica");
    generateSummaryRow(
      doc,
      summaryPosition,
      `CGST (${gstRate / 2}%)`,
      fmt(cgst),
    );
    summaryPosition += 20;
    generateSummaryRow(
      doc,
      summaryPosition,
      `SGST (${gstRate / 2}%)`,
      fmt(sgst),
    );
    summaryPosition += 20;
  }

  doc.font("Helvetica-Bold");
  generateSummaryRow(doc, summaryPosition, "Grand Total", fmt(sale.grandTotal));

  // Payment Details Section on the left
  let paymentPosition = position + 10;

  doc.font("Helvetica-Bold").text("Payment Details:", 50, paymentPosition);
  doc
    .font("Helvetica")
    .text(`Payment Mode: ${sale.paymentMode}`, 50, paymentPosition + 15)
    .text(`Paid Amount: ${fmt(sale.paidAmount)}`, 50, paymentPosition + 30);

  // UPI details
  if (sale.paymentMode === "UPI") {
    doc.text("UPI ID: gpay-11234681004@okbizaxis", 50, paymentPosition + 45);
    const qrPath = path.resolve(
      __dirname,
      "../../../frontend/public/qr-code.jpeg",
    );
    try {
      doc.image(qrPath, 50, paymentPosition + 60, { width: 50, height: 50 });
    } catch (err) {
      // Fallback for UPI QR Code
      doc.rect(50, paymentPosition + 60, 50, 50).stroke("#cccccc");
      doc
        .fillColor("#999999")
        .fontSize(8)
        .text("QR CODE", 58, paymentPosition + 82);
    }
  }
}

// function generateFooter(doc, storeDetails) {
//   const footerTop = 750;

//   doc.moveTo(50, footerTop).lineTo(545, footerTop).stroke('#cccccc');

//   doc
//     .fillColor('#444444')
//     .fontSize(9)
//     .font('Helvetica-Bold')
//     .text('Terms & Conditions:', 50, footerTop + 10)
//     .font('Helvetica')
//     .fontSize(8)
//     .text('1. Goods once sold are not returnable.', 50, footerTop + 25)
//     .text('2. Exchange policy within 7 days with original invoice.', 50, footerTop + 35)
//     .text('3. Thank you for your business!', 50, footerTop + 45);

//   doc
//     .fontSize(8)
//     .text(
//       'This is a computer-generated invoice, no signature required.',
//       50,
//       footerTop + 70,
//       { align: 'center', width: 495 }
//     );
// }

function generateTableRow(
  doc,
  y,
  sku,
  item,
  hsn,
  unitCost,
  qty,
  discount,
  tax,
  lineTotal,
) {
  doc
    .fontSize(8)
    .text(sku, 50, y)
    .text(item, 100, y, { width: 140 })
    .text(hsn, 250, y)
    .text(unitCost, 290, y, { width: 50, align: "right" })
    .text(qty, 350, y, { width: 30, align: "right" })
    .text(discount, 390, y, { width: 40, align: "right" })
    .text(tax, 440, y, { width: 40, align: "right" })
    .text(lineTotal, 490, y, { width: 55, align: "right" });
}

function generateHr(doc, y) {
  doc.strokeColor("#eeeeee").lineWidth(1).moveTo(50, y).lineTo(545, y).stroke();
}

function generateSummaryRow(doc, y, label, value) {
  doc.text(label, 380, y, { width: 90, align: "right" });
  doc.text(value, 480, y, { width: 65, align: "right" });
}

module.exports = { generateInvoicePDF };
