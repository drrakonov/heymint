export class ApiResponse<T = any> {
  statusCode: number;
  data: T;
  success: boolean;
  message: string;

  constructor(statusCode: number, data: T, message = "Success") {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}
