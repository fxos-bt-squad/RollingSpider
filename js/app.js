'use strict';

window.addEventListener('resize', function ResizeHandler() {
  var width = document.body.clientWidth;
  var height = document.body.clientHeight;
  if (width >= height) {
    window.removeEventListener('resize', ResizeHandler);
    init(width, height);
  }
});

function init(clientWidth, clientHeight) {
  console.log("touchscreen is " +
    (VirtualJoystick.touchScreenAvailable() ? "available" : "not available"));

  var joystickLeft  = new VirtualJoystick({
    container : document.getElementById('joystickArea'),
    strokeStyle	: 'cyan',
    // at middle of left side.
    baseX: (document.body.clientWidth/2)*0.5,
    baseY: (document.body.clientHeight/2),
    stationaryBase: true,
    limitStickTravel: true,
    stickRadius: 100,
    mouseSupport  : false
  });
  joystickLeft.addEventListener('touchStart', function(){
    console.log('L down');
  });
  joystickLeft.addEventListener('touchEnd', function(){
    console.log('L up');
  });
  joystickLeft.addEventListener('touchStartValidation', function(event){
    var touch	= event.changedTouches[0];
    if( touch.pageX >= window.innerWidth/2 ){
      return false;
    }
    return true;
  });

  var joystickRight  = new VirtualJoystick({
    container : document.getElementById('joystickArea'),
    strokeStyle	: 'orange',
    // at middle of right side.
    baseX: (document.body.clientWidth/2)*1.5,
    baseY: (document.body.clientHeight/2),
    stationaryBase: true,
    limitStickTravel: true,
    stickRadius: 100,
    mouseSupport  : false
  });
  joystickRight.addEventListener('touchStart', function(){
    console.log('R down');
  });
  joystickRight.addEventListener('touchEnd', function(){
    console.log('R up');
  });
  joystickRight.addEventListener('touchStartValidation', function(event){
    var touch	= event.changedTouches[0];
    if( touch.pageX < window.innerWidth/2 ){
      return false;
    }
    return true;
  });

  function showDebugInfo(tilt, forward, turn, up){
    var eLeft = document.querySelector('#info > .left');
    eLeft.innerHTML = 'tilt:' + tilt +
      ' <br>forward:' + forward + '<br>' +
      (joystickLeft.right() ? ' right':'') +
      (joystickLeft.up()  ? ' up'   : '') +
      (joystickLeft.left()  ? ' left' : '') +
      (joystickLeft.down()  ? ' down'   : '');

    var eRight = document.querySelector('#info > .right');
    eRight.innerHTML = 'turn:' + turn +
      ' <br>up:' + up + '<br>' +
      (joystickRight.right() ? ' right'  : '') +
      (joystickRight.up()  ? ' up'   : '') +
      (joystickRight.left()  ? ' left' : '') +
      (joystickRight.down()  ? ' down'   : '');
  }

  setInterval(function(){
    var tilt = Math.round(joystickLeft.deltaX()) * -1;
    var forward = Math.round(joystickLeft.deltaY()) * -1;
    var turn = Math.round(joystickRight.deltaX()) * -1;
    var up = Math.round(joystickRight.deltaY()) * -1;
    showDebugInfo(tilt, forward, turn, up);
    rsHelper.motors(true, tilt, forward, turn, up, 0, 2);
  }, 50);

  var rsHelper = new RollingSpiderHelper();

  var connectButton = document.getElementById('connect');
  var toggleConnectButton = function(isConnected) {
    if (isConnected) {
      connectButton.textContent = 'Disconnect';
    } else {
      connectButton.textContent = 'Connect';
    }
  };
  rsHelper.on('connect', function() {
    toggleConnectButton(true);
  });
  rsHelper.on('disconnect', function() {
    toggleConnectButton(false);
  });

  connectButton.addEventListener('click', function() {
    if (rsHelper.isAbleToConnect()) {
      rsHelper.connect().then(function onResolve() {
        toggleConnectButton(true);
      }, function onReject() {
        toggleConnectButton(false);
      });
    } else {
      rsHelper.disconnect().then(function onResolve() {
        toggleConnectButton(false);
      }, function onReject() {
        // XXX
      });
    }
  });

  var elTakeOff = document.getElementById('takeoff');
  elTakeOff.onclick = function (){
    rsHelper.takeOff();
  };

  var elLanding = document.getElementById('landing');
  elLanding.onclick = function (){
    rsHelper.landing();
  };

  var flyingStatusHandler = function (eventName){
    document.getElementById('flyingStatus').textContent = eventName;
  };

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
    'fsCutOff'].forEach(function(eventName){
    rsHelper.on(eventName, flyingStatusHandler.bind(this, eventName));
  });

};
