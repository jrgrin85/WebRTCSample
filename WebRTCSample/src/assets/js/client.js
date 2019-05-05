VideoChat = function () {
    
    
    //our username
    var name;
    var connectedUser;

    var loginPage;
    var username;
    var loginBtn;

    var callscreen;
    var callusername;
    var callBtn;
    var hangUpBtn;

    var localVideo;
    var remoteVideo

    //connecting to our signaling server
    var conn = new WebSocket('ws://localhost:9090');
    
    VideoChat.prototype.load = function() {
        loginPage = document.querySelector('#loginPage');
        username = document.querySelector('#username');
        loginBtn = document.querySelector('#loginBtn');

        callscreen = document.querySelector('#callscreen');
        callusername = document.querySelector('#callusername');
        callBtn = document.querySelector('#callBtn');

        hangUpBtn = document.querySelector('#hangUpBtn');

        localVideo = document.querySelector('#localVideo');
        remoteVideo = document.querySelector('#remoteVideo');
        callscreen.style.display = "none";
        hangUpBtn.disabled = true;
    }
    
    VideoChat.prototype.logIn = function(){
        console.log("Connected to server");
        name = username.value;
        if (name.length > 0) {
            this.send({
                type: "login",
                name: name
            });
        }
    }

    //when we got a message from a signaling server 
    conn.onmessage = function (msg) {
        console.log("Message Received: ", msg.data);

        var data = JSON.parse(msg.data);
        console.log(data.type);
        switch (data.type) {
            case "login":
                handleLogin(data.success);
                break;
            //when somebody wants to call us 
            case "offer":
                handleOffer(data.offer, data.name);
                break;
            case "answer":
                handleAnswer(data.answer);
                break;
            //when a remote peer sends an ice candidate to us 
            case "candidate":
                handleCandidate(data.candidate);
                break;
            //when a client hangs up
            case "leave":
                handleLeave();
                break;
            //when a call is rejected
            case "reject":
                handleReject();
                break;
            default:
                break;
        }
    };

    conn.onerror = function (err) {
        console.log("Got error", err);
    };

    //alias for sending JSON encoded messages 
    VideoChat.prototype.send = function(message) {
        //attach the other peer username to our messages 
        if (connectedUser) {
            message.name = connectedUser;
        }
        console.log(message);
        conn.send(JSON.stringify(message));
    };

    // Login when the user clicks the button 


    VideoChat.prototype.handleLogin = function(success) {
        if (success === false) {
            alert("This username is already being used.  Please try a different username");
        }
        else {
            loginPage.style.display = "none";
            callscreen.style.display = "block";

 
            //getting local video stream and starting a new peer connection
            navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(function (myStream) {
                stream = myStream;

                //displaying local video stream on the page 
                localVideo.srcObject = stream;

                //using Google public stun server 
                var configuration = {
                    "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
                };

                yourConn = new RTCPeerConnection(configuration);

                // setup stream listening 
                yourConn.addStream(stream);

                //when a remote user adds stream to the peer connection, we display it 
                yourConn.onaddstream = function (e) {
                    remoteVideo.srcObject = e.stream;
                };

                // Setup ice handling 
                yourConn.onicecandidate = function (event) {
                    if (event.candidate) {
                        send({
                            type: "candidate",
                            candidate: event.candidate
                        });
                    }
                };

            }).catch(function (error) {
                console.log(error);
            });

        }
    }
    
    //initiating a call 
    //callBtn.addEventListener("click", function () {
    VideoChat.prototype.callUser = function(){
        var callToUsername = callusername.value;

        if (callToUsername.length > 0) {

            connectedUser = callToUsername;
            hangUpBtn.disabled = false;
            if (yourConn === null) {
                //using Google public stun server 
                var configuration = {
                    "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
                };

                yourConn = new RTCPeerConnection(configuration);

                // setup stream listening 
                yourConn.addStream(stream);

                //when a remote user adds stream to the peer connection, we display it 
                yourConn.onaddstream = function (e) {
                    remoteVideo.srcObject = e.stream;
                };

                // Setup ice handling 
                yourConn.onicecandidate = function (event) {
                    if (event.candidate) {
                        send({
                            type: "candidate",
                            candidate: event.candidate
                        });
                    }
                };
            }
            // create an offer 
            yourConn.createOffer(function (offer) {
                send({
                    type: "offer",
                    offer: offer
                });
                yourConn.setLocalDescription(offer);
            }, function (error) {
                console.log(error);
                alert("Error when creating an offer");
            });

        }
    };

    //when somebody sends us an offer 
    VideoChat.prototype.handleOffer = function(offer, name) {
        if (confirm("User " + name + " wants to connect with you")) {
            hangUpBtn.disabled = false;
            connectedUser = name;
            if (yourConn === null) {
                //using Google public stun server 
                var configuration = {
                    "iceServers": [{ "url": "stun:stun2.1.google.com:19302" }]
                };

                yourConn = new RTCPeerConnection(configuration);

                // setup stream listening 
                yourConn.addStream(stream);

                //when a remote user adds stream to the peer connection, we display it 
                yourConn.onaddstream = function (e) {
                    remoteVideo.srcObject = e.stream;
                };

                // Setup ice handling 
                yourConn.onicecandidate = function (event) {
                    if (event.candidate) {
                        send({
                            type: "candidate",
                            candidate: event.candidate
                        });
                    }
                };
            }
            yourConn.setRemoteDescription(new RTCSessionDescription(offer));

            //create an answer to an offer 
            yourConn.createAnswer(function (answer) {
                yourConn.setLocalDescription(answer);

                send({
                    type: "answer",
                    answer: answer
                });

            }, function (error) {
                alert("Error when creating an answer");
            });
        }
        else {
            this.send({
                type: "reject",
                name: name
            });
        }

    };

    //when we got an answer from a remote user
    VideoChat.prototype.handleAnswer = function(answer) {
        yourConn.setRemoteDescription(new RTCSessionDescription(answer));
    };

    //when we got an ice candidate from a remote user 
    VideoChat.prototype.handleCandidate = function(candidate) {
        yourConn.addIceCandidate(new RTCIceCandidate(candidate));
    };

    //hang up 
    //hangUpBtn.addEventListener("click", function () {
    VideoChat.prototype.hangUp = function(){


        send({
            type: "leave"
        });

        this.handleLeave();
    };

    VideoChat.prototype.handleLeave = function() {
        console.log(connectedUser);
        connectedUser = null;
        remoteVideo.src = null;

        yourConn.close();
        yourConn.onicecandidate = null;
        yourConn.onaddstream = null;
        yourConn = null;
        hangUpBtn.disabled = true;
    };

    VideoChat.prototype.handleReject = function() {
        var callToUsername = callusername.value;
        alert("Call to " + callToUsername + " rejected");
        this.handleLeave();
    }
    
};var videoChat = new VideoChat();

function send(message){
    videoChat.send(message);
}

function handleLogin(success){
    videoChat.handleLogin(success);
}

function handleOffer(offer, name)
{
    videoChat.handleOffer(offer,name);
}

function handleAnswer(answer)
{
    videoChat.handleAnswer(answer);
}

function handleCandidate(candidate)
{
    videoChat.handleCandidate(candidate);
}

function handleLeave()
{
    videoChat.handleLeave();
}

function handleReject()
{
    videoChat.handleReject();
}

