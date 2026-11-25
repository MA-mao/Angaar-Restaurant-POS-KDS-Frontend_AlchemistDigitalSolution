// Every service throws this. UI code: catch (e) { if (e instanceof ServiceError) ... }
// code: VALIDATION | UNAUTHORIZED | NOT_FOUND | CONFLICT | INVALID_STATE | STORAGE
// fields: optional { fieldName: "message" } for form errors.
// When the real backend arrives, map HTTP errors to this same class so the UI does not change.
export class ServiceError extends Error {
  constructor(code, message, fields) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
    this.fields = fields;
  }
}
