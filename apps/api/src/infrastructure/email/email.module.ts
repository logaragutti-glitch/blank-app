import { Global, Module } from "@nestjs/common";
import { ConsoleEmailProvider } from "./console-email.provider";
import { EmailPort } from "./email.port";

@Global()
@Module({
  providers: [{ provide: EmailPort, useClass: ConsoleEmailProvider }],
  exports: [EmailPort],
})
export class EmailModule {}
