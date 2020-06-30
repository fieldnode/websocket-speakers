/* eslint-disable no-unused-vars */
import { Application } from 'express-serve-static-core'
import { ApplicationWithIO } from '../infertace/Application'
import * as socketio from 'socket.io'

export const createApplicationWithIO = (app: Application, io: socketio.Server) : ApplicationWithIO => {
  const newApp: ApplicationWithIO = {
    ...app,
    io
  }

  return newApp
}
