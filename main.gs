function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('CashFlow App')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
