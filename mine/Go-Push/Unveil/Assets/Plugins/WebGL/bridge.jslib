mergeInto(LibraryManager.library, {
  SendToWeb: function (jsonPtr) {
    var jsonStr = UTF8ToString(jsonPtr);
    window.dispatchEvent(new CustomEvent('unity-message', { detail: jsonStr }));
  }
});
