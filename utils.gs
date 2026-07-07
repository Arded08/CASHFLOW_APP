// Utilities
function successResponse(data) {
  return { ok: true, data: data };
}

function errorResponse(message) {
  return { ok: false, message: message };
}
