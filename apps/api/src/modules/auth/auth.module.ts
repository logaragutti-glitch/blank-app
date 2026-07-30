import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaUserRepository } from "./repositories/prisma-user.repository";
import { UserRepository } from "./repositories/user.repository";
import { RolesGuard } from "./roles.guard";

// Global: JwtAuthGuard/RolesGuard apply to every route in the app (opt out
// per-route with @Public()), and UserRepository/AuthService are usable
// anywhere a controller needs to know who's making the request.
@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET ?? "change-me-in-production",
      signOptions: { expiresIn: "24h" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [UserRepository],
})
export class AuthModule {}
