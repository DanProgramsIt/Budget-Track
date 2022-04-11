let db;
const request = indexedDB.open("budget-tracker", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("budget_entry", { autoIncrement: true });
};

// upon a successful
request.onsuccess = function (event) {
  db = event.target.result;

  if (navigator.onLine) {
    uploadExpense();
  }
};

request.onerror = function (event) {
  console.log(event.target.errorCode);
};

function saveRecord(record) {
  const transaction = db.transaction(["budget_entry"], "readwrite");
  const budgetObjectStore = transaction.objectStore("budget_entry");

  budgetObjectStore.add(record);
}

function uploadExpense() {
  const transaction = db.transaction(["budget_entry"], "readwrite");
  const budgetObjectStore = transaction.objectStore("budget_entry");
  const getAll = budgetObjectStore.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((serverResponse) => {
          if (serverResponse.message) {
            throw new Error(serverResponse);
          }
          const transaction = db.transaction(["budget_entry"], "readwrite");
          const budgetObjectStore = transaction.objectStore("budget_entry");
          budgetObjectStore.clear();

          alert("All saved expenses have been submitted!");
        })
        .catch((err) => {
          console.log(err);
        });
    }
  };
}

window.addEventListener("online", uploadExpense);