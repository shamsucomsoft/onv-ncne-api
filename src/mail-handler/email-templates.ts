export const getWelcomeEmailTemplate = (name: string) => `
  <h1>Welcome, ${name}!</h1>
  <p>Thank you for joining our platform. We're excited to have you on board.</p>
`;

export const getForgotPasswordTokenTemplate = (token: string) => `
  <h1>Reset Your Password</h1>
  <p>Click the link below to reset your password. The link will expire in 1 hour.</p>
  <a href="https://yourapp.com/reset-password?token=${token}">Reset Password</a>
`;

export const getSignupTokenTemplate = (token: string) => `
  <h1>Confirm Your Email</h1>
  <p>Click the link below to confirm your email address. The link will expire in 24 hours.</p>
  <a href="https://yourapp.com/confirm-email?token=${token}">Confirm Email</a>
`;
