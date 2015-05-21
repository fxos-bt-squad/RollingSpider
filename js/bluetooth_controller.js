'use strict';

// Bluetooth Controller
function BluetoothController()
{
  this._manager = navigator.mozBluetooth;
  this._adapters = [];
  
  this._initEvents();
}

BluetoothController.prototype = {
  _initEvents: function InitEvents()
  {
    // BluetoothManager
    this._manager.addEventListener('attributechanged', this._onAttributeChanged.bind(this));
    this._manager.addEventListener('adapteradded', this._onAdapterAdded.bind(this));
    this._manager.addEventListener('adapterremoved', this._onAdapterRemoved.bind(this));
  },
  
  _onAttributeChanged: function OnAttributeChanged(evt)
  {
    for (var i in evt.attrs) {
      switch (evt.attrs[i]) {
        case 'unknown':
          console.log("manager unknown attribute changed: [" + evt.attrs[i] + "]");
          break;
        case 'defaultAdapter':
          console.log("manager defaultAdapter changed: [" + evt.attrs[i] + "]");
          // FIXME: currently there is no way to known about the right timing to retrieve a complete list of adapters
          setTimeout(function() {
            var adapters = this._manager.getAdapters();
            for (var i in adapters) {
              var evt = { adapter:adapters[i] };
              this._onAdapterAdded(evt);
            }
          }.bind(this), 1);
          break;
        default:
          console.log("manager unrecongnized attribute changed: [" + evt.attrs[i] + "]");
          break;
      }
    }
  },
  
  _onAdapterAdded: function OnAdapterAdded(evt)
  {
    var adapter = new BluetoothAdapterController(evt.adapter);
    this._adapters.push(adapter);
    console.log("adapter with address [" + adapter.address + "] is added");
    this.notifyObserver('adapteradded', adapter);
  },
  
  _onAdapterRemoved: function OnAdapterRemoved(evt)
  {
    var address = evt.address;
    removeAllMatched(this._adapters,
                     address,
                     function(adapter, address) {
                       return adapter.address == address;
                     }.bind(this));
    console.log("adapter with address [" + address + "] is removed");
    this.notifyObserver('adapterremoved', address);
  }
}

asSubject.call(BluetoothController.prototype);

// Bluetooth Adapter Controller
function BluetoothAdapterController(adapter)
{
  this._adapter = adapter;
  
  this._initEvents();
  
  this.address = this._adapter.address;
  this.state = this._adapter.state;
  this.name = this._adapter.name;
  this.discoverable = this._adapter.discoverable;
  this.discovering = this._adapter.discovering;
}

BluetoothAdapterController.prototype = {
  _initEvents: function InitEvents()
  {
    this._adapter.addEventListener('attributechanged', this._onAttributeChanged.bind(this));
    this._adapter.addEventListener('devicepaired', this._onDevicePaired.bind(this));
    this._adapter.addEventListener('deviceunpaired', this._onDeviceUnpaired.bind(this));
    this._adapter.addEventListener('pairingaborted', this._onPairingAborted.bind(this));
  },
  
  _onAttributeChanged: function OnAttributeChanged(evt)
  {
    for (var i in evt.attrs) {
      switch (evt.attrs[i]) {
        case 'unknown':
          console.log("adapter unknown attribute changed: [" + evt.attrs[i] + "]");
          break;
        case 'state':
          console.log("adapter state changed to [" + this._adapter.state + "]");
          this.state = this._adapter.state;
          this.notifyObserver('adapterstatechanged', this);
          break;
        case 'address':
          console.log("adapter address changed to [" + this._adapter.address + "]");
          this.address = this._adapter.address;
          this.notifyObserver('adapteraddresschanged', this);
          break;
        case 'name':
          console.log("adapter name changed to [" + this._adapter.name + "]");
          this.name = this._adapter.name;
          this.notifyObserver('adapternamechanged', this);
          break;
        case 'discoverable':
          console.log("adapter discoverable changed to [" + this._adapter.discoverable + "]");
          this.discoverable = this._adapter.discoverable;
          this.notifyObserver('adapterdiscoverablechanged', this);
          break;
        case 'discovering':
          console.log("adapter discovering changed to [" + this._adapter.discovering + "]");
          this.discovering = this._adapter.discovering;
          this.notifyObserver('adapterdiscoveringchanged', this);
          break;
        default:
          console.log("adapter unrecongnized attribute changed: [" + evt.attrs[i] + "]");
          break;
      }
    }
  },
  
  _onDevicePaired: function OnDevicePaired(evt)
  {
    console.log("adapter device address: [" + (evt.device ? evt.device.address : evt.address) + "] is paired");
    this.notifyObserver('devicepaired', evt.device);
  },
  
  _onDeviceUnpaired: function OnDeviceUnpaired(evt)
  {
    console.log("adapter device address: [" + (evt.device ? evt.device.address : evt.address) + "] is unpaired");
    this.notifyObserver('deviceunpaired', evt.address);
  },
  
  _onPairingAborted: function OnPairingAborted(evt)
  {
    console.log("adapter device address: [" + evt.address + "] pairing is aborted");
    this.notifyObserver('devicepairingaborted', evt.address);
  },
  
  _onGeneralDeviceFound: function OnGeneralDeviceFound(evt)
  {
    var device = new BluetoothDeviceController(evt.device);
    console.log("adapter general device with address: [" + (evt.device ? evt.device.address : evt.address) + "] is found");
    this.notifyObserver('generaldevicefound', device);
  },
  
  _onGattDeviceFound: function OnGattDeviceFound(evt)
  {
    var device = new BluetoothDeviceController(evt.device);
    var rssi = evt.rssi;
    var record = evt.scanRecord;
    console.log("adapter low energy device with address: [" + evt.device.address + "] is found");
    this.notifyObserver('ledevicefound', device, rssi, record);
  },
  
  enable: function Enable()
  {
    return this._adapter.enable().then(function onResolve(value) {
      console.log("adapter enable: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter enable: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    });
  },
  
  disable: function Disable()
  {
    return this._adapter.disable().then(function onResolve(value) {
      console.log("adapter disable: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter disable: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    });
  },
  
  setDiscoverable: function SetDiscoverable(discoverable)
  {
    return this._adapter.setDiscoverable(discoverable).then(function onResolve(value) {
      console.log("adapter set discoverable [" + discoverable + "]: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter set discoverable [" + discoverable + "]: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  startDiscovery: function StartDiscovery()
  {
    return this._adapter.startDiscovery().then(function onResolve(value) {
      console.log("adapter startDiscovery: resolved with value: " + value);
      value.addEventListener('devicefound', this._onGeneralDeviceFound.bind(this));
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter startDiscovery: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  stopDiscovery: function StopDiscovery()
  {
    return this._adapter.stopDiscovery().then(function onResolve(value) {
      console.log("adapter stopDiscovery: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter stopDiscovery: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  pair: function Pair(address)
  {
    return this._adapter.pair(address).then(function onResolve(value) {
      console.log("adapter pair: resolved with value: [", + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter pair: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  unpair: function Unpair(address)
  {
    return this._adapter.unpair(address).then(function onResolve(value) {
      console.log("adapter unpair: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter unpair: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    })
  },
  
  startLeScan: function StartLeScan(uuids)
  {
    if (!uuids) {
      uuids = [];
    }
    return this._adapter.startLeScan(uuids).then(function onResolve(value) {
      console.log("adapter startLeScan: resolved with value: [" + value + "]");
      value.addEventListener('devicefound', this._onGattDeviceFound.bind(this));
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter startLeScan: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  stopLeScan: function StopLeScan(handle)
  {
    return this._adapter.stopLeScan(handle).then(function onResolve(value) {
      console.log("adapter stopLeScan: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("adapter stopLeScan: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  }
}

asSubject.call(BluetoothAdapterController.prototype);

// Bluetooth Device Controller
function BluetoothDeviceController(device)
{
  this._device = device;
  
  this._initEvents();
  
  this.address = this._device.address;
  this.cod = this._device.cod;
  this.name = this._device.name;
  this.paired = this._device.paired;
  this.uuids = this._device.uuids;
  this.type = this._device.type;
  this.gatt = null;
  if (this._device.gatt) {
    this.gatt = new BluetoothGattClientController(this._device.gatt);
  }
}

BluetoothDeviceController.prototype = {
  _initEvents: function InitEvents()
  {
    this._device.addEventListener('attributechanged', this._onAttributeChanged.bind(this));
  },
  
  _onAttributeChanged: function OnAttributeChanged(evt)
  {
    for (var i in evt.attrs) {
      switch (evt.attrs[i]) {
        case 'unknown':
          console.log("device unknown attribute changed: [" + evt.attrs[i] + "]");
          break;
        case 'cod':
          console.log("device cod changed to [" + this._device.cod + "]");
          this.cod = this._device.cod;
          this.notifyObserver('devicecodchanged', this);
          break;
        case 'name':
          console.log("device name changed to [" + this._device.name + "]");
          this.name = this._device.name;
          this.notifyObserver('devicenamechanged', this);
          break;
        case 'paired':
          console.log("device paired changed to [" + this._device.paired + "]");
          this.paired = this._device.paired;
          this.notifyObserver('devicepairedchanged', this);
          break;
        case 'uuids':
          console.log("device uuids changed to [" + this._device.uuids + "]");
          this.uuids = this._device.uuids;
          this.notifyObserver('deviceuuidschanged', this);
          break;
        default:
          console.log("device unrecongnized attribute changed: [" + evt.attrs[i] + "]");
          break;
      }
    }
  },
  
  fetchUuids: function FetchUuids()
  {
    return this._device.fetchUuids().then(function onResolve(value) {
      console.log("device fetchUuids: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("device fetchUuids: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  }
}

asSubject.call(BluetoothDeviceController.prototype);

// Bluetooth Gatt Client Controller
function BluetoothGattClientController(gatt)
{
  this._gatt = gatt;
  
  this._initEvents();
  
  this.services = [];
  this._refreshServices();
  
  this.allServices = [];
  this.allCharacteristics = {};
  
  this.connectionState = this._gatt.connectionState;
}

BluetoothGattClientController.prototype = {
  _initEvents: function InitEvents()
  {
    this._gatt.addEventListener('characteristicchanged', this._onCharacteristicUpdated.bind(this));
    this._gatt.addEventListener('connectionstatechanged', this._onConnectionStateChanged.bind(this));
  },
  
  _onCharacteristicUpdated: function OnCharacteristicUpdated(evt)
  {
    console.log("gatt client characteristic with uuid [" + evt.characteristic.uuid + "] instanceId [" + evt.characteristic.instanceId + "] value updated: [" + evt.characteristic.value + "]");
    var characteristics = this.allCharacteristics[evt.characteristic.uuid];
    if (characteristics) {
      for (var i in characteristics) {
        if (characteristics[i].instanceId == evt.characteristic.instanceId) {
          characteristics[i].characteristic.update();
          this.notifyObserver('characteristicupdated', characteristics[i].characteristic);
          return;
        }
      }
    }
    console.log("gatt client characteristic with uuid [" + evt.characteristic.uuid + "] instanceId[" + evt.characteristic.instanceId + "] does not match any characteristic");
    this.notifyObserver('characteristicupdated', null);
  },
  
  _onConnectionStateChanged: function OnConnectionStateChanged(evt)
  {
    console.log("gatt client connection state changed: [" + this._gatt.connectionState + "]");
    this.connectionState = this._gatt.connectionState;
    if (this.connectionState != 'connected') {
      this.services = [];
    }
    this.notifyObserver('connectionstatechanged', this);
  },
  
  _refreshServices: function RefreshServices()
  {
    this.services = [];
    this.allServices = [];
    this.allCharacteristics = {};
    for (var i in this._gatt.services) {
      var service = new BluetoothGattServiceController(this._gatt.services[i], this.allCharacteristics);
      this.services.push(service);
      this.allServices.push(service);
    }
    for (var i in this.services) {
      this.services[i].refreshIncludedServices(this.allServices, this.allCharacteristics);
    }
  },
  
  connect: function Connect()
  {
    return this._gatt.connect().then(function onResolve(value) {
      console.log("gatt client connect: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client connect: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  disconnect: function Disconnect()
  {
    return this._gatt.disconnect().then(function onResolve(value) {
      console.log("gatt client disconnect: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client disconnect: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  discoverServices: function DiscoverServices()
  {
    return this._gatt.discoverServices().then(function onResolve(value) {
      console.log("gatt client discoverServices: resolved with value: [" + value + "]");
      console.log("gatt client found " + this._gatt.services.length + " services in total");
      this._refreshServices();
      console.log("gatt client refresh " + this.allServices.length + " services in total");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client discoverServices: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  readRemoveRssi: function ReadRemoveRssi()
  {
    return this._gatt.readRemoveRssi().then(function onResolve(value) {
      console.log("gatt client readRemoveRssi: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client readRemoveRssi: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  beginReliableWrite: function BeginReliableWrite()
  {
    return this._gatt.beginReliableWrite().then(function onResolve(value) {
      console.log("gatt client beginReliableWrite: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client beginReliableWrite: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  executeReliableWrite: function ExecuteReliableWrite()
  {
    return this._gatt.executeReliableWrite().then(function onResolve(value) {
      console.log("gatt client executeReliableWrite: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client executeReliableWrite: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  abortReliableWrite: function AbortReliableWrite()
  {
    return this._gatt.abortReliableWrite().then(function onResolve(value) {
      console.log("gatt client abortReliableWrite: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt client abortReliableWrite: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  }
}

asSubject.call(BluetoothGattClientController.prototype);

// Bluetooth Gatt Service Controller
function BluetoothGattServiceController(service, characteristics)
{
  this._service = service;
  
  this._initEvents();
  
  this.characteristics = [];
  for (var i in this._service.characteristics) {
    this.characteristics.push(new BluetoothGattCharacteristicController(this._service.characteristics[i], this, characteristics));
  }
  
  this.includedServices = []; // will be filled in refreshIncludedServices()
  
  this.isPrimary = this._service.isPrimary;
  this.uuid = this._service.uuid;
  this.instanceId = this._service.instanceId;
}

BluetoothGattServiceController.prototype = {
  _initEvents: function InitEvents()
  {
    
  },
  
  refreshIncludedServices: function RefreshIncludedServices(pool)
  {
    var service;
    this.includedServices = [];
    for (var i in this._service.includedServices) {
      service = null;
      for (var j in pool) {
        if (this._service.includedServices[i].uuid == pool[j].uuid) {
          service = pool[j];
          break;
        }
      }
      if (service) {
        this.includedServices.push(service);
      } else {
        service = new BluetoothGattServiceController(this._service.includedServices[i]);
        this.includedServices.push(service);
        pool.push(service);
      }
    }
  },
  
  addCharacteristic: function AddCharacteristic(uuid, permissions, properties)
  {
    return this._service.addCharacteristic(uuid, permissions, properties).then(function onResolve(value) {
      console.log("gatt service addCharacteristic: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt service addCharacteristic: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  addIncludedService: function addIncludedService(service)
  {
    return this._service.addIncludedService(service).then(function onResolve(value) {
      console.log("gatt service addIncludedService: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt service addIncludedService: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  }
}

asSubject.call(BluetoothGattServiceController.prototype);

// Bluetooth Gatt Characteristic Controller
function BluetoothGattCharacteristicController(characteristic, service, characteristics)
{
  this._characteristic = characteristic;
  this._service = service;
  
  if (characteristics[this._characteristic.uuid]) {
    characteristics[this._characteristic.uuid].push({instanceId: this._characteristic.instanceId, characteristic: this});
  } else {
    characteristics[this._characteristic.uuid] = [{instanceId: this._characteristic.instanceId, characteristic: this}];
  }
  
  this._initEvents();
  
  this.service = this._service;
  this.descriptors = [];
  for (var i in this._characteristic.descriptors) {
    this.descriptors.push(new BluetoothGattDescriptorController(this._characteristic.descriptors[i], this));
  }
  this.uuid = this._characteristic.uuid;
  this.instanceId = this._characteristic.instanceId;
  this.value = this._characteristic.value;
  this.permissions = this._characteristic.permissions;
  this.properties = this._characteristic.properties;
  this.writeType = this._characteristic.writeType;
}

BluetoothGattCharacteristicController.prototype = {
  _initEvents: function InitEvents()
  {
    
  },
  
  readValue: function ReadValue()
  {
    return this._characteristic.readValue().then(function onResolve(value) {
      console.log("gatt characteristic readValue: resolved with value: [" + value + "]");
      this.value = value;
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt characteristic readValue: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  writeValue: function WriteValue(value)
  {
    return this._characteristic.writeValue(value).then(function onResolve(value) {
      console.log("gatt characteristic writeValue: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt characteristic writeValue: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  startNotifications: function StartNotifications()
  {
    return this._characteristic.startNotifications().then(function onResolve(value) {
      console.log("gatt characteristic startNotifications: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt characteristic startNotifications: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  stopNotifications: function StopNotifications()
  {
    return this._characteristic.stopNotifications().then(function onResolve(value) {
      console.log("gatt characteristic stopNotifications: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt characteristic stopNotifications: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  addDescriptor: function AddDescriptor(uuid, permissions)
  {
    return this._characteristic.addDescriptor().then(function onResolve(value) {
      console.log("gatt characteristic addDescriptor: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt characteristic beginReliableWrite: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  update: function Update()
  {
    this.value = this._characteristic.value;
  }
}

asSubject.call(BluetoothGattCharacteristicController.prototype);

// Bluetooth Gatt Descriptor Controller
function BluetoothGattDescriptorController(descriptor, characteristic)
{
  this._descriptor = descriptor;
  this._characteristic = characteristic;
  
  this._initEvents();
  
  this.characteristic = this._characteristic;
  this.uuid = this._descriptor.uuid;
  this.value = this._descriptor.value;
  this.permissions = this._descriptor.permissions;
}

BluetoothGattDescriptorController.prototype = {
  _initEvents: function InitEvents()
  {
    
  },
  
  readValue: function ReadValue()
  {
    return this._descriptor.readValue().then(function onResolve(value) {
      console.log("gatt descriptor readValue: resolved with value: [" + value + "]");
      this.value = value;
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt descriptor readValue: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  },
  
  writeValue: function WriteValue(value)
  {
    return this._descriptor.writeValue(value).then(function onResolve(value) {
      console.log("gatt descriptor writeValue: resolved with value: [" + value + "]");
      return Promise.resolve(value);
    }.bind(this), function onReject(reason) {
      console.log("gatt descriptor writeValue: rejected with this reason: [" + reason + "]");
      return Promise.reject(reason);
    }.bind(this));
  }
}

asSubject.call(BluetoothGattDescriptorController.prototype);
