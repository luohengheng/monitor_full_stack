import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ClickhouseModule } from "./fundamentals/clickhouse/clickhouse.module";
import { SpanModule } from "./modules/span/span.module";
// import { EmailModule } from "./fundamentals/email/email.module";

const nodeEnv = process.env.NODE_ENV ?? "development"; // 读取运行环境变量，未设置时默认 development（避免加载 .env.undefined）

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${nodeEnv}`],
    }),
    // 使用异步配置方法，通过 ConfigService 获取配置变量
    ClickhouseModule.forRootAsync(),
    // EmailModule.forRoot({
    //   host: "smtp.gmail.com",
    //   port: 587,
    //   secure: false,
    //   auth: {
    //     user: process.env.EMAIL_USER || "",
    //     pass: process.env.EMAIL_PASSWORD || "",
    //   },
    // }),
    // TypeOrmModule.forRoot({
    //   type: "postgres",
    //   host: process.env.POSTGRES_HOST || "",
    //   port: 5432,
    //   username: process.env.POSTGRES_USER || "",
    //   password: process.env.POSTGRES_PASSWORD || "",
    //   database: "postgres",
    //   entities: [join(__dirname, "**/*.entity{.ts,.js}")],
    //   synchronize: true,
    // }),
    // EmailModule,
    SpanModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
