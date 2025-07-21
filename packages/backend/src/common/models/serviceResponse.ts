export class ServiceResponse<T = null> {
  public readonly success: boolean;
  public readonly message: string;
  public readonly responseObject: T;
  public readonly statusCode: number;

  private constructor(success: boolean, message: string, responseObject: T, statusCode: number) {
    this.success = success;
    this.message = message;
    this.responseObject = responseObject;
    this.statusCode = statusCode;
  }

  static success<T>(message: string, responseObject: T, statusCode = 200) {
    return new ServiceResponse(true, message, responseObject, statusCode);
  }

  static failure<T = null>(message: string, responseObject: T = null as T, statusCode = 400) {
    return new ServiceResponse(false, message, responseObject, statusCode);
  }
}