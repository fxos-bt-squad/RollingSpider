/* global console, VirtualJoystick, RollingSpiderHelper */
'use strict';

var App = {
  isReady: false,

  rsHelper: undefined,
  joystickLeft: undefined,
  joystickRight: undefined,

  connectButton: document.getElementById('connect'),
  flyingStatusSpan: document.getElementById('flyingStatus'),
  joystickAreaDiv: document.getElementById('joystickArea'),
  leftDebugInfoElem: document.querySelector('#info > .left'),
  rightDebugInfoElem: document.querySelector('#info > .right'),

  viewStatus: document.body.className, // on-joystick-view or on-scripting-view
  joystickViewSection: document.getElementById('joystick-view'),
  scriptingViewSection: document.getElementById('scripting-view'),

  buttonIds: [
    'takeoff',
    'landing',
    'to-scripting-view',
    'to-joystick-view',
    'run-script'
  ],

  showDebugInfo: function showDebugInfo(tilt, forward, turn, up) {
    this.leftDebugInfoElem.innerHTML = 'tilt:' + tilt +
      ' <br>forward:' + forward + '<br>' +
      (this.joystickLeft.right() ? ' right':'') +
      (this.joystickLeft.up()  ? ' up'   : '') +
      (this.joystickLeft.left()  ? ' left' : '') +
      (this.joystickLeft.down()  ? ' down'   : '');

    var eRight = document.querySelector('#info > .right');
    eRight.innerHTML = 'turn:' + turn +
      ' <br>up:' + up + '<br>' +
      (this.joystickRight.right() ? ' right'  : '') +
      (this.joystickRight.up()  ? ' up'   : '') +
      (this.joystickRight.left()  ? ' left' : '') +
      (this.joystickRight.down()  ? ' down'   : '');
  },

  onJoystickTouch: function(joystick, evt) {
    switch(evt.type) {
      case 'touchstart':
        joystick.onTouch = true;
        console.log(joystick.location + ' down');
        break;
      case 'touchend':
        joystick.onTouch = false;
        console.log(joystick.location + ' up');
        break;
    }
  },

  createJoystick: function createJoystick(location) {
    var that = this;
    var joystick = new VirtualJoystick({
      container: this.joystickAreaDiv,
      strokeStyle: location === 'left' ? 'cyan' : 'orange',
      baseX: location === 'left' ?
        (document.body.clientWidth/2)*0.5 : (document.body.clientWidth/2)*1.5,
      baseY: (document.body.clientHeight/2),
      stationaryBase: true,
      limitStickTravel: true,
      stickRadius: 80,
      mouseSupport: false
    });
    joystick.location = location;

    joystick.addEventListener('touchStart',
      this.onJoystickTouch.bind(this, joystick));
    joystick.addEventListener('touchEnd',
      this.onJoystickTouch.bind(this, joystick));
    joystick.addEventListener('touchStartValidation', function(event) {
      var touch = event.changedTouches[0];
      var notValid = joystick.location === 'left' ?
        touch.pageX >= window.innerWidth/2 : touch.pageX < window.innerWidth/2;

      if(notValid) {
        return false;
      }
      return true;
    });
    return joystick;
  },

  changeConnectButtonText: function changeConnectButtonText(state) {
    var elem = this.connectButton;
    switch (state) {
      case 'connecting':
        elem.textContent = 'Connecting';
        elem.disabled = true;
        break;
      case 'discovering-services':
        elem.textContent = 'Discovering Services...';
        elem.disabled = true;
        break;
      case 'connected':
        elem.textContent = 'Disconnect';
        elem.disabled = false;
        break;
      case 'disconnect':
        elem.textContent = 'Connect';
        elem.disabled = false;
        break;
    }
  },

  handleEvent: function handleEvent(evt) {
    var targetId = evt.target.id;
    console.log('click on ' + targetId);
    switch(targetId) {
      case 'to-scripting-view':
      case 'to-joystick-view':
        this.onViewChange(evt);
        break;
      case 'takeOff':
        this.rsHelper.takeOff();
        break;
      case 'landing':
        this.rsHelper.landing();
        break;
      case 'run-script':
        break;
    }
  },

  onViewChange: function onViewChange(evt) {
    if (this.viewStatus === 'on-joystick-view') {
      document.body.className = this.viewStatus = 'on-scripting-view';
      this.joystickViewSection.classList.add('hidden');
      this.scriptingViewSection.classList.remove('hidden');
    } else {
      document.body.className = this.viewStatus = 'on-joystick-view';
      this.scriptingViewSection.classList.add('hidden');
      this.joystickViewSection.classList.remove('hidden');
    }
  },

  init: function init(clientWidth, clientHeight) {
    var that = this;
    console.log("touchscreen is " +
      (VirtualJoystick.touchScreenAvailable() ? "available" : "not available"));

    if (!this.isReady) {
      this.joystickLeft = this.createJoystick('left');
      this.joystickRight = this.createJoystick('right');
      this.rsHelper = new RollingSpiderHelper();

      window.setInterval(function() {
        var tilt = that.joystickLeft.onTouch ?
          Math.round(that.joystickLeft.deltaX()) : 0;
        var forward = that.joystickLeft.onTouch ?
          Math.round(that.joystickLeft.deltaY() * -1) : 0;
        var turn = that.joystickRight.onTouch ?
          Math.round(that.joystickRight.deltaX()) : 0;
        var up = that.joystickRight.onTouch ?
          Math.round(that.joystickRight.deltaY() * -1) : 0;

        that.showDebugInfo(tilt, forward, turn, up);
        that.rsHelper.motors(true, tilt, forward, turn, up, 0, 2);
      }, 50);

      // XXX
      ['connecting', 'discovering-services', 'connected', 'disconnect'].forEach(
          function(eventName) {
        that.rsHelper.on(eventName, function() {
          that.changeConnectButtonText(eventName);
        });
      });
      this.connectButton.addEventListener('click', function() {
        if (that.rsHelper.isAbleToConnect()) {
          that.rsHelper.connect().then(function onResolve() {
            that.changeConnectButtonText('connected');
          }, function onReject() {
            that.changeConnectButtonText('disconnect');
          });
        } else {
          that.rsHelper.disconnect().then(function onResolve() {
            that.changeConnectButtonText('disconnect');
          }, function onReject() {
            // XXX
          });
        }
      });

      this.buttonIds.forEach(function(buttonId) {
        var element = document.getElementById(buttonId);
        element.addEventListener('click', that);
      });

      /**
       * Flying statuses:
       *
       * 0: Landed
       * 1: Taking off
       * 2: Hovering
       * 3: ??
       * 4: Landing
       * 5: Emergency / Cut out
       */
      ['fsLanded', 'fsTakingOff', 'fsHovering','fsUnknown', 'fsLanding',
        'fsCutOff'].forEach(function(eventName) {
        that.rsHelper.on(eventName, function (eventName) {
          that.flyingStatusSpan.textContent = eventName;
        });
      });

      this.isReady = true;
    }
  }
};

window.addEventListener('resize', function ResizeHandler() {
  var width = document.body.clientWidth;
  var height = document.body.clientHeight;
  if (width >= height) {
    window.removeEventListener('resize', ResizeHandler);
    App.init(width, height);
  }
});
