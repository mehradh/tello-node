const TelloNode = require('../dist/TelloNode')

async function init() {
    try {
        const tello = TelloNode.getInstance(TelloNode.getDefaultConfig())
        await tello.command()
        tello.state((state) => {
            console.log('Drone state is:\b', JSON.stringify(state))
        })
    } catch (error) {
        console.log('Error communicating with Tello:\n' + error.stack)
    }
}

init()