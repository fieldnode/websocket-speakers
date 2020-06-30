// eslint-disable-next-line no-unused-vars
import { Application } from 'express-serve-static-core'

export interface ApplicationWithIO extends Application {
  io: SocketIO.Server
}
