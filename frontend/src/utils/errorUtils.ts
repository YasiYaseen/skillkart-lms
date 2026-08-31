/**
 * Extracts a user-friendly, specific error message from an API error response.
 * Unpacks Zod validation errors (fieldErrors/formErrors) to avoid showing generic "Validation failed".
 */
export function getErrorMessage(err: unknown, fallback = 'An unexpected error occurred'): string {
  if (!err || typeof err !== 'object') {
    return fallback;
  }

  const response = (err as { response?: { data?: Record<string, unknown> } }).response;
  if (!response?.data) {
    if ('message' in err && typeof (err as { message: unknown }).message === 'string') {
      return (err as { message: string }).message;
    }
    return fallback;
  }

  const data = response.data;

  // 1. Check for specific field errors from Zod flatten()
  if (data.errors && typeof data.errors === 'object') {
    const errorsObj = data.errors as Record<string, unknown>;

    // Handle { errors: { fieldName: ['Error message'] } }
    for (const key of Object.keys(errorsObj)) {
      const val = errorsObj[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
        return val[0];
      }
    }

    // Handle { errors: { fieldErrors: { fieldName: ['Error message'] } } }
    if (errorsObj.fieldErrors && typeof errorsObj.fieldErrors === 'object') {
      const fieldErrors = errorsObj.fieldErrors as Record<string, unknown>;
      for (const key of Object.keys(fieldErrors)) {
        const val = fieldErrors[key];
        if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'string') {
          return val[0];
        }
      }
    }

    // Handle { errors: { formErrors: ['Error message'] } }
    if (Array.isArray(errorsObj.formErrors) && errorsObj.formErrors.length > 0 && typeof errorsObj.formErrors[0] === 'string') {
      return errorsObj.formErrors[0];
    }
  }

  // 2. Check for explicit error message string
  if (typeof data.message === 'string' && data.message.trim().length > 0) {
    return data.message;
  }

  if (typeof data.error === 'string' && data.error.trim().length > 0) {
    return data.error;
  }

  return fallback;
}
