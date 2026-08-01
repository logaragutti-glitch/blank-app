import { Injectable, Logger } from "@nestjs/common";
import { EmailPort, type InviteEmailParams, type PasswordResetEmailParams } from "./email.port";

/**
 * No real email provider (SES/Resend/SendGrid/etc.) is configured or
 * credentialed in this environment — see docs/11-deployment-guide.md. This
 * logs what would be sent instead of fabricating a delivery, exactly like
 * every other AI/storage port in this codebase only ever talks to a real
 * backend or is honest that it can't. A production deploy swaps this for a
 * real provider behind the same EmailPort — no caller-side changes needed.
 */
@Injectable()
export class ConsoleEmailProvider implements EmailPort {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendPasswordResetEmail({ to, resetUrl, expiresInMinutes }: PasswordResetEmailParams): Promise<void> {
    this.logger.log(
      `[email:not-sent, no provider configured] Password reset for ${to}: ${resetUrl} (expires in ${expiresInMinutes}min)`,
    );
  }

  async sendInviteEmail({
    to,
    inviteUrl,
    organizationName,
    invitedByName,
    expiresInDays,
  }: InviteEmailParams): Promise<void> {
    this.logger.log(
      `[email:not-sent, no provider configured] Invite for ${to} to join ${organizationName} ` +
        `(invited by ${invitedByName}): ${inviteUrl} (expires in ${expiresInDays}d)`,
    );
  }
}
