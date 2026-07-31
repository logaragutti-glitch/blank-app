import type { INestApplication } from "@nestjs/common";
import { ValidationPipe } from "@nestjs/common";

/**
 * Global pipes/CORS shared by main.ts (bootstrap) and e2e tests. e2e specs
 * build the app via `Test.createTestingModule(...).createNestApplication()`,
 * which does NOT run main.ts's bootstrap() — so anything configured only
 * there (like ValidationPipe) silently doesn't apply in those tests unless
 * they also call this function.
 */
export function configureApp(app: INestApplication): void {
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();
}
