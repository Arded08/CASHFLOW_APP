
function getBudgetSetting() {
  try {
    var config = getConfig_();
    var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    var sheetConfig = ss.getSheetByName(config.SHEET_CONFIG);
    var budgetKantor = 0;
    if (sheetConfig) {
      var configData = sheetConfig.getDataRange().getValues();
      for (var i = 0; i < configData.length; i++) {
        var row = configData[i];
        if (row[0] && String(row[0]).trim() === 'MONTHLY_OFFICE_BUDGET') {
          var val = parseFloat(row[1]);
          if (!isNaN(val)) budgetKantor = val;
          break;
        }
      }
    }
    return successResponse({ budget: budgetKantor });
  } catch (err) {
    return errorResponse(err.message || String(err));
  }
}

function saveBudgetSetting(newBudget) {
  try {
    newBudget = parseFloat(newBudget);
    if (isNaN(newBudget) || newBudget < 0) throw new Error('Budget harus angka positif');
    
    var config = getConfig_();
    var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    var sheetConfig = ss.getSheetByName(config.SHEET_CONFIG);
    if (!sheetConfig) throw new Error('Sheet CONFIG tidak ditemukan');
    
    var configData = sheetConfig.getDataRange().getValues();
    var found = false;
    for (var i = 0; i < configData.length; i++) {
      if (configData[i][0] && String(configData[i][0]).trim() === 'MONTHLY_OFFICE_BUDGET') {
        sheetConfig.getRange(i + 1, 2).setValue(newBudget);
        found = true;
        break;
      }
    }
    
    if (!found) {
      sheetConfig.appendRow(['MONTHLY_OFFICE_BUDGET', newBudget]);
    }
    
    return successResponse({ budget: newBudget });
  } catch (err) {
    return errorResponse(err.message || String(err));
  }
}

function getReportData(month) {
  try {
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

    var reportKantor = [];
    var reportPribadi = [];
    var totalKantor = 0;
    var totalPribadi = 0;
    var jumlahTransaksiKantor = 0;
    var jumlahTransaksiPribadi = 0;

    data.forEach(function(row) {
      var rowBulan = getCell(row, 'BULAN');
      if (rowBulan instanceof Date) {
        rowBulan = Utilities.formatDate(rowBulan, Session.getScriptTimeZone(), 'yyyy-MM');
      } else {
        rowBulan = String(rowBulan).trim();
      }

      if (rowBulan === month) {
        var nominal = parseFloat(getCell(row, 'NOMINAL'));
        if (isNaN(nominal)) nominal = 0;

        var tanggal = getCell(row, 'TANGGAL');
        var tanggalStr = '';
        if (tanggal instanceof Date) {
          tanggalStr = Utilities.formatDate(tanggal, Session.getScriptTimeZone(), 'yyyy-MM-dd');
        } else if (tanggal) {
          tanggalStr = String(tanggal).trim();
          if (tanggalStr.indexOf('T') !== -1) {
            tanggalStr = tanggalStr.split('T')[0];
          }
        }
        
        var tipe = String(getCell(row, 'TIPE')).trim();

        if (tipe === 'KANTOR') {
          reportKantor.push({
            tanggal: tanggalStr,
            claim_code: getCell(row, 'CLAIM_CODE'),
            dealer_code: getCell(row, 'DEALER_CODE'),
            nama_dealer: getCell(row, 'NAMA_DEALER'),
            nama_tempat: getCell(row, 'NAMA_TEMPAT'),
            deskripsi: getCell(row, 'DESKRIPSI'),
            keterangan: getCell(row, 'KETERANGAN'),
            nominal: nominal,
            link_kwitansi: getCell(row, 'FOTO_KWITANSI_URL'),
            status: getCell(row, 'STATUS')
          });
          totalKantor += nominal;
          jumlahTransaksiKantor++;
        } else if (tipe === 'PRIBADI') {
          reportPribadi.push({
            tanggal: tanggalStr,
            deskripsi: getCell(row, 'DESKRIPSI'),
            nominal: nominal,
            status: getCell(row, 'STATUS')
          });
          totalPribadi += nominal;
          jumlahTransaksiPribadi++;
        }
      }
    });

    var totalSemua = totalKantor + totalPribadi;

    var dashboardSummary = {};
    var dashboardRes = getDashboardData(month);
    if (dashboardRes && dashboardRes.ok && dashboardRes.data) {
      dashboardSummary = dashboardRes.data;
    }

    return successResponse({
      reportKantor: reportKantor,
      reportPribadi: reportPribadi,
      totalKantor: totalKantor,
      totalPribadi: totalPribadi,
      totalSemua: totalSemua,
      jumlahTransaksiKantor: jumlahTransaksiKantor,
      jumlahTransaksiPribadi: jumlahTransaksiPribadi,
      summary: {
        bulan: month,
        budgetKantor: Number(dashboardSummary.budgetKantor || 0),
        totalKantor: Number(dashboardSummary.totalPengeluaranKantor || dashboardSummary.totalKantor || totalKantor || 0),
        sisaBudgetKantor: Number(dashboardSummary.sisaBudgetKantor || 0),
        totalPribadi: Number(dashboardSummary.totalPengeluaranPribadi || dashboardSummary.totalPribadi || totalPribadi || 0),
        totalSemua: Number(dashboardSummary.totalSemuaPengeluaran || dashboardSummary.totalSemua || totalSemua || 0),
        totalMakan: Number(dashboardSummary.totalMakan || 0),
        totalNgopi: Number(dashboardSummary.totalNgopi || 0),
        topDealerList: Array.isArray(dashboardSummary.topDealerList) ? dashboardSummary.topDealerList : []
      }
    });
  } catch (err) {
    return errorResponse(err.message || String(err));
  }
}

function getDashboardData(month) {
  try {
    var config = getConfig_();
    if (!config.SPREADSHEET_ID) {
      throw new Error('SPREADSHEET_ID belum diisi di config.gs');
    }
    
    var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    
    var budgetKantor = 0;
    try {
      var sheetConfig = ss.getSheetByName(config.SHEET_CONFIG);
      if (sheetConfig) {
        var configData = sheetConfig.getDataRange().getValues();
        for (var i = 0; i < configData.length; i++) {
          var row = configData[i];
          if (row[0] && String(row[0]).trim() === 'MONTHLY_OFFICE_BUDGET') {
            var val = parseFloat(row[1]);
            if (!isNaN(val)) {
              budgetKantor = val;
            }
            break;
          }
        }
      }
    } catch (e) {
      // ignore
    }
    
    var sheetTrx = ss.getSheetByName(config.SHEET_TRANSAKSI);
    if (!sheetTrx) {
      throw new Error('Sheet TRANSAKSI tidak ditemukan');
    }
    
    var data = sheetTrx.getDataRange().getValues();
    data.shift(); // remove header row
    
    var totalKantor = 0;
    var totalPribadi = 0;
    var jumlahKantor = 0;
    var jumlahPribadi = 0;
    var totalMakan = 0;
    var totalNgopi = 0;
    var dealerMap = {};
    
    data.forEach(function(row) {
      // 6. Hitung data berdasarkan bulan yang dipilih, format bulan YYYY-MM
      var rowBulan = row[2];
      if (rowBulan instanceof Date) {
        rowBulan = Utilities.formatDate(rowBulan, Session.getScriptTimeZone(), 'yyyy-MM');
      } else if (rowBulan) {
        rowBulan = String(rowBulan).trim();
      }
      
      if (rowBulan === month) {
        var tipe = row[3];
        // 9. Pastikan kolom NOMINAL dibaca sebagai angka
        var nominal = parseFloat(row[10]);
        if (isNaN(nominal)) {
          nominal = 0;
        }
        
        // 8. TIPE transaksi: KANTOR untuk pengeluaran kantor, PRIBADI untuk pengeluaran pribadi
        if (tipe === 'KANTOR') {
          totalKantor += nominal;
          jumlahKantor++;

          // Dealer Map
          var dealerCode = String(row[4] || '').trim();
          var dealerName = String(row[5] || '').trim();
          var dealerKey = dealerCode || dealerName || 'Tanpa Dealer';
          var displayName = dealerName || dealerCode || 'Tanpa Dealer';

          if (!dealerMap[dealerKey]) {
            dealerMap[dealerKey] = {
              dealer_code: dealerCode || '',
              nama_dealer: displayName,
              total: 0,
              jumlah_trx: 0,
              percent: 0
            };
          }

          dealerMap[dealerKey].total += nominal;
          dealerMap[dealerKey].jumlah_trx += 1;

          // Hitung Makan vs Ngopi
          var namaTempat = String(row[7] || '');
          var deskripsi = String(row[8] || '');
          var keterangan = String(row[9] || '');
          var text = (namaTempat + ' ' + deskripsi + ' ' + keterangan).toLowerCase();

          var makanKeywords = ['makan', 'nasi', 'ayam', 'bakso', 'soto', 'rumah makan', 'resto', 'restaurant', 'lunch', 'dinner', 'food'];
          var ngopiKeywords = ['kopi', 'coffee', 'cafe', 'kafe', 'ngopi'];

          var isNgopi = ngopiKeywords.some(function(k) { return text.indexOf(k) !== -1; });
          var isMakan = makanKeywords.some(function(k) { return text.indexOf(k) !== -1; });

          if (isNgopi) {
            totalNgopi += nominal;
          } else if (isMakan) {
            totalMakan += nominal;
          }
        } else if (tipe === 'PRIBADI') {
          totalPribadi += nominal;
          jumlahPribadi++;
        }
      }
    });

    var topDealerList = Object.keys(dealerMap).map(function(key) {
      var item = dealerMap[key];
      item.percent = totalKantor > 0 ? Math.round((item.total / totalKantor) * 100) : 0;
      return item;
    }).sort(function(a, b) {
      return b.total - a.total;
    }).slice(0, 5);
    
    var sisaBudgetKantor = budgetKantor - totalKantor;
    var totalSemua = totalKantor + totalPribadi;
    
    var percentBudgetUsed = budgetKantor > 0 ? Math.round((totalKantor / budgetKantor) * 100) : 0;
    var budgetStatus = 'AMAN';

    if (percentBudgetUsed >= 100) {
      budgetStatus = 'OVER BUDGET';
    } else if (percentBudgetUsed >= 70) {
      budgetStatus = 'WASPADA';
    }
    
    var result = {
      budgetKantor: budgetKantor,
      totalKantor: totalKantor,
      totalPengeluaranKantor: totalKantor,
      sisaBudgetKantor: sisaBudgetKantor,
      totalPribadi: totalPribadi,
      totalPengeluaranPribadi: totalPribadi,
      totalSemua: totalSemua,
      totalSemuaPengeluaran: totalSemua,
      jumlahKantor: jumlahKantor,
      jumlahTrxKantor: jumlahKantor,
      jumlahPribadi: jumlahPribadi,
      jumlahTrxPribadi: jumlahPribadi,
      totalMakan: totalMakan,
      totalNgopi: totalNgopi,
      topDealerList: topDealerList,
      percentBudgetUsed: percentBudgetUsed,
      budgetStatus: budgetStatus
    };
    
    return successResponse(result);
  } catch (err) {
    return errorResponse(err.message || String(err));
  }
}
