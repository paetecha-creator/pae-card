import * as XLSX from 'xlsx';
import { Transaction, TransactionType } from '../types';
import { extractInstallmentMeta, inferCategory } from '../data/seedData';

/**
 * Exports transactions to an Excel (.xlsx) file with professional formatting
 */
export function exportTransactionsToExcel(
  transactions: Transaction[],
  fileName?: string
): void {
  // Define header row in Thai matching user's original spreadsheet
  const headers = [
    'วันที่รายการ',
    'ชื่อบัตรหรือช่องทางชำระ',
    'สถานะการชำระ',
    'รายการ/ร้านค้า',
    'จำนวนเงิน',
    'หมายเหตุ',
    'หมวดหมู่',
  ];

  // Map transactions to array of rows
  const dataRows = transactions.map((t) => [
    t.date,
    t.card,
    t.type,
    t.title,
    t.amount,
    t.note || '',
    t.category || '',
  ]);

  // Combine headers and rows
  const worksheetData = [headers, ...dataRows];

  // Create worksheet
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

  // Set column widths for readability in Excel
  worksheet['!cols'] = [
    { wch: 14 }, // วันที่รายการ
    { wch: 16 }, // ชื่อบัตร
    { wch: 14 }, // สถานะการชำระ
    { wch: 32 }, // รายการ/ร้านค้า
    { wch: 16 }, // จำนวนเงิน
    { wch: 22 }, // หมายเหตุ
    { wch: 24 }, // หมวดหมู่
  ];

  // Create workbook and append worksheet
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'รายการบัตรเครดิต');

  // Trigger file download in browser
  const today = new Date().toISOString().slice(0, 10);
  const actualFileName = fileName || `PaeCard_Transactions_${today}.xlsx`;
  XLSX.writeFile(workbook, actualFileName);
}

/**
 * Normalizes any date value from Excel (Date object, string, or Excel serial number) to YYYY-MM-DD
 */
function parseExcelDate(val: unknown): string {
  if (!val) return new Date().toISOString().slice(0, 10);

  // If already a Date object
  if (val instanceof Date) {
    if (!isNaN(val.getTime())) {
      // If time is 23:59:xx, adjust for timezone rounding
      const adjusted = new Date(val.getTime() + (val.getHours() === 23 ? 60000 : 0));
      const y = adjusted.getFullYear();
      const m = String(adjusted.getMonth() + 1).padStart(2, '0');
      const d = String(adjusted.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  // If numeric Excel date serial number (e.g. 46305)
  if (typeof val === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(val);
    if (dateObj) {
      const y = dateObj.y;
      const m = String(dateObj.m).padStart(2, '0');
      const d = String(dateObj.d).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  const str = String(val).trim();

  // If matches YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // If matches DD/MM/YYYY or D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (dmyMatch) {
    const d = String(dmyMatch[1]).padStart(2, '0');
    const m = String(dmyMatch[2]).padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // If matches YYYY/MM/DD
  const ymdMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (ymdMatch) {
    const y = ymdMatch[1];
    const m = String(ymdMatch[2]).padStart(2, '0');
    const d = String(ymdMatch[3]).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Fallback try standard Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  return new Date().toISOString().slice(0, 10);
}

/**
 * Parses and imports transactions from an uploaded Excel (.xlsx, .xls, .csv) file
 */
export async function parseTransactionsFromExcelFile(
  file: File
): Promise<{ success: boolean; transactions?: Transaction[]; count?: number; message: string }> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return { success: false, message: 'ไม่พบชีตข้อมูลในไฟล์ Excel' };
    }

    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    // Read sheet as 2D array of rows
    const rawRows = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
      header: 1,
      defval: '',
      blankrows: false,
    });

    if (rawRows.length < 2) {
      return { success: false, message: 'ไฟล์ Excel ไม่มีข้อมูลรายการที่เพียงพอ' };
    }

    // Explicit column indices matching standard Excel sheet format:
    // Column A (0): วันที่รายการ
    // Column B (1): ชื่อบัตรหรือช่องทางชำระ
    // Column C (2): สถานะการชำระ
    // Column D (3): รายการ/ร้านค้า (ต้องใช้คอลัมน์ D เสมอ)
    // Column E (4): จำนวนเงิน
    // Column F (5): หมายเหตุ
    // Column G (6): หมวดหมู่
    let dateIdx = 0;
    let cardIdx = 1;
    let typeIdx = 2;
    let titleIdx = 3; // Column D (Index 3)
    let amountIdx = 4;
    let noteIdx = 5;
    let categoryIdx = 6;

    // Check header row for dynamic variations, but NEVER let "วันที่รายการ" match title
    if (rawRows.length > 0) {
      const headerRow = (rawRows[0] as unknown[]).map((h) => String(h || '').trim().toLowerCase());

      headerRow.forEach((col, idx) => {
        // Date
        if (col === 'วันที่รายการ' || col === 'วันที่' || col === 'date') {
          dateIdx = idx;
        }
        // Card
        else if (col === 'ชื่อบัตรหรือช่องทางชำระ' || col === 'ชื่อบัตร' || col === 'บัตร' || col === 'card') {
          cardIdx = idx;
        }
        // Payment Type
        else if (col === 'สถานะการชำระ' || col === 'สถานะ' || col === 'ประเภท' || col === 'type' || col === 'status') {
          typeIdx = idx;
        }
        // Merchant / Item (Column D) - Exclude any column containing "วัน" so "วันที่รายการ" is never matched!
        else if (!col.includes('วัน') && (col === 'รายการ/ร้านค้า' || col === 'รายการ' || col === 'ร้านค้า' || col === 'description' || col === 'title' || col === 'item')) {
          titleIdx = idx;
        }
        // Amount
        else if (col === 'จำนวนเงิน' || col === 'ยอดเงิน' || col === 'amount') {
          amountIdx = idx;
        }
        // Note
        else if (col === 'หมายเหตุ' || col === 'note' || col === 'remark') {
          noteIdx = idx;
        }
        // Category
        else if (col === 'หมวดหมู่' || col === 'category') {
          categoryIdx = idx;
        }
      });
    }

    // Strict requirement: Ensure titleIdx always points to Column D (index 3) unless a non-date title column was found
    if (titleIdx === dateIdx || titleIdx === 0) {
      titleIdx = 3;
    }

    const parsedTransactions: Transaction[] = [];

    // Iterate through data rows
    for (let r = 1; r < rawRows.length; r++) {
      const row = rawRows[r] as unknown[];
      if (!row || row.length === 0) continue;

      const rawDate = row[dateIdx];
      const rawCard = String(row[cardIdx] || '').trim();
      const rawType = String(row[typeIdx] || '').trim();

      // Read title strictly from Column D (index 3 or titleIdx)
      let rawTitleVal = row[titleIdx];
      if (rawTitleVal === undefined || rawTitleVal === null || String(rawTitleVal).trim() === '') {
        // Fallback directly to Column D (index 3)
        if (row.length > 3) {
          rawTitleVal = row[3];
        }
      }

      const rawAmountVal = row[amountIdx];
      const rawNote = String(row[noteIdx] || '').trim();
      const rawCategory = String(row[categoryIdx] || '').trim();

      // If the entire row is empty, skip
      if (!rawDate && !rawCard && !rawTitleVal && !rawAmountVal) continue;

      // Parse Amount
      let amount = 0;
      if (typeof rawAmountVal === 'number') {
        amount = Math.abs(rawAmountVal);
      } else {
        const cleanAmountStr = String(rawAmountVal || '')
          .replace(/[฿,\s"]/g, '')
          .trim();
        amount = Math.abs(parseFloat(cleanAmountStr) || 0);
      }

      // Parse Date
      const date = parseExcelDate(rawDate);

      // Card Name fallback
      const card = rawCard || 'KTC';

      // Type normalization
      let type: TransactionType = 'ซื้อ';
      if (rawType.includes('คืน') || rawType.toLowerCase().includes('refund')) {
        type = 'เงินคืน';
      } else if (rawType.includes('บิล') || rawType.toLowerCase().includes('bill') || rawType.includes('จ่าย')) {
        type = 'จ่ายบิล';
      }

      // Sanitize Title: Ensure no Date strings leak into title
      let title = '';
      if (rawTitleVal instanceof Date) {
        title = '';
      } else if (typeof rawTitleVal === 'string') {
        const str = rawTitleVal.trim();
        // Check if string looks like an unformatted Date e.g. "Wed Oct 06 2027 23:59:56 GMT+0700" or ISO date
        if (str.includes('GMT+') || str.includes('Indochina Time') || /^\d{4}-\d{2}-\d{2}$/.test(str)) {
          title = '';
        } else {
          title = str;
        }
      } else if (rawTitleVal !== undefined && rawTitleVal !== null) {
        title = String(rawTitleVal).trim();
      }

      // If title is empty in Column D, assign appropriate label based on note or type
      if (!title) {
        if (rawNote) {
          title = rawNote.split('(')[0].trim() || (type === 'จ่ายบิล' ? 'ชำระบิลบัตร' : type === 'เงินคืน' ? 'เงินคืน/Cashback' : 'รายการทั่วไป');
        } else {
          title = type === 'จ่ายบิล' ? 'ชำระบิลบัตร' : type === 'เงินคืน' ? 'เงินคืน/Cashback' : 'รายการทั่วไป';
        }
      }

      // Installment & Category inference
      const installment = extractInstallmentMeta(rawNote, title);
      const category = rawCategory || inferCategory(title, rawNote, type);

      parsedTransactions.push({
        id: `tx-import-${r}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
        date,
        card,
        type,
        title,
        amount,
        note: rawNote,
        category,
        installment,
        createdAt: new Date(date).getTime() || Date.now(),
        updatedAt: Date.now(),
      });
    }

    if (parsedTransactions.length === 0) {
      return { success: false, message: 'ไม่พบรายการที่สามารถอ่านได้ในไฟล์ Excel' };
    }

    // Sort descending by date
    parsedTransactions.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    return {
      success: true,
      transactions: parsedTransactions,
      count: parsedTransactions.length,
      message: `นำเข้าไฟล์ Excel สำเร็จ ${parsedTransactions.length} รายการ`,
    };
  } catch (error) {
    console.error('Excel parse error:', error);
    return {
      success: false,
      message:
        'เกิดข้อผิดพลาดในการอ่านไฟล์ Excel: ' +
        (error instanceof Error ? error.message : 'Unknown error'),
    };
  }
}
