import { Global, Module } from "@nestjs/common";
import { ConsoleEmailProvider } from "./console-email.provider";
import { EmailPort } from "./email.port";
import { GmailEmailProvider } from "./gmail-email.provider";

@Global()
@Module({
  providers: [
    {
      provide: EmailPort,
      // No Gmail/Workspace credentials configured → fall back to logging
      // the link instead of fabricating a delivery (see
      // ConsoleEmailProvider). Set both env vars to send real email.
      useFactory: () =>
        process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
          ? new GmailEmailProvider()
          : new ConsoleEmailProvider(),
    },
  ],
  exports: [EmailPort],
})
export class EmailModule {}
