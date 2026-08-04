-- AlterTable: capture the first two questions of the real Bia intake form
-- ("E-mail" and "Telefone/WhatsApp para contato") as first-class columns —
-- unlike the rest of that form's extra questions (see the additionalDetails
-- comment on Client in schema.prisma), contact info is simple scalar data
-- likely to be used elsewhere later (e.g. sending the proposal by e-mail).
ALTER TABLE "clients" ADD COLUMN "email" TEXT;
ALTER TABLE "clients" ADD COLUMN "phone" TEXT;
