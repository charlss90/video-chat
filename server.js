var static = require('node-static');
var http = require('http');
var file = new(static.Server)();

function findClientSocket(roomId, namespace) {
    var res = [];
    ns = io.of(namespace || "/");
    console.log("Verificando habitaciones");
    if(ns) {
        for(var id in ns.connected) {
            if(roomId) {
                var index = ns.connected[id].rooms.indexOf(roomId);

                if (index !== -1) {
                    res.push(ns.connected[id]);
                }
            }
        }
    }
    return res;
}

var port = 8000;
var app = http.createServer(function(req, res) {
    file.serve(req, res);
}).listen(port);

var io = require('socket.io').listen(app);

var $room = io.on('connection', function (socket) {

    function log(){
        var array = ['>>> Message from server: '];
        for (var i = 0; i < arguments.length; i++) {
          array.push(arguments[i]);
        }
          socket.emit('log', array);
    }

    socket.on('message', function(message) {
        log("Got message: "+message);
        socket.broadcast.emit('message', message);
    });

    socket.on('create or join', function(room) {
        console.log("Room: "+ room);
        var clientes = findClientSocket(room);
        console.log(clientes);
        var numClients = findClientSocket(room).length;

        log('Room '+ room + ' has '+numClients+' client(s)');

        if(numClients === 0) {
            socket.join(room);
            socket.emit('created', room);
        } else if (numClients === 1) {
            io.sockets.in(room).emit('join', room);
            socket.join(room);
            socket.emit('joined', room);
        } else {
            socket.emit('full', room);
        }

        socket.emit('emit(): client '+socket.id+' joined room '+room);
        socket.broadcast.emit('broadcast(): client'+socket.id+' joined room '+room);


    });

    socket.on('hello', function (data) {
        console.log('hello:: ' + JSON.stringify(data) );
        socket.broadcast.emit('hello', {id:socket.id, data: data});
    });

    socket.on('sdp', function (sdp) {
        console.log("SDP::  what the is shit!");
        socket.broadcast.emit('sdp_createAnswer', {id:socket.id, data:sdp });
    });

    socket.on('sdp_createAnswer', function (sdp) {
        console.log("SDP::  what the is shit!");
        socket.broadcast.emit('sdp', {id:socket.id, data:sdp });
    });

    socket.on('icecandidate', function (candidate) {
        socket.broadcast.emit('icecandidate', {id:socket.id, data: candidate});
    });

    socket.on('call', function (data) {
        socket.broadcast.emit('call', {id: socket.id});
    });



});

console.log("Listen in port: "+ port);
