import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "./public.decorator";
import { AuthService } from "./auth.service";
import { AcceptInviteDto } from "./dto/accept-invite.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { InviteMemberDto } from "./dto/invite-member.dto";
import { LoginDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { CurrentUser } from "./current-user.decorator";
import type { AuthenticatedUser } from "./jwt-payload";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Public()
  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Public()
  @Post("forgot-password")
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto);
  }

  @Public()
  @Post("reset-password")
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.auth.resetPassword(dto);
  }

  /** No @Roles() gate — see AuthService.inviteMember for why. */
  @Post("invite")
  inviteMember(@CurrentUser() user: AuthenticatedUser, @Body() dto: InviteMemberDto) {
    return this.auth.inviteMember(user.sub, dto);
  }

  @Public()
  @Post("accept-invite")
  acceptInvite(@Body() dto: AcceptInviteDto) {
    return this.auth.acceptInvite(dto);
  }
}
