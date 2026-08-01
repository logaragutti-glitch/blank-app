export interface PasswordResetEmailParams {
  to: string;
  resetUrl: string;
  expiresInMinutes: number;
}

export interface InviteEmailParams {
  to: string;
  inviteUrl: string;
  organizationName: string;
  invitedByName: string;
  expiresInDays: number;
}

/** Port for outbound transactional email (password reset, team invites). */
export abstract class EmailPort {
  abstract sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void>;
  abstract sendInviteEmail(params: InviteEmailParams): Promise<void>;
}
