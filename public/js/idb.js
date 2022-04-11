let db;
const request = indexedDB.open('budget_tracker', 1);

// 
request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('budget_entry', { autoIncrement: true });
};

request.onsuccess = function (event) {
    db = event.target.result;
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (event) {
    console.log(event.target.errorCode);
};

function saveBudget(entry) {
    const transaction = db.transaction(['budget_entry'], 'readwrite');
    const budgetStore = transaction.objectStore('budget_entry');
    budgetStore.add(entry);
}

function uploadBudget() {
    const transaction = db.transaction(['budget_entry'], 'readwrite');
    const budgetStore = transaction.objectStore('budget_entry');
    const getBudgetEntries = budgetStore.getAll();
    getBudgetEntries.onsuccess = function () {
        if (getBudgetEntries.result.length > 0) {
            fetch('/api/transaction', {
                method: 'POST',
                body: JSON.stringify(getBudgetEntries.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['budget_entry'], 'readwrite');
                    const budgetStore = transaction.objectStore('budget_entry');
                    budgetStore.clear();
                    alert('Your saved entries have been posted!');
                })
                .catch(err => {
                    console.log(err);
                });
        }
    };
}

window.addEventListener('online', uploadBudget);