export type RegisterValidationErrors = {
  form?: string;
  phoneNumber?: string;
};

export const validateRegistrationForm = (
  formData: FormData,
): RegisterValidationErrors => {
  const errors: RegisterValidationErrors = {};

  const phoneNumber = formData.get('phoneNumber')?.toString() || '';
  if (!phoneNumber || phoneNumber.trim() === '') {
    errors.phoneNumber = 'Phone number is required.';
  }

  return errors;
};

export const extractRegistrationFormValues = (formData: FormData) => {
  const phoneNumber = formData.get('phoneNumber')?.toString() ?? '';
  const emailAddress = formData.get('emailAddress')?.toString() ?? '';
  const firstName = formData.get('firstName')?.toString() ?? '';
  const lastName = formData.get('lastName')?.toString() ?? '';

  return {
    emailAddress,
    firstName,
    lastName,
    phoneNumber,
  };
};
