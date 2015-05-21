function RollingSpiderHelper(controller) {
  this._controller = controller;
  this._initEvents();
  this._adapters = [];
}

RollingSpiderHelper.prototype = evt({
  _initEvents: function InitEvents() {
    this._controller.addObserver('adapteradded', this,
      this._onAdapterAdded);
    this._controller.addObserver('adapterremoved', this,
      this._onAdapterRemoved);
  },

  _onAdapterAdded: function OnAdapterAdded(adapter) {
    console.log(adapter);
    this._adapters.push(adapter);
  },

  _onAdapterRemoved: function OnAdapterRemoved(address) {
  },

  cleanup: function Cleanup() {
    this._controller.removeObserver('adapteradded', this,
      this._onAdapterAdded);
    this._controller.removeObserver('adapterremoved', this,
      this._onAdapterRemoved);
  },

  startScan: function StartScan(){
    this._adapters[0].startLeScan([]).then(function onResolve(handle) {
      console.log('startScan resolve [' + JSON.stringify(handle) + ']');
      this._leScanHandle = handle;
      this._leScanHandle.addEventListener('devicefound',
        this._onGattDeviceFound.bind(this));
      return Promise.resolve(handle);
    }.bind(this), function onReject(reason) {
      console.log('startScan reject [' + JSON.stringify(reason) + ']');
      return Promise.reject(reason);
    }.bind(this));
  },

  stopScan: function StopScan(){
    this._adapters[0].stopLeScan(this._leScanHandle).then(function onResolve() {
      this._leScanHandle = null;
      console.log('stopScan resolve');
      return Promise.resolve();
    }.bind(this), function onReject(reason) {
      console.log('stopScan reject');
      console.log(reason);
      return Promise.reject(reason);
    }.bind(this));
  },

  _onGattDeviceFound: function onGattDevceFound(evt){
    if(evt.device.name.indexOf('RS_') === 0){
      console.log('Rolling Spider FOUND!!!!!');
      this._device = evt.device;
      this._gatt = this._device.gatt;
      this.connect().then(function onResolve(value){
        console.log(value);
        if(value === 'connected'){
          this.stopScan();
        }
      }.bind(this), function onReject(reason){
        console.log(reason);
      }.bind(this));
    }
  },

  connect: function (){
    this._gatt.connect().then(function onResolve(value) {
      console.log("gatt client connect: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client connect: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  }
});

