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


function updateTransactionBasic(trxId, payload) {
  try {
    if (!trxId) {
      return { ok: false, message: 'TRX_ID wajib diisi' };
    }

    payload = payload || {};

    var deskripsi = String(payload.deskripsi || '').trim();
    var keterangan = String(payload.keterangan || '').trim();
    var nominal = Number(payload.nominal || 0);

    if (!deskripsi) {
      return { ok: false, message: 'Deskripsi wajib diisi' };
    }

    if (!isFinite(nominal) || isNaN(nominal) || nominal < 0) {
      return { ok: false, message: 'Nominal tidak valid' };
    }

    var sheet = getTransactionSheet_();
    var values = sheet.getDataRange().getValues();

    if (values.length < 2) {
      return { ok: false, message: 'Data transaksi kosong' };
    }

    var headers = values[0];
    var map = {};
    headers.forEach(function(h, i) {
      map[String(h).trim()] = i;
    });

    var required = ['TRX_ID', 'DESKRIPSI', 'KETERANGAN', 'NOMINAL', 'UPDATED_AT', 'STATUS'];
    for (var r = 0; r < required.length; r++) {
      if (map[required[r]] === undefined) {
        return { ok: false, message: 'Header tidak lengkap: ' + required[r] };
      }
    }

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][map.TRX_ID]) === String(trxId)) {
        var status = String(values[i][map.STATUS] || '').toUpperCase();
        if (status === 'DELETED') {
          return { ok: false, message: 'Transaksi sudah dihapus dan tidak bisa diedit' };
        }

        var rowNumber = i + 1;
        sheet.getRange(rowNumber, map.DESKRIPSI + 1).setValue(deskripsi);
        sheet.getRange(rowNumber, map.KETERANGAN + 1).setValue(keterangan);
        sheet.getRange(rowNumber, map.NOMINAL + 1).setValue(nominal);
        sheet.getRange(rowNumber, map.UPDATED_AT + 1).setValue(new Date());

        return {
          ok: true,
          message: 'Transaksi berhasil diperbarui',
          data: {
            trxId: trxId,
            deskripsi: deskripsi,
            keterangan: keterangan,
            nominal: nominal
          }
        };
      }
    }

    return { ok: false, message: 'Transaksi tidak ditemukan' };
  } catch (err) {
    return { ok: false, message: 'updateTransactionBasic error: ' + (err.message || String(err)) };
  }
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
  try {
    filter = filter || {};

    function toSafeNumber(value) {
      var n = Number(value);
      if (!isFinite(n) || isNaN(n)) return 0;
      return n;
    }

    function toSafeText(value) {
      if (value === null || value === undefined) return '';
      if (value instanceof Date) {
        return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      }
      return String(value);
    }

    function toDateString(value) {
      if (value instanceof Date) {
        return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      if (!value) return '';
      var str = String(value);
      if (str.indexOf('T') !== -1) return str.split('T')[0];
      return str;
    }

    function toMonthString(value) {
      if (value instanceof Date) {
        return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM');
      }
      if (!value) return '';
      return String(value).trim();
    }

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
      var id = toSafeText(getCell(row, 'TRX_ID'));
      var status = toSafeText(getCell(row, 'STATUS')).toUpperCase();
      var tipe = toSafeText(getCell(row, 'TIPE')).toUpperCase();
      var tanggal = toSafeText(getCell(row, 'TANGGAL'));
      var bulan = toSafeText(getCell(row, 'BULAN'));

      if (!id) return null;
      if (status === 'DELETED') return null;
      if (tipe !== 'KANTOR' && tipe !== 'PRIBADI') return null;
      if (!bulan && !tanggal) return null;

      return {
        id: toSafeText(id),
        tanggal: toDateString(getCell(row, 'TANGGAL')),
        bulan: toMonthString(getCell(row, 'BULAN')),
        tipe: toSafeText(tipe),
        dealer_code: toSafeText(getCell(row, 'DEALER_CODE')),
        nama_dealer: toSafeText(getCell(row, 'NAMA_DEALER')),
        claim_code: toSafeText(getCell(row, 'CLAIM_CODE')),
        nama_tempat: toSafeText(getCell(row, 'NAMA_TEMPAT')),
        deskripsi: toSafeText(getCell(row, 'DESKRIPSI')),
        keterangan: toSafeText(getCell(row, 'KETERANGAN')),
        nominal: toSafeNumber(getCell(row, 'NOMINAL')),
        foto_url: toSafeText(getCell(row, 'FOTO_KWITANSI_URL')),
        foto_id: toSafeText(getCell(row, 'FOTO_FILE_ID')),
        status: toSafeText(status),
        created_at: toSafeText(getCell(row, 'CREATED_AT')),
        updated_at: toSafeText(getCell(row, 'UPDATED_AT'))
      };
    }).filter(function(trx) {
      if (!trx) return false;
      
      // Patch: Fallback URL if foto_url is empty but foto_id exists
      if (!trx.foto_url && trx.foto_id) {
        trx.foto_url = 'https://drive.google.com/file/d/' + trx.foto_id + '/view';
      }

      var filterBulan = String(filter.bulan || '').trim();
      var filterTipe = String(filter.tipe || '').trim();

      var matchBulan = (!filterBulan || trx.bulan === filterBulan);
      var matchTipe = (!filterTipe || filterTipe === 'SEMUA' || trx.tipe.toUpperCase() === filterTipe.toUpperCase());
      return matchBulan && matchTipe;
    }).sort(function(a, b) {
      var dateA = a.created_at ? new Date(a.created_at) : (a.tanggal ? new Date(a.tanggal) : new Date(0));
      var dateB = b.created_at ? new Date(b.created_at) : (b.tanggal ? new Date(b.tanggal) : new Date(0));
      return dateB.getTime() - dateA.getTime();
    });
    
    return successResponse(result);
  } catch (err) {
    return errorResponse('getTransactions error: ' + (err.message || String(err)));
  }
}

function getTransactionsJson(filter) {
  try {
    var res = getTransactions(filter || {});
    return JSON.stringify(res);
  } catch (err) {
    return JSON.stringify({
      ok: false,
      message: 'getTransactionsJson error: ' + (err.message || String(err))
    });
  }
}

function deleteTransaction(trxId) {
  try {
    if (!trxId) {
      return { ok: false, message: 'TRX_ID wajib diisi' };
    }

    var config = getConfig_();
    var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    var sheet = ss.getSheetByName(config.SHEET_TRANSAKSI);
    if (!sheet) {
      return { ok: false, message: 'Sheet TRANSAKSI tidak ditemukan' };
    }

    var values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return { ok: false, message: 'Data transaksi kosong' };
    }

    var headers = values[0];
    var map = {};
    headers.forEach(function(h, i) {
      map[String(h).trim()] = i;
    });

    if (map.TRX_ID === undefined || map.STATUS === undefined || map.UPDATED_AT === undefined) {
      return { ok: false, message: 'Header TRX_ID/STATUS/UPDATED_AT tidak lengkap' };
    }

    for (var i = 1; i < values.length; i++) {
      if (String(values[i][map.TRX_ID]) === String(trxId)) {
        sheet.getRange(i + 1, map.STATUS + 1).setValue('DELETED');
        sheet.getRange(i + 1, map.UPDATED_AT + 1).setValue(new Date());
        return { ok: true, message: 'Transaksi berhasil dihapus' };
      }
    }

    return { ok: false, message: 'Transaksi tidak ditemukan' };
  } catch (err) {
    return { ok: false, message: err.message || String(err) };
  }
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
