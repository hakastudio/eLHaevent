/**
 * eLHa Event - Google Apps Script Web App API
 * Fungsi: Menyimpan & menyinkronkan data pesanan tiket (Orders) secara real-time
 * antara website eLHa Event dan Google Sheets.
 *
 * Cara Pasang:
 * 1. Buka Google Sheets baru -> menu Extensions -> Apps Script.
 * 2. Hapus kode bawaan, lalu tempel seluruh kode di file ini.
 * 3. Klik Deploy -> New deployment -> Type: Web app.
 * 4. Execute as: "Me", Who has access: "Anyone".
 * 5. Klik Deploy, izinkan akses, lalu salin Web App URL-nya.
 * 6. Tempel URL tersebut di Dashboard Admin eLHa -> Tab Pengaturan.
 */

var SHEET_NAME = 'Orders';

var HEADERS = [
  'code',
  'createdDateStr',
  'status',
  'verifiedAt',
  'eventId',
  'eventCode',
  'eventTitle',
  'tierName',
  'qty',
  'totalAmount',
  'totalFormatted',
  'buyerName',
  'buyerPhone',
  'buyerEmail',
  'buyerAddress',
  'buyerNotes',
  'adminWa'
];

function getOrdersSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0B1E3B')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  } else if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#0B1E3B')
      .setFontColor('#FFFFFF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function rowToOrder(row) {
  return {
    code: String(row[0] || ''),
    createdDateStr: String(row[1] || ''),
    status: String(row[2] || 'pending') === 'verified' ? 'verified' : 'pending',
    verifiedAt: row[3] ? String(row[3]) : null,
    eventId: String(row[4] || ''),
    eventCode: String(row[5] || ''),
    eventTitle: String(row[6] || ''),
    tierName: String(row[7] || ''),
    qty: Number(row[8]) || 1,
    totalAmount: Number(row[9]) || 0,
    totalFormatted: String(row[10] || 'Rp 0'),
    buyerName: String(row[11] || ''),
    buyerPhone: String(row[12] || ''),
    buyerEmail: String(row[13] || ''),
    buyerAddress: String(row[14] || ''),
    buyerNotes: String(row[15] || ''),
    adminWa: String(row[16] || '')
  };
}

function orderToRow(order) {
  return [
    String(order.code || ''),
    String(order.createdDateStr || ''),
    order.status === 'verified' ? 'verified' : 'pending',
    order.verifiedAt ? String(order.verifiedAt) : '',
    String(order.eventId || ''),
    String(order.eventCode || ''),
    String(order.eventTitle || ''),
    String(order.tierName || ''),
    Number(order.qty) || 1,
    Number(order.totalAmount) || 0,
    String(order.totalFormatted || ''),
    String(order.buyerName || ''),
    String(order.buyerPhone || ''),
    String(order.buyerEmail || ''),
    String(order.buyerAddress || ''),
    String(order.buyerNotes || ''),
    String(order.adminWa || '')
  ];
}

function createJsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  try {
    var sheet = getOrdersSheet();
    var lastRow = sheet.getLastRow();
    var orders = [];

    if (lastRow > 1) {
      var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
      for (var i = values.length - 1; i >= 0; i--) {
        if (values[i][0]) {
          orders.push(rowToOrder(values[i]));
        }
      }
    }

    return createJsonResponse({
      ok: true,
      count: orders.length,
      orders: orders
    });
  } catch (err) {
    return createJsonResponse({
      ok: false,
      error: err.message
    });
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var rawBody = e && e.postData && e.postData.contents ? e.postData.contents : '{}';
    var payload = JSON.parse(rawBody);
    var action = payload.action || 'upsert';
    var sheet = getOrdersSheet();
    var lastRow = sheet.getLastRow();

    if (action === 'upsert' && payload.order && payload.order.code) {
      var order = payload.order;
      var targetCode = String(order.code).trim().toUpperCase();
      var foundRowIndex = -1;

      if (lastRow > 1) {
        var codes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var i = 0; i < codes.length; i++) {
          if (String(codes[i][0]).trim().toUpperCase() === targetCode) {
            foundRowIndex = i + 2;
            break;
          }
        }
      }

      if (foundRowIndex !== -1) {
        if (!payload.forceStatus) {
          var existingStatus = String(sheet.getRange(foundRowIndex, 3).getValue()).trim();
          var existingVerAt = sheet.getRange(foundRowIndex, 4).getValue();
          if (existingStatus === 'verified' && order.status !== 'verified') {
            order.status = 'verified';
            order.verifiedAt = existingVerAt || order.verifiedAt;
          }
        }
        sheet.getRange(foundRowIndex, 1, 1, HEADERS.length).setValues([orderToRow(order)]);
      } else {
        sheet.appendRow(orderToRow(order));
      }

      return createJsonResponse({ ok: true, action: 'upsert', code: targetCode });
    }

    if (action === 'delete' && payload.code) {
      var delCode = String(payload.code).trim().toUpperCase();
      if (lastRow > 1) {
        var delCodes = sheet.getRange(2, 1, lastRow - 1, 1).getValues();
        for (var d = delCodes.length - 1; d >= 0; d--) {
          if (String(delCodes[d][0]).trim().toUpperCase() === delCode) {
            sheet.deleteRow(d + 2);
          }
        }
      }
      return createJsonResponse({ ok: true, action: 'delete', code: delCode });
    }

    if (action === 'clearVerified') {
      if (lastRow > 1) {
        var statuses = sheet.getRange(2, 3, lastRow - 1, 1).getValues();
        for (var s = statuses.length - 1; s >= 0; s--) {
          if (String(statuses[s][0]).trim() === 'verified') {
            sheet.deleteRow(s + 2);
          }
        }
      }
      return createJsonResponse({ ok: true, action: 'clearVerified' });
    }

    return createJsonResponse({ ok: false, error: 'Action tidak dikenali' });
  } catch (err) {
    return createJsonResponse({ ok: false, error: err.message });
  } finally {
    lock.releaseLock();
  }
}
