const TelloNode = require('../dist/TelloNode')

async function init() {
    try {
        const tello = TelloNode.getInstance({ ...TelloNode.getDefaultConfig(), silent: true })
        console.log('Battery level: ' + await tello.send('battery?'))
    } catch (error) {
        console.log('Error communicating with Tello:\n' + error.stack)
    }
}

init()