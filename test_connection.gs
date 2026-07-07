
// Test koneksi spreadsheet
function testSpreadsheetConnection() {
  try {
    var config = getConfig_();
    
    if (!config.SPREADSHEET_ID) {
      Logger.log('ERROR: SPREADSHEET_ID belum diisi di config.gs');
      return;
    }
    
    var ss = SpreadsheetApp.openById(config.SPREADSHEET_ID);
    Logger.log('Berhasil membuka Spreadsheet: ' + ss.getName());
    
    var sheetTransaksi = ss.getSheetByName(config.SHEET_TRANSAKSI);
    var sheetConfig = ss.getSheetByName(config.SHEET_CONFIG);
    
    if (sheetTransaksi) {
      Logger.log('OK: Sheet ' + config.SHEET_TRANSAKSI + ' ditemukan.');
    } else {
      Logger.log('ERROR: Sheet ' + config.SHEET_TRANSAKSI + ' TIDAK ditemukan!');
    }
    
    if (sheetConfig) {
      Logger.log('OK: Sheet ' + config.SHEET_CONFIG + ' ditemukan.');
    } else {
      Logger.log('ERROR: Sheet ' + config.SHEET_CONFIG + ' TIDAK ditemukan!');
    }
    
  } catch (e) {
    Logger.log('CRITICAL ERROR: ' + e.toString());
  }
}

function testDriveFolderConnection() {
  var config = getConfig_();
  if (!config.DRIVE_FOLDER_ID) {
    Logger.log('ERROR: DRIVE_FOLDER_ID belum diisi di config.gs');
    return;
  }

  try {
    var folder = DriveApp.getFolderById(config.DRIVE_FOLDER_ID);
    Logger.log('Berhasil membuka folder Drive: ' + folder.getName());
  } catch (e) {
    Logger.log('ERROR: Gagal membuka folder Drive: ' + e.toString());
  }
}

function forceDriveWriteAuthorization() {
  var config = getConfig_();

  if (!config.DRIVE_FOLDER_ID) {
    throw new Error('DRIVE_FOLDER_ID belum diisi di config.gs');
  }

  var folder = DriveApp.getFolderById(config.DRIVE_FOLDER_ID);
  var fileName = 'auth_test_' + new Date().getTime() + '.txt';
  var file = folder.createFile(fileName, 'authorization test');
  Logger.log('Drive write authorization OK. File created: ' + file.getName());
  file.setTrashed(true);
}
