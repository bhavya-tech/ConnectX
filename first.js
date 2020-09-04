var express = require('express');
var app = express();
var room_output_socketid = {};
var app_in_room = {};

// Server redirections
app.use(express.static('apps'));

app.get('/:page', function(req, res) {
    console.log(req.params.page);
    res.sendFile(__dirname + "/" + req.params.page);
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + "/initial.html");
});


// Begin the server
var server = app.listen(8000, function() {
    var host = server.address().address;
    var port = server.address().port;
    console.log("Example app listening at http:// %s : %s", host, port);
});

// IO communications
var io = require('socket.io')(server);
var sys = io.of('/sys');
var msg = io.of('/msg');
sys.on('connection', function(socket) {

    socket.on('room_connect', function(room_no) {
        console.log("aa");
        if (socket.adapter.rooms[room_no]) {
            socket.join(room_no);
            socket.namespace = "msg";
            socket.join(room_no);
            console.log(room_no + " joined");
            // room successfully joined
            socket.emit('room_connect_status', 0);
        } else {
            console.log(room_no + "could not be joined");
            socket.emit('room_connect_status', 1);
        }
    });

    socket.on('room_create', function() {
        room_no = 0;

        // find the samllest index of empty room
        while (socket.adapter.rooms[room_no]) { room_no++; }
        socket.join(room_no);
        socket.namespace = "msg";
        socket.join(room_no);

        console.log("room created " + room_no);

        // Add it to record
        app_in_room[room_no] = "home";
        room_output_socketid[room_no] = socket.id;

        // send message of successful connection to output
        socket.emit('room_connect_status', room_no);
    });

    socket.on("SYS_getCurrentAppName", function() {
        console.log("get current app msg recieved from room " + socket.rooms[0]);
        socket.emit("SYS_appName", app_in_room[socket.rooms[0]]);
        console.log(app_in_room[socket.rooms[0]] + " emitted");
    });
});

msg.on('connection', function(socket) {
    socket.on("message", function(data) {
        process.nextTick(function() {
            console.log(data + " to " + socket.rooms[0]);
            io.to(room_output_socketid[socket.rooms[0]]).emit("message", data);
        });

    });
});