export const BadRequestResponse = (options: {
  message: string
}) => {
  return {
    400: {
      description: options.message
    }
  }
}
