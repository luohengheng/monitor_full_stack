import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Application {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar", length: 80 })
  name: string;

  @Column({ type: "enum", enum: ["vanilla", "react", "vue"] })
  type: "vanilla" | "react" | "vue";

  @Column({ nullable: true, default: () => "CURRENT_TIMESTAMP" })
  createdAt: Date;

  @Column({ type: "boolean", default: false })
  isDelete: boolean;
}
