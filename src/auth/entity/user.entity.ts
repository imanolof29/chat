import { Message } from "src/chat/entities/message.entity";
import { Column, CreateDateColumn, OneToMany, PrimaryGeneratedColumn } from "typeorm";

export class User {

    @PrimaryGeneratedColumn()
    id: string;

    @Column({ nullable: false, unique: true })
    username: string;

    @Column({ nullable: false, unique: true })
    email: string;

    @Column({ nullable: true })
    password: string;

    @Column({ nullable: true })
    avatarUrl: string;

    @OneToMany(() => Message, (message) => message.sender)
    messages: Message[];

    @CreateDateColumn()
    createdAt: Date;

}