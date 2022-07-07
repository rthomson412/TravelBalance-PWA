const indexedDB =
  window.indexedDB ||
  window.mozIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request = indexedDB.open("travel-balance", 1);

request.onupgradeneeded = ({ target }) => {
  const db = target.result;
  db.createObjectStore("new_balance", { autoIncrement: true });
};

request.onsuccess = ({ target }) => {
  db = target.result;

  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("Woops! " + event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["new_balance"], "readwrite");
  const store = transaction.objectStore("new_balance");

  store.add(record);
}

function checkDatabase() {
  const transaction = db.transaction(["new_balance"], "readwrite");
  const store = transaction.objectStore("new_balance");
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => {
          return response.json();
        })
        .then(() => {
          const transaction = db.transaction(["new_balance"], "readwrite");
          const store = transaction.objectStore("new_balance");
          store.clear();
        });
    }
  };
}

// event listener for regaining connection
window.addEventListener("online", checkDatabase);