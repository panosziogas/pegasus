/* jshint quotmark: false, unused: vars, browser: true */
/* global cordova, console, $, bluetoothSerial, _, refreshButton, deviceList, previewColor, red, green, blue, disconnectButton, connectionScreen, colorScreen, rgbText, messageDiv */
'use strict';

var flatBoxBar,dewHeater1Bar,dewHeater2Bar;
var temp, hum, dp, voltage, current, power;
var temperatureLcd,humidityLcd,dewLcd,voltageLcd,currLcd,powLcd;



var app = {
    initialize: function() {
        this.bind();
        //charts.sysout();        
        // charts.test();
        //charts.radialTemp();   
        flatBoxCtrl.initializeFlatBoxBar();
        dewHeatersCtrl.initializeDewHeatersBar();
        lcdScreens.tempLcd();
        lcdScreens.humLcd();
        lcdScreens.dewPointLcd();
        lcdScreens.voltLcd();
        lcdScreens.currentLcd();
        lcdScreens.powerLcd();
        BoxKite.ToggleableButton.init();
    },
    bind: function() {
        document.addEventListener('deviceready', this.deviceready, false);
        // throttle changes
        var throttledOnColorChange = _.throttle(flatBoxCtrl.onFlatBoxPwmChange, 50);
        $('#flatBoxSlider').on('change', throttledOnColorChange);

        var throttledOnDew1Change = _.throttle(dewHeatersCtrl.dewHeater1OnChange, 50);
        $('#dewHeater1Slider').on('change', throttledOnDew1Change);

        var throttledOnDew2Change = _.throttle(dewHeatersCtrl.dewHeater2OnChange, 50);
        $('#dewHeater2Slider').on('change', throttledOnDew2Change);

        var brightNessOnChange = _.throttle(screenBrightness.dimLcd, 50);
        $('#dimDisplaySlider').on('change', brightNessOnChange);
        //$('#settings').on('click', app.list);          
    },
    deviceready: function() {
        deviceList.ontouchstart = blueToothCtrl.connect; // assume not scrolling
        refreshButton.ontouchstart = blueToothCtrl.list;
        refreshGeoButton.ontouchstart = geo.refreshGeo;
        heatersOff.ontouchstart = dewHeatersCtrl.dewHeatersOff;
        heatersFull.ontouchstart = dewHeatersCtrl.dewHeatersMax;
        mountToggle.ontouchstart = powerToggles.mountToggle;
        navigator.geolocation.getCurrentPosition(geo.geoOnSuccess, geo.geoOnFail);
        saveLabels.ontouchstart = fileHandler.getLabelValueAndSave;
        fileHandler.getLabesOnStart();
    },

    timeoutId: 0,
    setStatus: function(status) {
        if (app.timeoutId) {
            clearTimeout(app.timeoutId);
        }
        messageDiv.innerText = status;
        app.timeoutId = setTimeout(function() {
            messageDiv.innerText = "";
        }, 4000);
    }
};

var blueToothCtrl = {
    list: function(event) {
        blueToothCtrl.btStatus("Looking for Bluetooth Devices...");
        bluetoothSerial.list(blueToothCtrl.ondevicelist, blueToothCtrl.generateFailureFunction("List Failed"));
    },
    connect: function(e) {
        var device = e.target.getAttribute('deviceId');
        blueToothCtrl.btStatus("Requesting connection to " + device);
        bluetoothSerial.connect(device, blueToothCtrl.onconnect(device), blueToothCtrl.ondisconnect);
    },
    disconnect: function(event) {
        //        if (event) {
        //            event.preventDefault();
        //        }
        blueToothCtrl.btStatus("Disconnecting...");
        console.log(event);
        bluetoothSerial.disconnect(blueToothCtrl.ondisconnect, false);
    },
    onconnect: function(device) {
        var listItem;
        deviceList.innerHTML = "";
        listItem = document.createElement('li');
        listItem.className = "list-group-item";
        listItem.innerHTML = "<font color='black'>Connected:</font>" + "<span class='badge'>" + device + "</span>" + "</i>";
        deviceList.appendChild(listItem);
        blueToothCtrl.btStatus("Connected to " + device);
        console.log("Connected to " + device);
        setInterval(function() {
            getBtData();
        }, 5000);
    },
    ondisconnect: function() {
        var listItem;
        deviceList.innerHTML = "";
        listItem = document.createElement('li');
        listItem.className = "list-group-item";
        listItem.innerHTML = "<font color='black'>Disconnected</font></i>";
        deviceList.appendChild(listItem);
        blueToothCtrl.btStatus("Disconnected");
    },
    ondevicelist: function(devices) {
        var listItem, deviceId;
        deviceList.innerHTML = "";
        blueToothCtrl.btStatus("");

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
            listItem.innerHTML = "<font color='black'>" + device.name + "</font></br><i>" + "<span class='badge'>" + deviceId + "</span>" + "</i>";
            deviceList.appendChild(listItem);
        });

        if (devices.length === 0) {

            if (cordova.platformId === "ios") { // BLE                
                blueToothCtrl.btStatus("No Bluetooth Peripherals Discovered.");
            } else { // Android               
                blueToothCtrl.btStatus("Please Pair a Bluetooth Device.");
            }

        } else {
            blueToothCtrl.btStatus("Found " + devices.length + " device" + (devices.length === 1 ? "." : "s."));
        }
    },
    generateFailureFunction: function(message) {
        var func = function(reason) {
            var details = "";
            if (reason) {
                details += ": " + JSON.stringify(reason);
            }
            blueToothCtrl.btStatus(message + details);
        };
        return func;
    },
    sendToPowerBox: function(c) {
        bluetoothSerial.write(c);
    },
    timeoutId: 0,
    btStatus: function(status) {
        if (blueToothCtrl.timeoutId) {
            clearTimeout(blueToothCtrl.timeoutId);
        }
        btMessage.innerText = status;
        blueToothCtrl.timeoutId = setTimeout(function() {
            btMessage.innerText = "";
        }, 4000);
    },
    btReadSuccess: function(data) {
        console.log(data);
        if (data) {
            var sensors = data.split(":");
            voltage = sensors[1];
            current = sensors[2];
            power = sensors[3];
            hum = sensors[4];
            temp = sensors[5];
            dp = sensors[6];
            setLcdValue(temperatureLcd, temp);
            setLcdValue(humidityLcd, hum);
            setLcdValue(dewLcd, dp);
            setLcdValue(voltageLcd, voltage);
            setLcdValue(currLcd, current);
            setLcdValue(powLcd, power);
            var outPuts = sensors[7];
            console.log("Out1:" + outPuts[0]);
            console.log("Out2:" + outPuts[1]);
            console.log("Out3:" + outPuts[2]);
            console.log("Out4:" + outPuts[3]);
        }
    },
    btReadFail: function() {
        console.log("bt read failed");
    }
};

function getBtData() {
    blueToothCtrl.sendToPowerBox("A\n");
    bluetoothSerial.read(blueToothCtrl.btReadSuccess, blueToothCtrl.btReadFail);
}

var lcdScreens = {
    tempLcd: function() {
        var sections = [steelseries.Section(0, 70, 'rgba(51, 122, 183, 1.0)'),
            steelseries.Section(70, 95, 'rgba(255, 255, 0, 1.0)'),
            steelseries.Section(95, 100, 'rgba(0, 255, 0, 1.0)')
        ];

        temperatureLcd = new steelseries.DisplaySingle('canvasSingle1', {
            width: 80,
            height: 50,
            section: sections,
            lcdDecimals: 1
        });
        temperatureLcd.setLcdColor(steelseries.LcdColor.SECTIONS);
    },
    humLcd: function() {
        var sections = [steelseries.Section(0, 70, 'rgba(51, 122, 183, 1.0)'),
            steelseries.Section(70, 95, 'rgba(255, 255, 0, 1.0)'),
            steelseries.Section(95, 100, 'rgba(0, 255, 0, 1.0)')
        ];

        humidityLcd = new steelseries.DisplaySingle('canvasSingle2', {
            width: 80,
            height: 50,
            section: sections,
            lcdDecimals: 1
        });
        humidityLcd.setLcdColor(steelseries.LcdColor.SECTIONS);

    },
    dewPointLcd: function() {
        var sections = [steelseries.Section(0, 70, 'rgba(51, 122, 183, 1.0)'),
            steelseries.Section(70, 95, 'rgba(255, 255, 0, 1.0)'),
            steelseries.Section(95, 100, 'rgba(0, 255, 0, 1.0)')
        ];

        dewLcd = new steelseries.DisplaySingle('canvasSingle3', {
            width: 80,
            height: 50,
            section: sections,
            lcdDecimals: 1
        });
        dewLcd.setLcdColor(steelseries.LcdColor.SECTIONS);
    },
    voltLcd: function() {
        var sections = [steelseries.Section(0, 70, 'rgba(51, 122, 183, 1.0)'),
            steelseries.Section(70, 95, 'rgba(255, 255, 0, 1.0)'),
            steelseries.Section(95, 100, 'rgba(0, 255, 0, 1.0)')
        ];

        voltageLcd = new steelseries.DisplaySingle('canvasSingle4', {
            width: 80,
            height: 50,
            section: sections,
            lcdDecimals: 1
        });
        voltageLcd.setLcdColor(steelseries.LcdColor.SECTIONS);
    },
    currentLcd: function() {
        var sections = [steelseries.Section(0, 70, 'rgba(51, 122, 183, 1.0)'),
            steelseries.Section(70, 95, 'rgba(255, 255, 0, 1.0)'),
            steelseries.Section(95, 100, 'rgba(0, 255, 0, 1.0)')
        ];

        currLcd = new steelseries.DisplaySingle('canvasSingle5', {
            width: 80,
            height: 50,
            section: sections,
            lcdDecimals: 1
        });
        currLcd.setLcdColor(steelseries.LcdColor.SECTIONS);
    },
    powerLcd: function() {
        var sections = [steelseries.Section(0, 70, 'rgba(51, 122, 183, 1.0)'),
            steelseries.Section(70, 95, 'rgba(255, 255, 0, 1.0)'),
            steelseries.Section(95, 100, 'rgba(0, 255, 0, 1.0)')
        ];

        powLcd = new steelseries.DisplaySingle('canvasSingle6', {
            width: 80,
            height: 50,
            section: sections,
            lcdDecimals: 1
        });
        powLcd.setLcdColor(steelseries.LcdColor.SECTIONS);
    }
};


function setLcdValue(gauge, range) {
    gauge.setValue(Number(range));
}

var flatBoxCtrl = {
    initializeFlatBoxBar: function() {
        flatBoxBar = new ProgressBar("my-progressbar", {
            'width': '100%',
            'height': '15px'
        });
    },
    onFlatBoxPwmChange: function(evt) {
        var c = flatBoxCtrl.getColor();
        var pwm = c / 2.55;
        var roundPwm = Math.round(pwm);
        rgbText.innerText = 'Duty Cycle: ' + roundPwm + "%";
        //charts.linearAddValue(pwm);
        flatBoxBar.setPercent(roundPwm);
        blueToothCtrl.sendToPowerBox(c);
    },
    getColor: function() {
        var color = [];
        color.push(flatBoxSlider.value);
        return color.join('');
    },
};

var dewHeatersCtrl = {
    initializeDewHeatersBar: function() {
        dewHeater1Bar = new ProgressBar("dewHeater1SliderBar", {
            'width': '100%',
            'height': '15px'
        });
        dewHeater2Bar = new ProgressBar("dewHeater2SliderBar", {
            'width': '100%',
            'height': '15px'
        });
    },

    dewHeater1OnChange: function(evt) {
        var dewValue1 = dewHeater1Slider.value;
        var dew1Pwm = dewValue1 / 2.55;
        var roundPwm = Math.round(dew1Pwm);
        dewHeater1Bar.setPercent(roundPwm);
        dewHeater1Text.innerText = 'Duty Cycle: ' + roundPwm + "%";
        blueToothCtrl.sendToPowerBox("L:" + dewValue1 + "\n");
    },
    dewHeater2OnChange: function(evt) {
        var dewValue2 = dewHeater2Slider.value;
        var dew2Pwm = dewValue2 / 2.55;
        var roundPwm = Math.round(dew2Pwm);
        dewHeater2Bar.setPercent(roundPwm);
        dewHeater2Text.innerText = 'Duty Cycle: ' + roundPwm + "%";
        blueToothCtrl.sendToPowerBox("M:" + dewValue2 + "\n");
    },
    dewHeatersOff: function() {
        dewHeater1Bar.setPercent(0);
        dewHeater1Text.innerText = 'PWM Value: ' + 0 + "%";
        dewHeater2Bar.setPercent(0);
        dewHeater2Text.innerText = 'PWM Value: ' + 0 + "%";
        var dewHeater1Value = document.getElementById("dewHeater1Slider");
        var dewHeater2Value = document.getElementById("dewHeater2Slider");
        dewHeater1Value.value = 0;
        dewHeater2Value.value = 0;
        blueToothCtrl.sendToPowerBox("L:0\n");
        blueToothCtrl.sendToPowerBox("M:0\n");
    },
    dewHeatersMax: function() {
        dewHeater1Bar.setPercent(100);
        dewHeater1Text.innerText = 'PWM Value: ' + 100 + "%";
        dewHeater2Bar.setPercent(100);
        dewHeater2Text.innerText = 'PWM Value: ' + 100 + "%";
        var dewHeater1Value = document.getElementById("dewHeater1Slider");
        var dewHeater2Value = document.getElementById("dewHeater2Slider");
        dewHeater1Value.value = 255;
        dewHeater2Value.value = 255;
        blueToothCtrl.sendToPowerBox("L:255\n");
        blueToothCtrl.sendToPowerBox("M:255\n");
    },
    dewHeatersAuto: function() {
        var checked = document.getElementById("dewAuto").checked;
        if (checked === true) {
            console.log("Value is true");
        } else {
            console.log("Value is false");
        }
    }
};

var geo = {
    geoOnSuccess: function(position) {
        console.log("finding cordinates...");
        var longitude = position.coords.longitude;
        var latitude = position.coords.latitude;


        var element = document.getElementById('geolocation');
        element.innerHTML = 'Latitude: ' + latitude + ' <br>' + 'Longitude: ' + longitude;

        getWeather(latitude, longitude);

        var latLong = new google.maps.LatLng(latitude, longitude);
        var mapOptions = {
            center: latLong,
            zoom: 13,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };
        var map = new google.maps.Map(document.getElementById("map"), mapOptions);
        var marker = new google.maps.Marker({
            position: latLong,
            map: map,
            title: 'my location'
        });
    },
    geoOnFail: function(fail) {
        var element = document.getElementById('geolocation');
        element.innerHTML = 'Fail: ' + fail.message + '<br />'
    },
    refreshGeo: function(event) {
        console.log("refresh cordinates...");
        navigator.geolocation.getCurrentPosition(geo.geoOnSuccess, geo.geoOnFail);
    }
};

var powerToggles = {
    mountToggle: function() {
        var checked = document.getElementById("mountToggle").checked;
        if (checked === true) {
            console.log("Mount is true");
        } else {
            console.log("Mount is false");
        }
    }
};

var screenBrightness = {
    dimLcd: function() {
        var VolumeControl = cordova.plugins.brightness;
        var dimValue = dimDisplaySlider.value;
        VolumeControl.setBrightness(dimValue, screenBrightness.dimOnSuccess, screenBrightness.dimOnFail);
    },
    dimOnSuccess: function() {
        console.log("Dim succeed");
    },
    dimOnFail: function() {
        console.log("Dim failed");
    },
    lcdOn: function() {
        var VolumeControl = cordova.plugins.brightness;
        VolumeControl.setBrightness(0, screenBrightness.dimOnSuccess, screenBrightness.dimOnFail);
        var checked = document.getElementById("screenOn").checked;
        if (checked === true) {
            VolumeControl.setKeepScreenOn(true);
            console.log("LCD ON");
        } else {
            VolumeControl.setKeepScreenOn(false);
            console.log("LCD OFF");
        }
    }
};


var fileHandler = {
    getLabelValueAndSave: function() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileHandler.getFileSystemForWrite, fileHandler.getFileSystemError());
    },
    getLabesOnStart: function() {
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, fileHandler.getFileSystemForRead, fileHandler.getFileSystemError());
    },
    getFileSystemForWrite: function(fileSystem) {
        console.log("Got file system for write");
        fileSystem.root.getFile("customLabels.txt", {
            create: true,
            exclusive: false
        }, fileHandler.getFileEntryForWrite, fileHandler.getFileSystemError);
    },
    getFileSystemForRead: function(fileSystem) {
        console.log("Got file system for read");
        fileSystem.root.getFile("customLabels.txt", {
            create: true,
            exclusive: false
        }, fileHandler.getFileEntryForRead, fileHandler.getFileSystemError);
    },
    getFileSystemError: function(error) {
        console.log("Error getting file system");
    },
    getFileEntryForWrite: function(fileEntry) {
        fileEntry.createWriter(fileHandler.writeFile, fileHandler.getFileSystemError);
    },
    getFileEntryForRead: function(fileEntry) {
        fileHandler.readFile(fileEntry);
    },
    writeFile: function(writer) {
        console.log("Writing in File");
        var outuput1 = document.getElementById("output1").value;
        var outuput2 = document.getElementById("output2").value;
        var outuput3 = document.getElementById("output3").value;
        var outuput4 = document.getElementById("output4").value;
        var outPutAll = outuput1 + ";" + outuput2 + ";" + outuput3 + ";" + outuput4;
        console.log(outPutAll);
        writer.write(outPutAll);
        fileHandler.getLabesOnStart();
    },
    readFile: function(fileEntry) {
        console.log("Reading from File");
        fileEntry.file(function(file) {
            var reader = new FileReader();
            reader.onloadend = function() {
                var labelsArray = this.result.split(";");
                var outuput1 = labelsArray[0];
                var outuput2 = labelsArray[1];
                var outuput3 = labelsArray[2];
                var outuput4 = labelsArray[3];
                document.getElementById("label1").innerHTML = outuput1;
                document.getElementById("label2").innerHTML = outuput2;
                document.getElementById("label3").innerHTML = outuput3;
                document.getElementById("label4").innerHTML = outuput4;
                document.getElementById("output1").value = outuput1;
                document.getElementById("output2").value = outuput2;
                document.getElementById("output3").value = outuput3;
                document.getElementById("output4").value = outuput4;
            };
            reader.readAsText(file);
        }, fileHandler.getFileSystemError());
    }
};

function getWeather(latitude, longitude) {
    var OpenWeatherAppKey = "9d265e6d8e3b6619e15feba5537bbd69";
    var queryString = 'http://api.openweathermap.org/data/2.5/weather?lat=' + latitude + '&lon=' + longitude + '&appid=' +
        OpenWeatherAppKey + '&units=metric';
    console.log(queryString);
    $.getJSON(queryString, function(results) {
        if (results.weather.length) {
            $.getJSON(queryString, function(results) {
                if (results.weather.length) {
                    $('#weather_city_description').text("City: " + results.name);
                    $('#weather_temp').text("Temperature: " + results.main.temp + " °C");
                    $('#weather_wind').text("Wind: " + results.wind.speed + "km/h");
                    $('#weather_humidity').text("Humidity: " + results.main.humidity + " %");
                    $('#weather_visibility').text("Visibility: " + results.weather[0].main);
                    $('#weather_pressure').text("Pressure: " + results.main.pressure + " mB");
                    var sunriseDate = new Date(results.sys.sunrise);
                    $('#weather_sunrise').text("Sunrise: " + sunriseDate.toLocaleTimeString());
                    var sunsetDate = new Date(results.sys.sunset);
                    $('#weather_sunset').text("Sunset: " + sunsetDate.toLocaleTimeString());
                }
            });
        }
    }).fail(function() {
        console.log("error getting location");
    });
}

function onWeatherError(error) {
    console.log('code: ' + error.code + '\n' +
        'message: ' + error.message + '\n');
}