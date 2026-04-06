mergeInto(LibraryManager.library, {

  // ─── Outbound: Unity → JS ──────────────────────────────────────

  SendToWeb: function (jsonPtr) {
    var jsonStr = UTF8ToString(jsonPtr);
    window.dispatchEvent(new CustomEvent('unity-message', { detail: jsonStr }));
  },

  // ─── IndexedDB Telemetry Storage ───────────────────────────────

  TelemetryStore_Init: function () {
    if (window._unveilDB) return;
    var request = indexedDB.open('UnveilTelemetry', 1);
    request.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('events')) {
        db.createObjectStore('events', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onsuccess = function (e) {
      window._unveilDB = e.target.result;
      console.log('[bridge] IndexedDB initialized');
    };
    request.onerror = function (e) {
      console.warn('[bridge] IndexedDB init failed:', e.target.error);
      window._unveilDB = null;
    };
  },

  TelemetryStore_Write: function (jsonPtr) {
    var jsonStr = UTF8ToString(jsonPtr);
    if (!window._unveilDB) {
      console.warn('[bridge] IndexedDB not ready, dropping event');
      return;
    }
    try {
      var data = JSON.parse(jsonStr);
      data.ts = Date.now();
      data.synced = false;
      var tx = window._unveilDB.transaction('events', 'readwrite');
      tx.objectStore('events').add(data);
    } catch (err) {
      console.warn('[bridge] TelemetryStore_Write error:', err);
    }
  },

  TelemetryStore_GetPendingCount: function () {
    if (!window._unveilDB) return 0;
    return new Promise(function (resolve) {
      var tx = window._unveilDB.transaction('events', 'readonly');
      var store = tx.objectStore('events');
      var count = 0;
      store.openCursor().onsuccess = function (e) {
        var cursor = e.target.result;
        if (cursor) {
          if (!cursor.value.synced) count++;
          cursor.continue();
        } else {
          resolve(count);
        }
      };
    });
  },

  TelemetryStore_Sync: function (endpointPtr, apiKeyPtr) {
    var endpoint = UTF8ToString(endpointPtr);
    var apiKey = UTF8ToString(apiKeyPtr);
    if (!window._unveilDB) {
      console.warn('[bridge] IndexedDB not ready, cannot sync');
      return;
    }

    var tx = window._unveilDB.transaction('events', 'readonly');
    var store = tx.objectStore('events');
    var pending = [];

    store.openCursor().onsuccess = function (e) {
      var cursor = e.target.result;
      if (cursor) {
        if (!cursor.value.synced) {
          pending.push(cursor.value);
        }
        cursor.continue();
      } else {
        if (pending.length === 0) {
          console.log('[bridge] No pending events to sync');
          window.dispatchEvent(new CustomEvent('unity-message', {
            detail: JSON.stringify({ type: 'TELEMETRY_SYNC_DONE', count: 0 })
          }));
          return;
        }

        // Single POST with all pending events
        fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': apiKey,
            'Authorization': 'Bearer ' + apiKey
          },
          body: JSON.stringify({ events: pending })
        })
        .then(function (res) {
          if (!res.ok) throw new Error('Sync failed: ' + res.status);
          return res.json();
        })
        .then(function () {
          // Mark all synced events
          var writeTx = window._unveilDB.transaction('events', 'readwrite');
          var writeStore = writeTx.objectStore('events');
          pending.forEach(function (evt) {
            evt.synced = true;
            writeStore.put(evt);
          });
          console.log('[bridge] Synced ' + pending.length + ' events');
          window.dispatchEvent(new CustomEvent('unity-message', {
            detail: JSON.stringify({ type: 'TELEMETRY_SYNC_DONE', count: pending.length })
          }));
        })
        .catch(function (err) {
          console.warn('[bridge] Sync error:', err);
          window.dispatchEvent(new CustomEvent('unity-message', {
            detail: JSON.stringify({ type: 'TELEMETRY_SYNC_ERROR', error: err.message })
          }));
        });
      }
    };
  },

  // ─── Session Meta ──────────────────────────────────────────────

  TelemetryStore_SetMeta: function (keyPtr, valuePtr) {
    var key = UTF8ToString(keyPtr);
    var value = UTF8ToString(valuePtr);
    if (!window._unveilDB) return;
    try {
      var tx = window._unveilDB.transaction('meta', 'readwrite');
      tx.objectStore('meta').put({ key: key, value: value, ts: Date.now() });
    } catch (err) {
      console.warn('[bridge] SetMeta error:', err);
    }
  }
});
