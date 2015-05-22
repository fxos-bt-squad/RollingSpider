function RollingSpiderHelper() {
  this._manager = navigator.mozBluetooth;
  this.connected = false;
  this._characteristics = {};
  this._counter = 1;
}

RollingSpiderHelper.prototype = evt({

  startScan: function StartScan(){
    if(!this._adapter){
      this._adapter = this._manager.defaultAdapter;
    }
    this.fire('start-scanning');
    this._adapter.startLeScan([]).then(function onResolve(handle) {
      this.fire('scanned');
      console.log('startScan resolve [' + JSON.stringify(handle) + ']');
      this._leScanHandle = handle;
      this._leScanHandle.addEventListener('devicefound',
        this._onGattDeviceFound.bind(this));
      return Promise.resolve(handle);
    }.bind(this), function onReject(reason) {
      this.fire('start-scanning-failed', reason);
      console.log('startScan reject [' + JSON.stringify(reason) + ']');
      return Promise.reject(reason);
    }.bind(this));
  },

  stopScan: function StopScan(){
    this.fire('stop-scanning');
    this._adapter.stopLeScan(this._leScanHandle).then(function onResolve() {
      this.fire('stopped-scanning');
      this._leScanHandle = null;
      console.log('stopScan resolve');
      return Promise.resolve();
    }.bind(this), function onReject(reason) {
      this.fire('stop-scanning-failed', reason);
      console.log('stopScan reject');
      console.log(reason);
      return Promise.reject(reason);
    }.bind(this));
  },

  _onGattDeviceFound: function onGattDevceFound(evt) {
    if(evt.device.name.indexOf('RS_') === 0 && !this.connected) {
      this.fire('gatt-device-found');
      this.connected = true;
      console.log('Rolling Spider FOUND!!!!!');
      this._device = evt.device;
      this._gatt = this._device.gatt;
      this.connect();
      this.stopScan();
    }
  },

  connect: function Connect() {
    this.fire('connecting');
    this._gatt.connect().then(function onResolve() {
      this.fire('connected');
      console.log('connect resolve');
      this.discoverServices();
    }.bind(this), function onReject(reason) {
      this.fire('connecting-failed', reason);
      console.log('connect reject: ' + reason);
    }.bind(this));
  },

  takeOff: function TakeOff(){
    var characteristic =
      this._characteristics['9a66fa0b-0800-9191-11e4-012d1540cb8e'];

    // 4, (byte)mSettingsCounter, 2, 0, 1, 0
    var buffer = new ArrayBuffer(6);
    var array = new Uint8Array(buffer);
    array.set([4, this._counter++, 2, 0, 1, 0]);
    characteristic.writeValue(buffer).then(function onResolve(){
      console.log('takeoff success');
    }, function onReject(){
      console.log('takeoff failed');
    });
  },

  landing: function Landing(){
    var characteristic =
      this._characteristics['9a66fa0b-0800-9191-11e4-012d1540cb8e'];

    // 4, (byte)mSettingsCounter, 2, 0, 3, 0
    var buffer = new ArrayBuffer(6);
    var array = new Uint8Array(buffer);
    array.set([4, this._counter++, 2, 0, 3, 0]);
    characteristic.writeValue(buffer).then(function onResolve(){
      console.log('landing success');
    }, function onReject(){
      console.log('landing failed');
    });
  },

  discoverServices: function DiscoverServices() {
    this.fire('discovering-services');
    return this._gatt.discoverServices().then(function onResolve(value) {
      this._gatt.oncharacteristicchanged =
      function onCharacteristicChanged(evt) {
        var characteristic = evt.characteristic;
        console.log("The value of characteristic (uuid:",
          characteristic.uuid, ") changed to", characteristic.value);
      };

      console.log('gatt client discoverServices:' +
        'resolved with value: [' +value + ']');
      console.log('gatt client found ' + this._gatt.services.length +
        'services in total');
      var services = this._gatt.services;
      for(var i = 0; i<services.length; i++){
        var characteristics = services[i].characteristics;
        console.log('service[' + i + ']' + characteristics.length +
          'characteristics in total');
        for(var j=0; j<characteristics.length; j++){
          var characteristic = characteristics[j];
          var uuid = characteristic.uuid;
          this._characteristics[uuid] = characteristic;
          //characteristic.startNotifications();
        }
      }
      this.fire('discovered-services');
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      this.fire('discovering-services-failed', reason);
      console.log('discoverServices reject: [' + reason + ']');
      return Promise.reject(reason);
    }.bind(this));
  }
});

