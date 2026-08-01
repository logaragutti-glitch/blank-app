import { Global, Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { JwtStrategy } from "./jwt.strategy";
import { PrismaInviteRepository } from "./repositories/prisma-invite.repository";
import { PrismaUserRepository } from "./repositories/prisma-user.repository";
import { InviteRepository } from "./repositories/invite.repository";
import { UserRepository } from "./repositories/user.repository";
import { RolesGuard } from "./roles.guard";

// Global: JwtAuthGuard/RolesGuard apply to every route in the app (opt out
// per-route with @Public()), and UserRepository/AuthService are usable
// anywhere a controller needs to know who's making the request.
@Global()
@Module({
  imports: [
    PassportModule,
    // registerAsync, not register: a plain register({secret: process.env.X})
    // reads process.env at *module-decorator-evaluation* time — which runs
    // while this file's imports are still being required, before
    // ConfigModule.forRoot() (loaded later in app.module.ts) has populated
    // process.env from .env. That mismatch would make JwtModule sign tokens
    // with the "change-me-in-production" fallback while JwtStrategy (built
    // later, once DI actually instantiates it) verifies against the real
    // .env value — every token rejected as invalid. useFactory defers the
    // read to runtime, after ConfigModule has already run.
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: process.env.JWT_SECRET ?? "change-me-in-production",
        signOptions: { expiresIn: "24h" },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: UserRepository, useClass: PrismaUserRepository },
    { provide: InviteRepository, useClass: PrismaInviteRepository },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [UserRepository],
})
export class AuthModule {}
