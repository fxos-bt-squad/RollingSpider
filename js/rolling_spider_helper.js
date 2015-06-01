/* global StateManager, evt, console, Promise */
'use strict';

var CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';
var FA0A_UUID = '9a66fa0a-0800-9191-11e4-012d1540cb8e';
var FA0B_UUID = '9a66fa0b-0800-9191-11e4-012d1540cb8e';
var FA0C_UUID = '9a66fa0c-0800-9191-11e4-012d1540cb8e';
var FB0E_UUID = '9a66fb0e-0800-9191-11e4-012d1540cb8e';
var FB0F_UUID = '9a66fb0f-0800-9191-11e4-012d1540cb8e';

function ab2str(buf) {
  var result = '';
  var array = new Uint8Array(buf);
  for(var i = 0; i<array.length; i++){
    result += Number(array[i]) + ',';
  }
  return result;
}

function convertFloat2Bytes(floatValue){
  var buffer = new ArrayBuffer(8);
  var intView = new Uint8Array(buffer);
  var floatView = new Float64Array(buffer);
  floatView[0] = floatValue;
/*
  for(var i = 0; i < 8; i++){
    console.log(intView[i].toString(2));
  }
*/
  return intView;
}

function RollingSpiderHelper() {
  this._manager = navigator.mozBluetooth;
  this._stateManager = new StateManager(this).start();
  this._isGattConnected = false;
  this._characteristics = {};
  this._motorCounter = 1;
  this._settingsCounter = 1;
  this._emergencyCounter = 1;
  this.readyToGo = false;
}

RollingSpiderHelper.prototype = evt({

  isAbleToConnect: function() {
    return this._stateManager.isAbleToConnect();
  },

  isAbleToDisconnect: function() {
    // XXX: we should be able to disconnect when
    // state = StateManager.STATES.CONNECTING
    return this._stateManager.isConnected();
  },

  connect: function (deviceNamePrefix) {
    var prefix = deviceNamePrefix || 'RS_';
    var that = this;
    if (this._stateManager.isAbleToConnect()) {
      this.fire('connecting');
      return new Promise(function(resolve, reject) {
        that.fire('scanning-start');
        that._startScan().then(function(/* handle */) {
          that.fire('finding-device', {prefix: prefix});
          return that._findDevice(prefix);
        }).then(function(device) {
          that.fire('scanning-stop');
          device.gatt.onconnectionstatechanged =
            that._gattConnectionStateChanged.bind(that);
          that._stopScan();
          that.fire('gatt-connecting');
          return that._gatt.connect();
        }).then(function() {
          that.fire('discovering-services');
          return that._discoverServices();
        }).then(function() {
          that.fire('connected');
          resolve();
        }).catch(function(reason) {
          that.fire('connecting-failed', reason);
          reject(reason);
        });
      });
    } else {
      return Promise.reject('Unable to connect in state ' + this._stateManager.state);
    }
  },

  disconnect: function() {
    var that = this;
    if (this._stateManager.isConnected() && this._gatt) {
      return this._gatt.disconnect().then(function onResolve() {
        that.fire('disconnect');
      }, function onReject(reason) {
        console.warn(reason);
      });
    } else {
      return Promise.reject(
        'Unable to disconnect in state ' + this._stateManager.state);
    }
  },

  _gattConnectionStateChanged: function() {
    var connectionState = this._gatt.connectionState;
    switch(connectionState) {
      case 'disconnected':
        this._isGattConnected = false;
        this.fire('gatt-disconnected');
        this.fire('disconnect');
        break;
      case 'disconnecting':
        this.fire('gatt-disconnecting');
        break;
      case 'connected':
        this.fire('gatt-connected');
        this._isGattConnected = true;
        break;
      case 'connecting':
        this.fire('gatt-connecting');
        break;
    }
  },

  _findDevice: function(deviceNamePrefix) {
    var that = this;
    // XXX: we should set timeout for rejection
    return new Promise(function(resolve, reject) {
      var onGattDeviceFount = function(evt) {
        var device = evt.device;
        if(device.name.startsWith(deviceNamePrefix) && !that._isGattConnected) {
          that._device = device;
          that._gatt = device.gatt;
          resolve(evt.device);
        }
      };
      that._leScanHandle.addEventListener('devicefound', onGattDeviceFount);
    });
  },

  _startScan: function StartScan() {
    var that = this;
    if(!this._adapter){
      this._adapter = this._manager.defaultAdapter;
    }
    return this._adapter.startLeScan([]).then(function onResolve(handle) {
      that._leScanHandle = handle;
      return Promise.resolve(handle);
    }, function onReject(reason) {
      return Promise.reject(reason);
    });
  },

  _stopScan: function StopScan(){
    this._adapter.stopLeScan(this._leScanHandle).then(function onResolve() {
      this._leScanHandle = null;
      return Promise.resolve();
    }.bind(this), function onReject(reason) {
      return Promise.reject(reason);
    }.bind(this));
  },

  takeOff: function TakeOff() {
    if (this._stateManager.isConnected()) {
      var characteristic = this._characteristics[FA0B_UUID];

      // 4, (byte)mSettingsCounter, 2, 0, 1, 0
      var buffer = new ArrayBuffer(6);
      var array = new Uint8Array(buffer);
      array.set([4, this._settingsCounter++, 2, 0, 1, 0]);
      characteristic.writeValue(buffer).then(function onResolve(){
        console.log('takeoff success');
      }, function onReject(){
        console.log('takeoff failed');
      });
    }
  },

  landing: function Landing() {
    if (this._stateManager.isConnected()) {
      var characteristic = this._characteristics[FA0B_UUID];

      // 4, (byte)mSettingsCounter, 2, 0, 3, 0
      var buffer = new ArrayBuffer(6);
      var array = new Uint8Array(buffer);
      array.set([4, this._settingsCounter++, 2, 0, 3, 0]);
      characteristic.writeValue(buffer).then(function onResolve(){
        console.log('landing success');
      }, function onReject(){
        console.log('landing failed');
      });
    }
  },

  emergencyStop: function EmergencyStop(){
    var characteristic = this._characteristics[FA0C_UUID];

    // 4, (byte)mSettingsCounter, 2, 0, 4, 0
    var buffer = new ArrayBuffer(6);
    var array = new Uint8Array(buffer);
    array.set([4, this._emergencyCounter++, 2, 0, 4, 0]);
    characteristic.writeValue(buffer).then(function onResolve(){
      console.log('emergencyStop success');
    }, function onReject(){
      console.log('emergencyStop failed');
    });
  },

  _sendMotorCmd: function SendMotorCmd(on, tilt, forward, turn, up, scale){
    var characteristic = this._characteristics[FA0A_UUID];
    if(!characteristic || !this.readyToGo) return;

    var buffer = new ArrayBuffer(19);
    var array = new Uint8Array(buffer);
    array.fill(0);
    array.set([
      2,
      this._motorCounter++,
      2,
      0,
      2,
      0,
      (on ? 1 : 0),
      tilt & 0xFF,
      forward & 0xFF,
      turn & 0xFF,
      up & 0xFF,
      0, 0, 0, 0,
      0, 0, 0, 0
    ]);
    characteristic.writeValue(buffer).then(function onResolve(){
      console.log('sendMotorCmd success');
    }, function onReject(reason){
      console.log('sendMotorCmd failed: ' + reason);
    });
  },

  motors: function Motors(on, tilt, forward, turn, up, scale, steps){
    for (var i = 0; i < steps; i++) {
      this._sendMotorCmd(on, tilt, forward, turn, up, scale);
    }
    return true;
  },

  _enableNotification: function EnableNotification(characteristic){
    var success = false;
    characteristic.startNotifications().then(function onResolve(){
      console.log('enableNotification for ' +
        characteristic.uuid + ' success');
    }, function onReject(reason){
      console.log('enableNotification for ' +
        characteristic.uuid + ' failed: ' + reason);
    });
    console.log(characteristic.descriptors);
    for (var i = 0; i < characteristic.descriptors.length; i++) {
      var descriptor = characteristic.descriptors[i];
      console.log('Descriptor CCCD uuid:' + descriptor.uuid);
      console.log('Descriptor CCCD value:' + descriptor.value);
      if (descriptor.uuid === CCCD_UUID) {
        console.log('CCCD found');
        var buffer = new ArrayBuffer(2);
        var array = new Uint8Array(buffer);
        array.set([0x01, 0x00]);
        descriptor.writeValue(buffer);
        success = true;
      }
    }
    return success;
  },

  onCharacteristicChanged: function OnCharacteristicChanged(evt) {
    var characteristic = evt.characteristic;
    var value = characteristic.value;
    console.log('The value of characteristic (uuid:' +
      characteristic.uuid + ') changed to ' + ab2str(value));

    switch(characteristic.uuid){
      case FB0E_UUID:
        var eventList = ['fsLanded', 'fsTakingOff', 'fsHovering',
          'fsUnknown', 'fsLanding', 'fsCutOff'];
        var array = new Uint8Array(value);
        if(eventList[array[6]] === 'fsHovering'){
          this.readyToGo = true;
        } else {
          this.readyToGo = false;
        }
        this.fire(eventList[array[6]]);
        break;
      case FB0F_UUID:
        console.log('Battery: ' + ab2str(value));
        break;
    }
  },

  _checkChar: function (){
    var charFB0E = this._characteristics[FB0E_UUID];
    var charFB0F = this._characteristics[FB0F_UUID];
    var charFA0A = this._characteristics[FA0A_UUID];
    var charFA0B = this._characteristics[FA0B_UUID];
    var charFA0C = this._characteristics[FA0C_UUID];

    return charFB0E && charFB0F && charFA0A && charFA0B && charFA0C;
  },

  _discoverServices: function DiscoverServices() {
    var that = this;
    this._gatt.oncharacteristicchanged =
      this.onCharacteristicChanged.bind(this);

    function dumpServices(services){
      for(var i = 0; i < services.length; i++) {
        var characteristics = services[i].characteristics;
        console.log('service[' + i + ']' + characteristics.length +
          'characteristics in total');
        for(var j = 0; j < characteristics.length; j++) {
          var characteristic = characteristics[j];
          var uuid = characteristic.uuid;
          that._characteristics[uuid] = characteristic;
          console.log(uuid);
        }
      }
    }

    return new Promise(function (resolve, reject){
      function retry() {
        console.log('discover services retry...');
        setTimeout(wrapper_discoverServices, 100);
      }

      function wrapper_discoverServices(){
        that._gatt.discoverServices().then(function onResolve(){
          var services = that._gatt.services;
          dumpServices(services);

          if(that._checkChar()){
            var notificationSuccess_FB0E = that._enableNotification(
              that._characteristics[FB0E_UUID]);
            var notificationSuccess_FB0F = that._enableNotification(
              that._characteristics[FB0F_UUID]);
            if(!notificationSuccess_FB0E || !notificationSuccess_FB0F){
              retry();
            } else {
              console.log('discover services success');
              resolve();
            }
          } else {
            retry();
          }
        }, function onReject(reason){
          console.log('discoverServices reject: [' + reason + ']');
          reject();
        });
      }

      wrapper_discoverServices();
    });
  }
});

