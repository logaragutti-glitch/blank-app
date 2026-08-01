import { Injectable, Logger } from "@nestjs/common";
import nodemailer, { type Transporter } from "nodemailer";
import { EmailPort, type InviteEmailParams, type PasswordResetEmailParams } from "./email.port";

/**
 * Sends real email through a Gmail or Google Workspace account over SMTP
 * (same servers, same "gmail" nodemailer preset for both). Auth requires an
 * App Password, not the account's normal password — Google requires 2-Step
 * Verification enabled, then Google Account → Security → App Passwords to
 * generate one (see docs/11-deployment-guide.md).
 */
@Injectable()
export class GmailEmailProvider implements EmailPort {
  private readonly logger = new Logger(GmailEmailProvider.name);
  // Constructed lazily, not in the constructor: nodemailer.createTransport
  // doesn't validate credentials up front, but building it only on first
  // real use keeps this consistent with the other lazily-constructed
  // provider clients in this codebase (e.g. OpenAiEmbeddingProvider).
  private transporter: Transporter | undefined;

  private getTransporter(): Transporter {
    this.transporter ??= nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });
    return this.transporter;
  }

  async sendPasswordResetEmail({ to, resetUrl, expiresInMinutes }: PasswordResetEmailParams): Promise<void> {
    await this.send(
      to,
      "Redefinir sua senha — EVE OS",
      `<p>Recebemos um pedido para redefinir a senha da sua conta.</p>
       <p><a href="${resetUrl}">Clique aqui para criar uma nova senha</a></p>
       <p>Esse link expira em ${expiresInMinutes} minutos. Se você não pediu isso, ignore este e-mail.</p>`,
    );
  }

  async sendInviteEmail({
    to,
    inviteUrl,
    organizationName,
    invitedByName,
    expiresInDays,
  }: InviteEmailParams): Promise<void> {
    await this.send(
      to,
      `${invitedByName} te convidou para ${organizationName} — EVE OS`,
      `<p>${invitedByName} te convidou para entrar em ${organizationName} no EVE OS.</p>
       <p><a href="${inviteUrl}">Clique aqui para aceitar o convite</a></p>
       <p>Esse link expira em ${expiresInDays} dias.</p>`,
    );
  }

  private async send(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.getTransporter().sendMail({ from: process.env.GMAIL_USER, to, subject, html });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send email to ${to}: ${message}`);
      throw error;
    }
  }
}
