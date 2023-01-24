import { IsString } from 'class-validator';

export class NewMessage {
  @IsString()
  message: string;
}
