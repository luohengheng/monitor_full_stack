import * as fs from "node:fs";
import { join } from "node:path";

import { Inject, Injectable, Logger } from "@nestjs/common";
import { compile } from "handlebars";
import type { Transporter } from "nodemailer";

@Injectable()
export class EmailService {
  constructor(
    @Inject("EMAIL_CLIENT") private readonly emailClient: Transporter,
  ) {}

  async alert(params: { to: string; subject: string; params: any }) {
    const alterTemplate = await fs.promises.readFile(
      join(__dirname, "../../templates/email/issues.hbs"),
      "utf-8",
    );
    const res = await this.emailClient.sendMail({
      from: "miaomaedu@163.com",
      to: params.to,
      subject: params.subject,
      html: compile(alterTemplate)(params.params),
    });

    Logger.log("Email sent", res);
  }
}
