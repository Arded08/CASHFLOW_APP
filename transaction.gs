// Transactions

function getTransactionSheet_() {
  var config = getConfig_();

  if (!config.SPREADSHEET_ID) {
    throw new Error('SPREADSHEET_ID belum diisi di config.gs');
  }

  var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
  var sheet = ss.getSheetByName(config.SHEET_TRANSAKSI);

  if (!sheet) {
    throw new Error('Sheet TRANSAKSI tidak ditemukan');
  }

  return sheet;
}

function savePersonalExpense(payload) {
  var sheet = getTransactionSheet_();
  
  var date = new Date(payload.tanggal);
  var bulan = Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
  var trxId = 'P-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  
  sheet.appendRow([
    trxId,
    payload.tanggal,
    bulan,
    'PRIBADI',
    '',
    '',
    '',
    '',
    payload.deskripsi || '',
    '',
    Number(payload.nominal || 0),
    '',
    '',
    'SAVED',
    new Date(),
    new Date()
  ]);
  
  return successResponse({ trxId: trxId });
}

function updateTransactionStatus(trxId, newStatus) {
  var allowedStatus = ['DRAFT', 'READY', 'SUBMITTED', 'APPROVED', 'REJECTED', 'SAVED'];
  if (allowedStatus.indexOf(newStatus) === -1) {
    return errorResponse('Status tidak valid: ' + newStatus);
  }

  var sheet = getTransactionSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  
  var statusIdx = headers.indexOf('STATUS');
  var updatedIdx = headers.indexOf('UPDATED_AT');
  var idIdx = 0; // TRX_ID

  if (statusIdx === -1) {
    return errorResponse('Kolom STATUS tidak ditemukan');
  }

  for (var i = 1; i < data.length; i++) {
    if (data[i][idIdx] === trxId) {
      sheet.getRange(i + 1, statusIdx + 1).setValue(newStatus);
      if (updatedIdx !== -1) {
        sheet.getRange(i + 1, updatedIdx + 1).setValue(new Date());
      }
      return successResponse({ trxId: trxId, status: newStatus });
    }
  }

  return errorResponse('Transaksi tidak ditemukan: ' + trxId);
}

function getTransactions(filter) {
  var sheet = getTransactionSheet_();
  var data = sheet.getDataRange().getValues();
  var headers = data.shift();
  var headerMap = {};
  headers.forEach(function(header, index) {
    headerMap[String(header).trim()] = index;
  });

  function getCell(row, key) {
    var idx = headerMap[key];
    if (idx === undefined || idx === null) return '';
    return row[idx];
  }
  
  var result = data.map(function(row) {
    var id = getCell(row, 'TRX_ID');
    if (!id) return null;
    
    var tgl = getCell(row, 'TANGGAL');
    var tglStr = '';
    if (tgl instanceof Date) {
      tglStr = Utilities.formatDate(tgl, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    } else if (tgl) {
      tglStr = tgl.toString();
      if (tglStr.indexOf('T') !== -1) {
        tglStr = tglStr.split('T')[0];
      }
    }
    
    var bln = getCell(row, 'BULAN');
    if (bln instanceof Date) {
        bln = Utilities.formatDate(bln, Session.getScriptTimeZone(), 'yyyy-MM');
    } else if (bln) {
        bln = bln.toString().trim();
    }

    return {
      id: id,
      tanggal: tglStr,
      bulan: bln,
      tipe: getCell(row, 'TIPE'),
      dealer_code: getCell(row, 'DEALER_CODE'),
      nama_dealer: getCell(row, 'NAMA_DEALER'),
      claim_code: getCell(row, 'CLAIM_CODE'),
      nama_tempat: getCell(row, 'NAMA_TEMPAT'),
      deskripsi: getCell(row, 'DESKRIPSI'),
      keterangan: getCell(row, 'KETERANGAN'),
      nominal: getCell(row, 'NOMINAL'),
      foto_url: getCell(row, 'FOTO_KWITANSI_URL'),
      foto_id: getCell(row, 'FOTO_FILE_ID'),
      status: getCell(row, 'STATUS'),
      created_at: getCell(row, 'CREATED_AT'),
      updated_at: getCell(row, 'UPDATED_AT')
    };
  }).filter(function(trx) {
    if (!trx) return false;
    
    // Patch: Fallback URL if foto_url is empty but foto_id exists
    if (!trx.foto_url && trx.foto_id) {
      trx.foto_url = 'https://drive.google.com/file/d/' + trx.foto_id + '/view';
    }

    var matchBulan = (!filter.bulan || trx.bulan === filter.bulan);
    var matchTipe = (!filter.tipe || filter.tipe === 'SEMUA' || trx.tipe === filter.tipe);
    return matchBulan && matchTipe;
  }).sort(function(a, b) {
    var dateA = new Date(a.created_at || a.tanggal || 0);
    var dateB = new Date(b.created_at || b.tanggal || 0);
    return dateB.getTime() - dateA.getTime();
  });
  
  return successResponse(result);
}

function saveOfficeExpense(payload, fileData) {
  var sheet = getTransactionSheet_();
  
  var date = new Date(payload.tanggal);
  var month = Utilities.formatDate(date, Session.getScriptTimeZone(), 'MM');
  var trxId = 'O-' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
  
  // Format Keterangan tambahan: aman
  var keteranganAman = payload.keterangan_tambahan.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '_');
  
  // CLAIM_CODE: DEALER_CODE_MM_INT_KETERANGAN_TAMBAHAN
  var claimCode = payload.dealer_code + '_' + month + '_INT_' + keteranganAman;
  
  var fotoUrl = '';
  var fotoId = '';
  var status = 'DRAFT';
  
  if (fileData && fileData.base64) {
    var config = getConfig_();
    if (!config.DRIVE_FOLDER_ID) {
      throw new Error('DRIVE_FOLDER_ID belum diisi di config.gs');
    }
    var contentType = fileData.contentType || 'image/jpeg';
    var blob = Utilities.newBlob(Utilities.base64Decode(fileData.base64), contentType);
    var timestamp = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyyMMddHHmmss');
    var fileName = claimCode + '_' + timestamp;
    
    var fileInfo = uploadReceipt(blob, fileName, config.DRIVE_FOLDER_ID);
    fotoUrl = fileInfo.url;
    fotoId = fileInfo.id;
    status = 'READY';
  }
  
  sheet.appendRow([
    trxId,
    payload.tanggal,
    Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM'),
    'KANTOR',
    payload.dealer_code || '',
    payload.nama_dealer || '',
    claimCode,
    payload.nama_tempat || '',
    payload.deskripsi || '',
    payload.keterangan_tambahan || '',
    Number(payload.nominal || 0),
    fotoUrl,
    fotoId,
    status,
    new Date(),
    new Date()
  ]);
  
  return successResponse({ trxId: trxId });
}
