const sendMailMock = jest.fn();
const createTransportMock = jest.fn().mockReturnValue({ sendMail: sendMailMock });

jest.mock("nodemailer", () => ({
  __esModule: true,
  default: { createTransport: (...args: unknown[]) => createTransportMock(...args) },
}));

// eslint-disable-next-line import/first
import { GmailEmailProvider } from "./gmail-email.provider";

describe("GmailEmailProvider", () => {
  beforeEach(() => {
    sendMailMock.mockReset();
    createTransportMock.mockClear();
    process.env.GMAIL_USER = "sender@evefestas.com";
    process.env.GMAIL_APP_PASSWORD = "test-app-password";
  });

  it("configures the transporter with the gmail service preset and app-password auth", async () => {
    sendMailMock.mockResolvedValue({ messageId: "abc" });
    const provider = new GmailEmailProvider();

    await provider.sendPasswordResetEmail({
      to: "user@evefestas.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      expiresInMinutes: 60,
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: "sender@evefestas.com", pass: "test-app-password" },
    });
  });

  it("sends the password reset email with the reset link and expiry in the body", async () => {
    sendMailMock.mockResolvedValue({ messageId: "abc" });
    const provider = new GmailEmailProvider();

    await provider.sendPasswordResetEmail({
      to: "user@evefestas.com",
      resetUrl: "https://example.com/reset-password?token=abc",
      expiresInMinutes: 60,
    });

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "sender@evefestas.com",
        to: "user@evefestas.com",
        html: expect.stringContaining("https://example.com/reset-password?token=abc"),
      }),
    );
  });

  it("sends the invite email with the invite link, org name, and inviter name in the body", async () => {
    sendMailMock.mockResolvedValue({ messageId: "abc" });
    const provider = new GmailEmailProvider();

    await provider.sendInviteEmail({
      to: "invitee@evefestas.com",
      inviteUrl: "https://example.com/accept-invite?token=xyz",
      organizationName: "Tia Bia Festas",
      invitedByName: "Bia Azevedo",
      expiresInDays: 7,
    });

    const call = sendMailMock.mock.calls[0]![0];
    expect(call.to).toBe("invitee@evefestas.com");
    expect(call.subject).toContain("Bia Azevedo");
    expect(call.subject).toContain("Tia Bia Festas");
    expect(call.html).toContain("https://example.com/accept-invite?token=xyz");
  });

  it("propagates errors from the SMTP send", async () => {
    sendMailMock.mockRejectedValue(new Error("Invalid login: 535-5.7.8"));
    const provider = new GmailEmailProvider();

    await expect(
      provider.sendPasswordResetEmail({ to: "user@evefestas.com", resetUrl: "https://example.com", expiresInMinutes: 60 }),
    ).rejects.toThrow(/Invalid login/);
  });

  it("reuses the same transporter across multiple sends", async () => {
    sendMailMock.mockResolvedValue({ messageId: "abc" });
    const provider = new GmailEmailProvider();

    await provider.sendPasswordResetEmail({ to: "a@evefestas.com", resetUrl: "https://example.com", expiresInMinutes: 60 });
    await provider.sendPasswordResetEmail({ to: "b@evefestas.com", resetUrl: "https://example.com", expiresInMinutes: 60 });

    expect(createTransportMock).toHaveBeenCalledTimes(1);
    expect(sendMailMock).toHaveBeenCalledTimes(2);
  });
});
