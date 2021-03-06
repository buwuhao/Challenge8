var express = require('express'),
    app = express(),
    server = require('http').Server(app),
    serialport = require('serialport'),
    io = require('socket.io')(server);

const PORT = 3000;
const SERIAL_MSG_FORWARD = 0x00,
    SERIAL_MSG_BACKWARD = 0x01,
    SERIAL_MSG_TURN_LEFT = 0x02,
    SERIAL_MSG_TURN_RIGHT = 0x03,
    SERIAL_MSG_TOGGLE_MANUAL = 0x04;

app.use(express.static('client'));
app.get('/', function(req, res) {
    res.sendFile('client/index.html');
});

var serialOptions = {
    baudrate: 57600,
    parser: serialport.parsers.readline('\r\n')
};
var Serial = new serialport.SerialPort(process.argv[2], serialOptions, true, function(err) {
    if (err) console.log(err);

    io.on('connection', function(socket) {
        socket.on('control', function(data) {
            console.log('Control msg over socket:' + data);
            var command = data.toString();
            if (/btnUp/.test(command)) Serial.write(SERIAL_MSG_FORWARD);
            else if (/btnDown/.test(command)) Serial.write(SERIAL_MSG_BACKWARD);
            else if (/btnLeft/.test(command)) Serial.write(SERIAL_MSG_TURN_LEFT);
            else if (/btnRight/.test(command)) Serial.write(SERIAL_MSG_TURN_RIGHT);
            else if (/btnToggle/.test(command)) Serial.write(SERIAL_MSG_TOGGLE_MANUAL);
        });
    });

    Serial.on('error', function(err) {
        console.log(error);
    });

    Serial.on('data', function(data) {
        io.emit('location', data);
    });

    server.listen(PORT, function() {
        console.log('Listening on *:' + PORT);
    });
});
