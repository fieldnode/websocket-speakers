import { WebRtcConnection } from './WRTCConnection'
import { ConnectionManager } from './ConnectionManager'

class WebRtcConnectionManager {
  private connectionManager!: ConnectionManager

  constructor (options = {}) {
    options = {
      ...options
    }
    this.connectionManager = new ConnectionManager(options)
  }

  createConnection = async () => {
    const connection = this.connectionManager.createConnection()
    await connection.doOffer()
    return connection
  }

  getConnection (id: string) {
    return this.connectionManager.getConnection(id)
  }

  getConnections () {
    return this.connectionManager.getConnections()
  }

  toJSON () {
    return this.getConnections().map(connection => connection.toJSON())
  }
}
