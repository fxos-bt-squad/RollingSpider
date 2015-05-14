(function (){
  console.log("touchscreen is", VirtualJoystick.touchScreenAvailable() ? "available" : "not available");

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
    console.log('L down')
  });
  joystickLeft.addEventListener('touchEnd', function(){
    console.log('L up')
  });
  joystickLeft.addEventListener('touchStartValidation', function(event){
    var touch	= event.changedTouches[0];
    if( touch.pageX >= window.innerWidth/2 ){
      return false;
    }
    return true
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
    return true
  });
  
  function showDebugInfo(){
    var eLeft = document.querySelector('#info > .left');
    eLeft.innerHTML = 'Ldx:'+joystickLeft.deltaX() +
      ' <br>Ldy:'+joystickLeft.deltaY() + '<br>' +
      (joystickLeft.right() ? ' right':'') +
      (joystickLeft.up()  ? ' up'   : '') +
      (joystickLeft.left()  ? ' left' : '') +
      (joystickLeft.down()  ? ' down'   : '');

    var eRight = document.querySelector('#info > .right');
    eRight.innerHTML = 'Rdx:'+joystickRight.deltaX() +
        ' <br>Rdy:'+joystickRight.deltaY() + '<br>' +
        (joystickRight.right() ? ' right'  : '') +
        (joystickRight.up()  ? ' up'   : '') +
        (joystickRight.left()  ? ' left' : '') +
        (joystickRight.down()  ? ' down'   : '');
  }

  setInterval(function(){
    showDebugInfo();
  }, 1/30 * 1000);

})();
