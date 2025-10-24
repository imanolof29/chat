import { ParticipantDto } from "./participant.dto";

export class ChatDto {
    id: string;
    participants: ParticipantDto[];
    createdAt: Date;
}