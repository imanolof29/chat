import { PrimaryGeneratedColumn } from "typeorm";

export class MessageEntity {
    @PrimaryGeneratedColumn()
    id: string;
}