import { Module } from "@nestjs/common";

// import { EmailModule } from "../email/email.module";
// import { EmailService } from "../email/email.service";
import { SpanController } from "./span.controller";
import { SpanService } from "./span.service";

@Module({
  imports: [],
  controllers: [SpanController],
  providers: [SpanService],
})
export class SpanModule {}
