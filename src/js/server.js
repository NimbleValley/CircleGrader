import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import axios from 'axios';

const KEY = 'g0mxOUZrBxzM1G0ZIss3';

const app = express();
app.use(express.static('./src'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Run port 8080 to match other projects
const PORT = 8080;

const server = createServer(app);
server.listen(PORT, function () {
    console.log(`Server running on port ${PORT}`);
});

const socketio = new Server(server);

socketio.on('connection', (socket) => {
    socket.on('analyze_image', analyzeImage);
});

function analyzeImage(image) {
    console.log('Imaged recieved by local server.');

    axios({
        method: 'POST',
        url: 'https://detect.roboflow.com/circles-pbtk8/1',
        params: {
            api_key: KEY
        },
        data: image,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    })
    .then(function(response) {
        console.log(response.data);
        socketio.emit('send-circle-points', response.data);
    })
    .catch(function(error) {
        console.log(error.message);
    });
}