// @ts-nocheck

var balance = $("#balance");

async function setBalance() {
    var value: number = await window.api.getBalance();
    if (value === undefined) {
        showError("Something went wrong");
        return;
    }

    balance.text(`$${value.toFixed(2)}`);
}

setBalance();
