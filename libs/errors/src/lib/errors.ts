export interface CustomErrorOptions {
  errorDescription?: string
  errorCauses?: string[]
}

export class CustomError {
  message!: string
  statusCode!: number
  errorDescription!: string
  errorCauses!: string[]

  constructor(message: string, statusCode = 500, options: CustomErrorOptions = {}) {
    const { errorDescription, errorCauses } = options
    this.message = message
    this.statusCode = statusCode
    this.errorDescription = errorDescription
    this.errorCauses = errorCauses
  }
}
