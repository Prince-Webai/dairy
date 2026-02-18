
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Job, JobItem } from '@/types';

// Helper to format currency
const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(amount);
};

// -- 1. CUSTOMER STATEMENT (Detailed) --
export const generateCustomerStatement = (job: Job, items: JobItem[], returnType: 'blob' | 'bloburl' | 'save' = 'save') => {
    const doc = new jsPDF();

    // ... (content generation same as before) ...
    // Header
    doc.setFontSize(20);
    doc.text("Condon Dairy Services", 14, 22);
    doc.setFontSize(10);
    doc.text("Ballyporeen, Co. Tipperary", 14, 28);
    doc.text("Phone: +353 87 123 4567", 14, 33);

    // Title
    doc.setFontSize(16);
    doc.text("SERVICE STATEMENT", 140, 22);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 28);
    doc.text(`Job No: ${job.jobNumber}`, 140, 33);

    // Bill To
    doc.text("Bill To:", 14, 45);
    doc.setFontSize(12);
    doc.text(job.customerName, 14, 52);
    doc.setFontSize(10);

    // Description
    doc.text("Work Description:", 14, 65);
    doc.setFont("helvetica", "italic");
    doc.text(job.description, 14, 70);
    doc.setFont("helvetica", "normal");

    // Table Data
    const tableData = items.map(item => [
        item.description,
        item.quantity.toString(),
        formatCurrency(item.unitPrice),
        formatCurrency(item.total)
    ]);

    // Totals Calculation
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vatRate = 0.135; // Default service VAT
    const vatAmount = subtotal * vatRate;
    const total = subtotal + vatAmount;

    // Table
    autoTable(doc, {
        startY: 80,
        head: [['Description', 'Qty', 'Unit Price', 'Total']],
        body: tableData,
        foot: [
            ['', '', 'Subtotal', formatCurrency(subtotal)],
            ['', '', `VAT (13.5%)`, formatCurrency(vatAmount)],
            ['', '', 'Grand Total', formatCurrency(total)]
        ],
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    if (returnType === 'blob') {
        return doc.output('blob');
    }
    if (returnType === 'bloburl') {
        return doc.output('bloburl');
    }

    // Save
    doc.save(`Statement_${job.jobNumber}_${job.customerName.replace(/\s+/g, '_')}.pdf`);
};

// -- 2. ACCOUNTANT INVOICE (Simplified) --
export const generateAccountantInvoice = (job: Job, customDescription: string, vatRate: number, totalAmount: number, returnType: 'blob' | 'bloburl' | 'save' = 'save') => {
    const doc = new jsPDF();

    // Header (Same as Statement)
    doc.setFontSize(20);
    doc.text("Condon Dairy Services", 14, 22);
    doc.setFontSize(10);
    doc.text("Ballyporeen, Co. Tipperary", 14, 28);
    doc.text("Phone: +353 87 123 4567", 14, 33);

    // Title
    doc.setFontSize(16);
    doc.text("INVOICE", 160, 22);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 160, 28);
    doc.text(`Inv No: INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`, 160, 33);

    // Bill To
    doc.text("Bill To:", 14, 45);
    doc.setFontSize(12);
    doc.text(job.customerName, 14, 52);
    doc.setFontSize(10);

    // Simplified Line Item
    const subtotal = totalAmount / (1 + (vatRate / 100));
    const vatAmount = totalAmount - subtotal;

    const tableData = [
        [customDescription, formatCurrency(subtotal)]
    ];

    // Table
    autoTable(doc, {
        startY: 70,
        head: [['Description', 'Amount']],
        body: tableData,
        foot: [
            ['Subtotal', formatCurrency(subtotal)],
            ['Available VAT Rate', `${vatRate}%`],
            ['VAT Amount', formatCurrency(vatAmount)],
            ['Total Due', formatCurrency(totalAmount)]
        ],
        theme: 'plain',
        headStyles: { fillColor: [255, 255, 255], textColor: 0, fontStyle: 'bold', lineColor: 200, lineWidth: 0.1 },
        bodyStyles: { lineColor: 200, lineWidth: 0.1 },
        footStyles: { fontStyle: 'bold', halign: 'right' },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 40, halign: 'right' }
        }
    });

    if (returnType === 'blob') {
        return doc.output('blob');
    }
    if (returnType === 'bloburl') {
        return doc.output('bloburl');
    }

    // Save
    doc.save(`Invoice_${job.jobNumber}_Accountant.pdf`);
};

// -- 3. SERVICE REPORT (Internal/Field) --
export const generateServiceReport = (job: Job, items: JobItem[], returnType: 'blob' | 'bloburl' | 'save' = 'save') => {
    const doc = new jsPDF();

    // -- Header --
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(0, 0, 210, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("Condon Dairy Services", 14, 18);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Agri-Tech & Milking Machine Specialists", 14, 25);
    doc.text("Ballyporeen, Co. Tipperary | +353 87 123 4567", 14, 30);

    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text("SERVICE REPORT", 140, 28);

    doc.setTextColor(0, 0, 0); // Reset text

    // -- Job & Customer Details --
    let yPos = 55;

    // Left Column (Job Info)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Job Details:", 14, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(`Job Number: ${job.jobNumber}`, 14, yPos + 6);
    doc.text(`Date: ${new Date(job.date).toLocaleDateString()}`, 14, yPos + 12);
    doc.text(`Engineer: ${job.engineerName}`, 14, yPos + 18);
    doc.text(`Status: ${job.status}`, 14, yPos + 24);

    // Right Column (Customer Info)
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Customer:", 110, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(job.customerName, 110, yPos + 6);
    // If we had address in Job type we'd put it here, assume accessible or fetched. 
    // For now simplistic.

    // -- Description of Work --
    yPos += 40;
    doc.setFillColor(245, 245, 245);
    doc.rect(14, yPos - 5, 182, 20, 'F'); // Background box
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("Description of Work Required / Fault:", 16, yPos);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(job.description || "N/A", 16, yPos + 8, { maxWidth: 178 });

    // -- Items Table --
    yPos += 25;

    const tableData = items.map(item => [
        item.description,
        item.type.toUpperCase(),
        item.quantity.toString(),
        // Optional: Include price? For service report "Proof of work" usually implies materials used. 
        // Let's hidden prices for the "Field Report" to customer, but maybe show strictly quantities.
        // We'll stick to Qty/Type to match "Work Done" feel.
    ]);

    autoTable(doc, {
        startY: yPos,
        head: [['Item / Part Description', 'Type', 'Quantity']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10 },
        columnStyles: {
            0: { cellWidth: 'auto' },
            1: { cellWidth: 30 },
            2: { cellWidth: 30, halign: 'center' }
        }
    });

    // -- Notes Section (Empty for handwritten or filled) --
    let finalY = (doc as any).lastAutoTable.finalY || yPos + 20;

    if (finalY > 230) {
        doc.addPage();
        finalY = 20;
    }

    finalY += 10;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("Engineer Notes / Recommendations:", 14, finalY);
    doc.rect(14, finalY + 2, 182, 25); // Empty box for handwritten notes

    // -- Signatures --
    finalY += 40;

    // Check page break
    if (finalY > 260) {
        doc.addPage();
        finalY = 40;
    }

    doc.setFontSize(10);
    doc.text("I confirm the work has been carried out to my satisfaction.", 14, finalY);

    finalY += 15;

    // Engineer Sig
    doc.text("Engineer Signature:", 14, finalY);
    doc.line(14, finalY + 15, 80, finalY + 15);

    // Customer Sig
    doc.text("Customer Signature:", 110, finalY);
    doc.line(110, finalY + 15, 180, finalY + 15);

    // Footer
    const pageHeight = doc.internal.pageSize.height || 297;
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text("Condon Dairy Services - Registered Number: 123456", 14, pageHeight - 10);

    if (returnType === 'blob') {
        return doc.output('blob');
    }
    if (returnType === 'bloburl') {
        return doc.output('bloburl');
    }

    doc.save(`ServiceReport_${job.jobNumber}.pdf`);
};
