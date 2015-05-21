'use strict';

// Utility
var removeAllMatched = function RemoveAllMatched(array, value, equality, cleanup)
{
  var index = array.length;
  if (equality) {
    while (index--) {
      if (equality(array[index], value)) {
        var item = array[index];
        array.splice(index, 1);
        if (cleanup) {
          cleanup(item);
        }
      }
    }
  } else {
    while ((index = array.indexOf(value)) >= 0) {
      var item = array[index];
      array.splice(index, 1);
      if (cleanup) {
        cleanup(item);
      }
    }
  }
}

var showElement = function ShowElement(element)
{
//  console.log("show element: [" + element + "], display: [" + element.style.display + "], visibility: [" + element.style.visibility + "]");
  element.style.display = 'initial';
  element.style.visibility = 'visible';
}

var hideElement = function HideElement(element)
{
//  console.log("hide element: [" + element + "], display: [" + element.style.display + "], visibility: [" + element.style.visibility + "]");
  element.style.display = 'none';
  element.style.visibility = 'hidden';
}

var toggleElement = function ToggleElement(element)
{
  if (element.style.display == 'none' || element.style.visibility == 'hidden') {
    showElement(element);
  } else {
    hideElement(element);
  }
}

var asSubject = function AsSubject()
{
  this._observers = {};
  
  this._getObserver = function GetObserver(event)
  {
    if (!this._observers[event]) {
      this._observers[event] = { callbacks: [] };
    }
    return this._observers[event];
  }.bind(this);
  
  this.addObserver = function AddObserver(event, context, func)
  {
    this._getObserver(event).callbacks.push({ cx: context, fn: func });
  }.bind(this);
  
  this.removeObserver = function RemoveObserver(event, context, func)
  {
    var callbacks = this._getObserver(event).callbacks;
    removeAllMatched(callbacks,
                     { cx: context, fn: func },
                     function(item, value) {
                       return item.cx == value.cx && item.fn == value.fn;
                     })
    if (callbacks.length == 0) {
      delete this._observers[event];
    }
  }.bind(this);
  
  this.notifyObserver = function NotifyObserver(event)
  {
    if (this._observers[event]) {
      var observer = this._getObserver(event);
      for (var i in observer.callbacks) {
        var callback = observer.callbacks[i];
        callback.fn.apply(callback.cx, Array.slice(arguments, 1));
      }
    }
  }.bind(this);
}

var convertArrayBufferToString = function ConvertArrayBufferToString(ab)
{
  return String.fromCharCode.apply(null, new Uint16Array(ab));
}

var convertStringToArrayBuffer = function ConvertStringToArrayBuffer(str)
{
  var ab = new ArrayBuffer(str.length * 2); // reserved 2 bytes for each char
  var buffer = new Uint16Array(ab);
  for (var i = 0; i < str.length; ++i) {
    buffer[i] = str.charCodeAt(i);
  }
  return ab;
}
