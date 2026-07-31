export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

/** Port for outbound transactional email (password reset today, more later). */
export abstract class EmailPort {
  abstract sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void>;
}
