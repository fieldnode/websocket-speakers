import { RTCPeerConnection } from 'wrtc'

import { Connection } from './Connection'

const TIME_TO_CONNECTED = 10000
const TIME_TO_HOST_CANDIDATES = 3000 // NOTE(mroberts): Too long.
const TIME_TO_RECONNECTED = 10000

export class WebRtcConnection extends Connection {
  private beforeOffer!: Function
  private timeToConnected!: number
  private timeToReconnected!: number
  private peerConnection!: RTCPeerConnection;
  private onIceConnectionStateChange!: () => void;
  private connectionTimer!: unknown
  private options!: any
  private reconnectionTimer: any = null

  constructor (id: string, options: any = {}) {
    super(id)

    options = {
      beforeOffer () {},
      clearTimeout,
      setTimeout,
      timeToConnected: TIME_TO_CONNECTED,
      timeToHostCandidates: TIME_TO_HOST_CANDIDATES,
      timeToReconnected: TIME_TO_RECONNECTED,
      ...options
    }

    this.options = options

    const {
      beforeOffer,
      timeToConnected,
      timeToReconnected
    } = options

    this.beforeOffer = beforeOffer
    this.timeToConnected = timeToConnected
    this.timeToReconnected = timeToReconnected

    this.peerConnection = new RTCPeerConnection({
      sdpSemantics: 'unified-plan',
      portRange: {
        min: 4000,
        max: 60000
      }
    })

    beforeOffer(this.peerConnection)

    this.connectionTimer = options.setTimeout(() => {
      if (this.peerConnection.iceConnectionState !== 'connected' &&
        this.peerConnection.iceConnectionState !== 'completed') {
        this.close()
      }
    }, timeToConnected)

    this.onIceConnectionStateChange = () => {
      if (this.peerConnection.iceConnectionState === 'connected' ||
        this.peerConnection.iceConnectionState === 'completed') {
        if (this.connectionTimer) {
          options.clearTimeout(this.connectionTimer)
          this.connectionTimer = null
        }
        options.clearTimeout(this.reconnectionTimer)
        this.reconnectionTimer = null
      } else if (this.peerConnection.iceConnectionState === 'disconnected' ||
        this.peerConnection.iceConnectionState === 'failed') {
        if (!this.connectionTimer && !this.reconnectionTimer) {
          const self = this
          this.reconnectionTimer = options.setTimeout(() => {
            self.close()
          }, timeToReconnected)
        }
      }
    }

    this.peerConnection.addEventListener('iceconnectionstatechange', this.onIceConnectionStateChange)

    Object.defineProperties(this, {
      iceConnectionState: {
        get () {
          return this.peerConnection.iceConnectionState
        }
      },
      localDescription: {
        get () {
          return descriptionToJSON(this.peerConnection.localDescription, true)
        }
      },
      remoteDescription: {
        get () {
          return descriptionToJSON(this.peerConnection.remoteDescription)
        }
      },
      signalingState: {
        get () {
          return this.peerConnection.signalingState
        }
      }
    })
  }

  doOffer = async () => {
    const offer = await this.peerConnection.createOffer()
    await this.peerConnection.setLocalDescription(offer)
    try {
      await waitUntilIceGatheringStateComplete(this.peerConnection, this.options)
    } catch (error) {
      this.close()
      throw error
    }
  }

  applyAnswer = async (answer: RTCSessionDescriptionInit) => {
    await this.peerConnection.setRemoteDescription(answer)
  }

  close = () => {
    this.peerConnection.removeEventListener('iceconnectionstatechange', this.onIceConnectionStateChange)
    if (this.connectionTimer) {
      this.options.clearTimeout(this.connectionTimer)
      this.connectionTimer = null
    }
    if (this.reconnectionTimer) {
      this.options.clearTimeout(this.reconnectionTimer)
      this.reconnectionTimer = null
    }
    this.peerConnection.close()
    super.close()
  }

  toJSON = () => {
    return {
      ...super.toJSON(),
      iceConnectionState: this.peerConnection.iceConnectionState,
      localDescription: this.peerConnection.localDescription,
      remoteDescription: this.peerConnection.remoteDescription,
      signalingState: this.peerConnection.signalingState
    }
  }
}

function descriptionToJSON (description?: any, shouldDisableTrickleIce?: boolean) {
  return !description ? {} : {
    type: description.type,
    sdp: shouldDisableTrickleIce ? disableTrickleIce(description.sdp) : description.sdp
  }
}

function disableTrickleIce (sdp: string) {
  return sdp.replace(/\r\na=ice-options:trickle/g, '')
}

async function waitUntilIceGatheringStateComplete (peerConnection: RTCPeerConnection, options: any) {
  if (peerConnection.iceGatheringState === 'complete') {
    return
  }

  const { timeToHostCandidates } = options

  const deferred: any = {}
  deferred.promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve
    deferred.reject = reject
  })

  const timeout = options.setTimeout(() => {
    peerConnection.removeEventListener('icecandidate', onIceCandidate)
    deferred.reject(new Error('Timed out waiting for host candidates'))
  }, timeToHostCandidates)

  function onIceCandidate ({ candidate }: any) {
    if (!candidate) {
      options.clearTimeout(timeout)
      peerConnection.removeEventListener('icecandidate', onIceCandidate)
      deferred.resolve()
    }
  }

  peerConnection.addEventListener('icecandidate', onIceCandidate)

  await deferred.promise
}
