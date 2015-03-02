navigator.getMedia = (  navigator.getUserMedia ||
                        navigator.webkitGetUserMedia ||
                        navigator.mozGetUserMedia ||
                        navigator.msGetUserMedia );

var PeerConnection = window.mozRTCPeerConnection || window.webkitRTCPeerConnection;
var IceCandidate = window.mozRTCIceCandidate || window.webkitIceCandidate;
var SessionDescription = window.mozRTCSessionDescription || window.webkitRTCSessionDescription;


var onFailSoHard = function (e) {
    console.log(e);
};

var logError = function (error) {
    console.log(error.name+ ": "+ error.message);
};

var widthRatio = 16;
var heightRatio = 9;

var resize = function () {
    var widthSelfVideo = $("#panelSelfVideo").width()*1;
    var heightSelfVideo = heightRatio/widthRatio*widthSelfVideo;
    var selfVideo = document.querySelector('#selfVideo');

    console.log("Width: "+widthSelfVideo+" Height: "+heightRatio);
    
    selfVideo.width = widthSelfVideo;
    selfVideo.height = heightSelfVideo;
};
$(window).resize(resize);

var start;

var configStun = {
  'iceServers': [
    {
      'url': 'stun:stun.l.google.com:19302'
    },
    {
        'url': 'stun:23.21.150.121'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=udp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    },
    {
      'url': 'turn:192.158.29.39:3478?transport=tcp',
      'credential': 'JZEOEt2V3Qb0y27GRntt2u2PAYA=',
      'username': '28224511:1379330808'
    }
  ]
};

var pc;

pc = new PeerConnection(configStun);


function onCreateSessionDescriptionError(error) {
trace('Failed to create session description: ' + error.toString());
}

var socket = io.connect();



var main = function () {
    console.debug("Main function - Chraz");

    var isInitiator;


    resize();
    var selfVideo = document.querySelector('#selfVideo');
    console.log(selfVideo);

    var anotherVideo = document.querySelector('#anotherVideo');
    console.log(anotherVideo);



    $("#selectorRoom").submit(function(e){
        e.preventDefault();
        var roomName = $('input[name="roomName"]').val();
        console.log(roomName);
        if( roomName != undefined &&
            roomName != null &&
            roomName != '') {
            socket.emit('create or join', roomName);
            // $('input[name="roomName"]').disabled();
        }

    });

    start = function (isCaller, sdp) {
        console.log("start!");
        
        console.log("post pc");

        pc.onicecandidate = function (e) {
            console.debug("event canidate");
            console.log(e);
            if (e.candidate) {
                console.debug("detect candidate");
                socket.emit('icecandidate', {candidate: e.candidate});
            }
        };

        pc.onaddstream = function (e) {
            anotherVideo.src = URL.createObjectURL(e.stream);
        };
        

        // pc.onnegotiationneeded = function () {
        //     pc.createOffer(localDescCreated, logError)
        // };

        function gotDescription(desc) {
            pc.setLocalDescription(desc);
            console.debug("send sdp");
        }

        if (isCaller) {
            console.debug("create offer");
            pc.createOffer(function (desc) {
                pc.setLocalDescription(desc);
                socket.emit('sdp', {'sdp': desc});
            }, logError);
        } else {
            pc.setRemoteDescription(new SessionDescription(sdp), function () {
                pc.createAnswer(function (answer) {
                    pc.setLocalDescription(new SessionDescription(answer), function () {
                        
                    }, logError);
                });
            });
        }

        console.log("shit 1!");

        navigator.getMedia(
            {
                video: true, 
                audio:true
            },
            function (stream) {
                selfVideo.src = window.URL.createObjectURL(stream);
                pc.addStream(stream);
            },
            onFailSoHard
        );
        console.log("shit 2!");
    }






    var localDescCreated  = function (desc) {
        pc.setLocalDescription(desc, function () {
            socket.emit('sdp_createAnswer', {'sdp': pc.localDescription});
        });
    };



    socket.on('sdp', function (data) {
        console.debug("sdp:: demmand");
        
        if(socket.io.engine.id != data.id){
            start(false, data.data.sdp);
            // pc.setRemoteDescription(new SessionDescription(data.data.sdp));
            
        }
    });



    socket.on('icecandidate', function (data) {
        console.log("icecandidate:: ice");
        if(socket.io.engine.id != data.id) {
            console.debug("candidate");
            pc.addIceCandidate(new IceCandidate(data.data.candidate.candidate));

        }
    });

    socket.on('full', function (room){
        console.log('Room ' + room + ' is full');
    });

    socket.on('empty', function (room){
        isInitiator = true;
        console.log('Room ' + room + ' is empty');
    });

    socket.on('join', function (room){
        console.log('Making request to join room ' + room);
        console.log('You are the initiator!');
    });

    socket.on('log', function (array){
        console.log.apply(console, array);
    });

    socket.on('hello', function (data) {
        if(socket.io.engine.id != data.id)
            console.log(data);
    });

    socket.on('call', function (data) {
        console.log(data.id);
        if(data.id != socket.io.engine.id)
            start(false);
    });


    $("#start-call").click(function (e) {
        e.preventDefault();
        start(true);
        // socket.emit('call', 'call');
    });

};




$(document).ready(main);