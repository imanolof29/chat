import { Column, CreateDateColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Chat } from "./chat.entity";
import { User } from "src/auth/entity/user.entity";

export class Message {
    @PrimaryGeneratedColumn()
    id: string;

    @Column({ nullable: false })
    content: string;

    @ManyToOne(() => Chat, (chat) => chat.messages)
    chat: Chat;

    @ManyToOne(() => User, (user) => user.messages)
    sender: User;

    @CreateDateColumn()
    createdAt: Date;

}