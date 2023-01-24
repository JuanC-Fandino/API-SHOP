import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { MessageWsService } from './message-ws.service';
import { Server, Socket } from 'socket.io';
import { NewMessage } from './dtos/new-message.dto';
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '../auth/interfaces';

@WebSocketGateway({ cors: true })
export class MessageWsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() wss: Server;

  constructor(
    private readonly messageWsService: MessageWsService,
    private readonly jwtService: JwtService,
  ) {}

  handleConnection(client: Socket): any {
    const token = client.handshake.headers.authentication as string;
    console.log(token);
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(token);
    } catch (error) {
      client.disconnect();
      return;
    }
    console.log({ payload });

    this.messageWsService.registerClient(client);
    console.log('client connected', client.id);
    console.log({ conectados: this.messageWsService.getConnectedClients() });
    this.wss.emit('nombreEvento', this.messageWsService.getConnectedClients());

    // Esto es para unir el cliente a un room.
    // client.join('ventas');
    // Esto es para enviar un mensaje a todos los clientes que estén en el room 'ventas'.
    // this.wss.to('ventas').emit('message-from-server', {
    //   fullName: 'Hol',
    //   message: 'mensaje de ventas',
    // });
  }

  handleDisconnect(client: any): any {
    this.messageWsService.removeClient(client.id);
    console.log('client disconnected', client.id);
    console.log({ conectados: this.messageWsService.getConnectedClients() });
    this.wss.emit('nombreEvento', this.messageWsService.getConnectedClients());
  }

  // listen to event: message-from-client
  @SubscribeMessage('message-from-client')
  onMessageFromClient(client: Socket, payload: NewMessage) {
    // console.log(client.id, payload);

    //! Emite únicamente al cliente.
    // client.emit('message-from-server', {
    //   fullName: 'Hol',
    //   message: payload.message || 'no-message',
    // });

    // Emite a todos los clientes conectados excepto al que lo emitió.
    client.broadcast.emit('message-from-server', {
      fullName: 'Hol',
      message: payload.message || 'no-message',
    });

    // Emite a todos los clientes conectados incluyendo al que lo emitió.
    // this.wss.emit('message-from-server', {
    //   fullName: 'Hol',
    //   message: payload.message || 'no-message',
    // });
  }
}
