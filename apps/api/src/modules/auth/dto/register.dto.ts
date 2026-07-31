import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

/**
 * Self-registration into an existing Organization (Tenant/Organization
 * provisioning is a separate, not-yet-built admin flow — see
 * docs/07-architecture-book.md). Every self-registered user gets the
 * default MEMBER role; role elevation is an admin-only operation, out of
 * scope here.
 *
 * organizationId is validated as a non-empty string, not @IsUUID() — the
 * seed data's fixed placeholder ids (e.g. "00000000-...-0002") aren't valid
 * RFC4122 UUIDs (invalid version nibble), and Postgres's own `@db.Uuid`
 * column already rejects anything that isn't UUID-shaped at the DB layer.
 */
export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;
}
