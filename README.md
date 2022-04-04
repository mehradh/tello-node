# Tello Node

A Typescript promise wrapper to communicate with the DJI Tello drone in Nodejs

## Requirements
You will need a DJI Ryze Tello drone and Nodejs installed.

## Install

```bash
npm install tello-node --save
```

## Usage

```js
const tello = TelloNode.getInstance(TelloNode.getDefaultConfig())
await tello.connect()
const battery = await tello.send('battery?')
```


## Usage with custom configuration

```js
const tello = TelloNode.getInstance({
    tello: '192.168.10.1' // address of Tello Drone
    command: 8889 // port on which Tello will be listening for commands
    state: 8890 // port on which to listen for Tello state messages
    server: '0.0.0.0' // address of server, should be localhost
    timeout: 3000 // number of miliseconds to wait for a command be responded to
    silent: false // print logs to console
})
await tello.connect()
const battery = await tello.send('battery?')
```


## Usage with autoconnect and autocommand

```js
const battery = await TelloNode.getInstance(TelloNode.getDefaultConfig()).send('battery?')
```

## More examples

See [/examples](/examples/) for more information.


## License
[APACHE 2](/LICENSE)
