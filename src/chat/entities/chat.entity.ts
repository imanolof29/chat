import { CreateDateColumn, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Message } from "./message.entity";
import { User } from "src/auth/entity/user.entity";

export class Chat {
    @PrimaryGeneratedColumn()
    id: string;

    @OneToMany(() => Message, (message) => message.chat)
    messages: Message[];

    @ManyToMany(() => User, { cascade: true })
    @JoinTable({
        name: "chat_participants",
        joinColumn: { name: "chatId", referencedColumnName: "id" },
        inverseJoinColumn: { name: "userId", referencedColumnName: "id" }
    })
    participants: User[];

    @CreateDateColumn()
    createdAt: Date;

}
