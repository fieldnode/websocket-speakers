
import { Connection } from './Connection'

const uuidv4 = require('uuid/v4')

export class ConnectionManager {
  private connections = new Map();
  private closedListeners = new Map()
  private generateId!: Function;

  constructor (options:any = {}) {
    options = {
      generateId: uuidv4,
      ...options
    }

    const {
      generateId
    } = options

    this.generateId = generateId
  }

  createId () {
    do {
      const id = this.generateId()
      if (!this.connections.has(id)) {
        return id
      }
    // eslint-disable-next-line
    } while (true);
  }

  deleteConnection (connection: Connection) {
    // 1. Remove "closed" listener.
    const closedListener = this.closedListeners.get(connection)
    this.closedListeners.delete(connection)
    connection.removeListener('closed', closedListener)

    // 2. Remove the Connection from the Map.
    this.connections.delete(connection.id)
  }

  createConnection () {
    const id = this.createId()
    const connection = new Connection(id)

    // 1. Add the "closed" listener.
    const closedListener = () => { this.deleteConnection(connection) }
    this.closedListeners.set(connection, closedListener)
    connection.once('closed', closedListener)

    // 2. Add the Connection to the Map.
    this.connections.set(connection.id, connection)

    return connection
  }

  getConnection (id:string) {
    return this.connections.get(id) || null
  }

  getConnections () {
    return [
      ...this.connections.values()
    ]
  }

  toJSON () {
    return this.getConnections().map(connection => connection.toJSON())
  }
}
