import { buildApp } from './app';

async function bootstrap(): Promise<void> {
  const app = await buildApp();
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
