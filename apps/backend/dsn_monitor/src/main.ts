import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || origin.includes("localhost")) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    // 允许携带凭证（cookies、authorization headers 等）
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
