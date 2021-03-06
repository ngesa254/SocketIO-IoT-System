/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

/*
The Web Sockets Node.js sample application distributed within Intel® XDK IoT Edition under the IoT with Node.js Projects project creation option showcases how to use the socket.io NodeJS module to enable real time communication between clients and the development board via a web browser to toggle the state of the onboard LED.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing/updating MRAA & UPM Library on Intel IoT Platforms with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

OR
In Intel XDK IoT Edition under the Develop Tab (for Internet of Things Embedded Application)
Develop Tab
1. Connect to board via the IoT Device Drop down (Add Manual Connection or pick device in list)
2. Press the "Settings" button
3. Click the "Update libraries on board" option

Review README.md file for in-depth information about web sockets communication

*/

var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console

//var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
var GreenLED = new mraa.Gpio(5); 
GreenLED.dir(mraa.DIR_OUT); //set the gpio direction to output

var RedLED = new mraa.Gpio(6); 
RedLED.dir(mraa.DIR_OUT); //set the gpio direction to output

var BlueLED = new mraa.Gpio(7); 
BlueLED.dir(mraa.DIR_OUT); //set the gpio direction to output

var ledState = true; //Boolean to hold the state of Led

var GreenLEDState = true;
var RedLEDState = true;
var BlueLEDState = true;

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsersArray = [];
var userId;
var lastUserId = ""; 

app.get('/', function(req, res) {
    //Join all arguments together and normalize the resulting path.
    res.sendFile(path.join(__dirname + '/client', 'index.html'));
});

//Allow use of files in client folder
app.use(express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/client'));

//Socket.io Event handlers
io.on('connection', function(socket) {
    console.log("\n Add new User: u"+connectedUsersArray.length);
    if(connectedUsersArray.length > 0) {
        var element = connectedUsersArray[connectedUsersArray.length-1];
        userId = 'u' + (parseInt(element.replace("u", ""))+1);
    }
    else {
        userId = "u0";
    }
    console.log('a user connected: '+userId);
    io.emit('user connect', userId);
    connectedUsersArray.push(userId);
    console.log('Number of Users Connected ' + connectedUsersArray.length);
    console.log('User(s) Connected: ' + connectedUsersArray);
    io.emit('connected users', connectedUsersArray);
    
    // Note: In order for the original webserver application to work, the client 
    // really needed to send a 'user disconnect' message first before it can send
    // a disconnect message. And the server needed to listen for a 'disconnect' message.
    // Before, the server was not listening for a 'disconnect' message, so there was no
    // way for the server to keep track of which clients had disconnected.
    // Everytime we refreshed the client webpage, for example,
    // the server thought another client had connected. By rewriting the server's
    // 'user disconnect' function and adding a 'disconnect' function for the server,
    // I was able to fix that problem.
    
    // I modified this function
    socket.on('user disconnect', function(msg) {
        lastUserId = msg;
        io.emit('user disconnect', msg);
    });
    
    // I had to add this function
    socket.on('disconnect', function(msg) { 
        if (msg) {lastUserId = msg;}
        console.log('remove: ' + lastUserId);
        connectedUsersArray.splice(connectedUsersArray.lastIndexOf(lastUserId), 1);
        lastUserId = "";
    });
    
    socket.on('toggle led', function(msg) {
       // console.log("msg.ledId: " + msg.ledId);
        switch(msg.ledId) {
            case 1: ledState = GreenLEDState; 
                GreenLEDState = !GreenLEDState;     // invert the GreenLEDState state
                GreenLED.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
                break;
                
            case 2: ledState = RedLEDState; 
                RedLEDState = !RedLEDState;         // invert the RedLEDState state 
                RedLED.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
                break;
                
            case 3: ledState = BlueLEDState; 
                BlueLEDState = !BlueLEDState;       // invert the BlueLEDState state
                BlueLED.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
                break;
        }
        msg.value = ledState;
        io.emit('toggle led', msg);
    });
   
    /*
    // Comment this out as we don't need chat capability for now
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        console.log('message: ' + msg.value);
    });
    */
});


http.listen(3000, function(){
    console.log('Web server Active listening on *:3000');
});