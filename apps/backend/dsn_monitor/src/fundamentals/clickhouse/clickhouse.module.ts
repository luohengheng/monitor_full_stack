import { createClient } from "@clickhouse/client";
import { DynamicModule, Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

@Global()
@Module({})
export class ClickhouseModule {
  // 同步配置方法，保留原有功能
  static forRoot(options: {
    url: string;
    username: string;
    password: string;
  }): DynamicModule {
    return {
      module: ClickhouseModule,
      providers: [
        {
          provide: "CLICKHOUSE_CLIENT",
          useFactory() {
            return createClient(options);
          },
        },
      ],
      exports: ["CLICKHOUSE_CLIENT"],
    };
  }

  // 异步配置方法，使用 ConfigService 获取配置
  static forRootAsync(): DynamicModule {
    return {
      module: ClickhouseModule,
      providers: [
        {
          provide: "CLICKHOUSE_CLIENT",
          useFactory: (configService: ConfigService) => {
            // 从配置服务中获取 ClickHouse 相关配置
            const url = configService.get<string>("CLICKHOUSE_URL") || "";
            const username =
              configService.get<string>("CLICKHOUSE_USERNAME") || "";
            const password =
              configService.get<string>("CLICKHOUSE_PASSWORD") || "";
            // 创建并返回 ClickHouse 客户端
            return createClient({
              url,
              username,
              password,
            });
          },
          inject: [ConfigService], // 注入 ConfigService 依赖
        },
      ],
      exports: ["CLICKHOUSE_CLIENT"],
    };
  }
}
