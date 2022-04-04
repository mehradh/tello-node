import dgram from 'dgram'
import denque from 'denque'

const STATUS_OK = 'ok'
const CMD_COMMAND = 'command'
const DEFAULT_COMMAND_PORT = 8889
const DEFAULT_COMMAND_TIMEOUT = 3000
const DEFAULT_STATE_PORT = 8890
const DEFAULT_TELLO_ADDRESS = '192.168.10.1'
const DEFAULT_SERVER_ADDRESS = '0.0.0.0'

const server = dgram.createSocket('udp4');
const client = dgram.createSocket('udp4');
const queue = new denque()

export type TelloNodeConfig = {
  tello: string
  command: number
  state: number
  server: string
  timeout: number
  silent: boolean
}

export type TelloNodeState = {
  mid: number
  x: number
  y: number
  z: number
  pitch: number
  roll: number
  yaw: number
  vgx: number
  vgy: number
  vgz: number
  templ: number
  temph: number
  tof: number
  h: number
  bat: number
  baro: number
  time: number
  agx: number
  agy: number
  agz: number
}

type TelloNodeStateCallback = (str: string) => void | any

function log(silent: boolean, ...args: any[]) {
  if (!silent) {
    console.log('[TelloNode]', ...args)
  }
}

export default class TelloNode {
  private static instance: TelloNode
  private config: TelloNodeConfig
  private isServerSetup: boolean = false
  private isServerConnected: boolean = false
  private isClientSetup: boolean = false
  private isSending = false

  private constructor(config: TelloNodeConfig) {
    this.config = config
  }

  static getInstance(config: TelloNodeConfig): TelloNode {
    if (!TelloNode.instance) {
      TelloNode.instance = new TelloNode(config)
    }

    return TelloNode.instance
  }

  static getDefaultConfig(silent: boolean = false): TelloNodeConfig {
    return {
      tello: DEFAULT_TELLO_ADDRESS,
      command: DEFAULT_COMMAND_PORT,
      state: DEFAULT_STATE_PORT,
      server: DEFAULT_SERVER_ADDRESS,
      timeout: DEFAULT_COMMAND_TIMEOUT,
      silent
    }
  }

  async connect(autoCommand = true): Promise<void> {
    let promise: Promise<void>;

    if (!this.isServerSetup) {
      this.isServerSetup = true
      promise = new Promise<void>((resolve, reject) => {
        server.on('error', (error) => {
          server.close()
          server.disconnect()
          this.isServerConnected = false
          log(this.config.silent, `connection closed!`);
          reject(error)
        })

        server.on('listening', async () => {
          log(this.config.silent, `server connected on ${server.address().address}:${server.address().port}...`);
          this.isServerConnected = true
          if (autoCommand) {
            try {
              await this.command()
              resolve()
            } catch (error) {
              reject(error)
            }
          } else {
            resolve()
          }
        })

        const address = this.config.server, port = this.config.command;
        server.bind({ address, port })
      })
    } else {
      promise = new Promise<void>((resolve, reject) => this.isServerConnected ? resolve() : reject())
    }

    return promise
  }

  async command(): Promise<void> {
    return new Promise<void>(async (resolve, reject) => {
      log(this.config.silent, `setting COMMAND mode...`);
      const status = await this.send(CMD_COMMAND)
      status === STATUS_OK ? resolve() : reject(new Error('COMMAND responded with unexpected response:\n' + status))
    })
  }

  send(command: string): Promise<string> {
    const address = this.config.tello, port = this.config.command;
    log(this.config.silent, `sending "${command}" to ${address}:${port}...`);
    return new Promise(async (resolve, reject) => {
      if (this.isSending) {
        reject(new Error('already sending'))
      } else {
        if (!this.isServerConnected) {
          log(this.config.silent, 'not connected, trying autoconnect...')
          try {
            await this.connect(command !== CMD_COMMAND)
          } catch (error) {
            reject(error)
          }
        }

        this.isSending = true
        server.send(command, port, address, (err) => {
          this.isSending = false
          if (err) {
            reject(err)
          }
        })

        server.once('message', (msg) => {
          clearTimeout(timeout)
          this.isSending = false
          resolve(msg.toString().trim())
        })

        const timeout = setTimeout(() => {
          reject(new Error(`timeout reached while sending command "${command}" to ${address}:${port}`))
        }, this.config.timeout)
      }

    })
  }

  state(callback: TelloNodeStateCallback, parse: boolean = true): void {
    if (!this.isClientSetup) {
      const address = this.config.server, port = this.config.state;
      client.once('listening', () => {
        log(this.config.silent, `client listening on ${client.address().address}:${client.address().port}...`);
      })
      client.on('message', msg => queue.push(msg))
      client.bind({ address, port })
      this.isClientSetup = true
    }

    this.getStateFetcher(callback, parse)();
  }

  private getStateFetcher(callback: TelloNodeStateCallback, parse: boolean): () => void {
    const stateFetcher = () => {
      while (queue.length > 0) {
        const str = queue.shift().toString()
        callback(parse ? this.parseState(str) : str);
      }
      setImmediate(stateFetcher);
    }
    return stateFetcher
  }

  parseState(string: string): TelloNodeState {
    return string.trim().split(';').reduce((sum, current: string) => {
      const [key, value] = current.split(':')
      const currentObj = key && value ? { [key]: parseFloat(value) } : {}
      return { ...sum, ...currentObj }
    }, {} as TelloNodeState)
  }
}
