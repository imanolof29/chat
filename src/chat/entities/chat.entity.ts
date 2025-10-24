import { PrimaryGeneratedColumn } from "typeorm";

export class Chat {
    @PrimaryGeneratedColumn()
    id: string;
}
