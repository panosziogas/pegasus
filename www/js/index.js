/* jshint quotmark: false, unused: vars, browser: true */
/* global cordova, console, $, bluetoothSerial, _, refreshButton, deviceList, previewColor, red, green, blue, disconnectButton, connectionScreen, colorScreen, rgbText, messageDiv */
'use strict';

var app = {
    initialize: function() {
        this.bind();                    
    },
    bind: function() {
        document.addEventListener('deviceready', this.deviceready, false);   
        // throttle changes
         var throttledOnColorChange = _.throttle(app.onColorChange, 50);
        $('#pwmRangeSlider').on('change', throttledOnColorChange); 
        //$('#settings').on('click', app.list);               
    },       
    deviceready: function() {
       
        // wire buttons to functions       
        deviceList.ontouchstart = app.connect; // assume not scrolling
        refreshButton.ontouchstart = app.list;
        //disconnectButton.ontouchstart = app.disconnect;  
        console.log("Device ready with id");
       
    },
    timer: function(){
        console.log("Timer");
    },
    list: function(event) {
        deviceList.firstChild.innerHTML = "Discovering...";
        app.setStatus("Looking for Bluetooth Devices...");    
        //app.bltoothStatus("Looking for Bluetooth Devices...");    
        bluetoothSerial.list(app.ondevicelist, app.generateFailureFunction("List Failed"));
    },
    connect: function (e) {        
        //app.bltoothStatus("Connecting...");
        var device = e.target.getAttribute('deviceId');
        app.setStatus("Requesting connection to " + device);
        console.log("Requesting connection to " + device);
        bluetoothSerial.connect(device, app.onconnect(device), app.ondisconnect);        
    },
    disconnect: function(event) {
        if (event) {
            event.preventDefault();
        }
        app.setStatus("Disconnecting...");
        bluetoothSerial.disconnect(app.ondisconnect);
    },
    onconnect: function(device) {  
        app.setStatus("Connected to "+device);
        //app.timeoutId = setTimeout(function() { blstatusDiv.innerText = "Connected to "+device; }, 4000);
        //app.bltoothStatus("Connecting to "+device);
    },
    ondisconnect: function() {        
         //app.bltoothStatus("Disconnected.");
    },
    onColorChange: function (evt) {        
        var c = app.getColor();
        rgbText.innerText = 'PWM Value: '+c;
        //previewColor.style.backgroundColor = "rgb(" + c + ")";
         console.log("Device color= "+c);
        app.sendToArduino(c);
    },
    getColor: function () {
        var color = [];
        color.push(pwmRangeSlider.value);
        //color.push(green.value);
        //color.push(blue.value);
        return color.join('');
    },
    sendToArduino: function(c) {
        bluetoothSerial.write(c);
    },
    timeoutId: 0,
    setStatus: function(status) {
        if (app.timeoutId) {
            clearTimeout(app.timeoutId);
        }
        messageDiv.innerText = status;
        app.timeoutId = setTimeout(function() { messageDiv.innerText = ""; }, 4000);
    },
//     bltoothStatus: function(blstatus){
//        blstatusDiv.innerText = blstatus;
//    },
    ondevicelist: function(devices) {
        var listItem, deviceId;

        // remove existing devices
        deviceList.innerHTML = "";
        app.setStatus("");
        
        devices.forEach(function(device) {
            listItem = document.createElement('li');
            listItem.className = "list-group-item";
            if (device.hasOwnProperty("uuid")) { // TODO https://github.com/don/BluetoothSerial/issues/5
                deviceId = device.uuid;
            } else if (device.hasOwnProperty("address")) {
                deviceId = device.address;
            } else {
                deviceId = "ERROR " + JSON.stringify(device);
            }
            listItem.setAttribute('deviceId', device.address);            
            listItem.innerHTML = device.name + "</br><i>" +"<span class='badge'>"+deviceId+"</span>" + "</i>";
            deviceList.appendChild(listItem);
            console.log("listItem");
        });

        if (devices.length === 0) {
            
            if (cordova.platformId === "ios") { // BLE
                app.setStatus("No Bluetooth Peripherals Discovered.");
            } else { // Android
                app.setStatus("Please Pair a Bluetooth Device.");
            }

        } else {
            app.setStatus("Found " + devices.length + " device" + (devices.length === 1 ? "." : "s."));
        }
    },
    generateFailureFunction: function(message) {
        var func = function(reason) {
            var details = "";
            if (reason) {
                details += ": " + JSON.stringify(reason);
            }
            app.setStatus(message + details);
            //app.bltoothStatus(message + details);
        };
        return func;
    }
};