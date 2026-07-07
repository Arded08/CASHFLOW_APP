// Drive operations
function uploadReceipt(blob, fileName, folderId) {
  var folder = DriveApp.getFolderById(folderId);
  var file = folder.createFile(blob.setName(fileName));
  return {
    url: file.getUrl(),
    id: file.getId()
  };
}
