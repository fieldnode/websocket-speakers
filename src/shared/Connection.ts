import { EventEmitter } from 'events'

export class Connection extends EventEmitter {
  state!: string;
  id!: string;

  constructor (id: string) {
    super()
    this.id = id
    this.state = 'open'
  }

  close () {
    this.state = 'closed'
    super.emit('closed')
  }

  toJSON () {
    return {
      id: this.id,
      state: this.state
    }
  }
}
