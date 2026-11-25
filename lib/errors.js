export class AppError extends Error {
  constructor(message, field) {
    super(message);
    this.name = 'AppError';
    this.field = field;
  }
}
