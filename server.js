const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const { default: axios } = require('axios')
const cors = require('cors')
const app = express();
const server = http.createServer(app);
app.use(cors())
const io = new Server(server, {
    cors: {
        origin: ["*"],
        methods: ["GET", "POST"]
    }
})


const port = process.env.PORT || 2700;

app.use('/_next', express.static(path.join(__dirname, 'out/_next')));
app.use('/image', express.static(path.join(__dirname, 'out/image')));

app.get('/place.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'out/place.txt'));
});

app.get('/index.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'out/index.txt'));
});

app.get('/live-number.txt', (req, res) => {
    res.sendFile(path.join(__dirname, 'out/live-number.txt'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'out/index.html'));
});

app.get('/place', (req, res) => {
    res.sendFile(path.join(__dirname, 'out/place.html'));
});

app.get('/live-number', (req, res) => {
    res.sendFile(path.join(__dirname, 'ln.html'));
});
const getLiveNumber = async (e = 'fast', res) => {
    try {
        const response = await axios.get(`https://api.jaguarpools.co.uk/pools/results_number?type=${e.type}&session=${e.c}`);
        return response.data;
    } catch (error) {
        return false
    }
}
const getLiveNumber2 = async (e = 'fast', res) => {
    try {
        const response = await axios.get(`https://api.jaguarpools.co.uk/pools/results_number?type=${e.type}&session=${e.c}&limit=20`);
        return response.data;
    } catch (error) {
        return false
    }
}

io.on('connection', async (socket) => {
    socket.emit('connected', { message: 'a new client connected' });
    socket.on('search_fast', async (e) => {
        const liveNum = await getLiveNumber2(e)
        if(liveNum == false) {
            socket.emit('result_number_fast', {data: []})
        }else {
            socket.emit('result_number_fast', liveNum)
        }
    })
    socket.on('search_full', async (e) => {
        const liveNum = await getLiveNumber2(e)
        if(liveNum == false) {
            socket.emit('result_number_full', {data: []})
        }else {
            socket.emit('result_number_full', liveNum)
        }
    })

    socket.on('search', async (e) => {
        try {
            const liveNum = await getLiveNumber(e)
            if(liveNum == false) return socket.emit('error', 'Please Login');
            let datas = '';
            liveNum.data.forEach((value, index) => {
                datas += `<tr>
                            <td>${value.id}</td>
                            <td>${value.number}</td>
                            <td>${value.d}</td>
                            <td>${value.type}</td>
                            </tr>`;
            });
            socket.emit('data', datas);
        } catch (error) {
            console.error('Error:', error);
            // Handle error, emit an error event, or send an error response to the client
        }
    });
});

// Middleware untuk menangani halaman 404
app.use((req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'out/404.html'));
});

server.listen(port, () => {
    console.log(`Listening on port ${port}`);
});