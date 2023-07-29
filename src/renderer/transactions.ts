// @ts-nocheck

var transactionModal = $("#transaction-modal");
var transactionModalTitle = transactionModal.find(".modal-title");
var transactionModalSubmitButton = $("#transaction-modal-submit");
var transactionForm = $("#transaction-form");
var transactionFormDatetimeInput = $("#transaction-form-datetime");
var transactionFormExpenseInput = $("#transaction-form-expense");
var transactionFormIncomeInput = $("#transaction-form-income");
var transactionFormCategoryNameSelect = $("#transaction-form-category-name");
var transactionFormAmountInput = $("#transaction-form-amount");
var transactionFormDescriptionInput = $("#transaction-form-description");
var transactionFormResetButton = $("#transaction-form-reset");
var transactionTable = $("#transaction-table");
var transactionTableToolbar = $("#transaction-table-toolbar");
var addTransactionButton = $("#add-transaction");

async function setTransactionTableData(params: any) {
    params.success({
        total: await window.api.getTotalTransactions(params.data),
        rows: await window.api.getTransactions(params.data),
    });
}

async function addTransaction(datetime: number, categoryId: number, amount: number, description: string) {
    lockTransactionModal(true);

    var success: boolean = await window.api.addTransaction(datetime, categoryId, amount, description);
    if (success) {
        showSuccess("Transaction Added");

        transactionModal.modal("hide");
        transactionTable.bootstrapTable("refresh");

        return;
    }

    showError("Fail to add transaction");
    lockTransactionModal(false);
}

async function editTransaction(id: number, datetime: number, categoryId: number, amount: number, description: string) {
    lockTransactionModal(true);

    var success: boolean = await window.api.editTransaction(id, datetime, categoryId, amount, description);
    if (success) {
        showSuccess("Transaction Saved");

        transactionModal.modal("hide");
        transactionTable.bootstrapTable("refresh");

        return;
    }

    showError("Fail to save transaction");
    lockTransactionModal(false);
}

async function deleteTransaction(id: number) {
    var success: boolean = await window.api.deleteTransaction(id);
    if (success) {
        showSuccess(`Transaction Deleted`);
        transactionTable.bootstrapTable("refresh");
        return;
    }

    showError("Fail to delete transaction");
}

function lockTransactionModal(lock: boolean) {
    transactionModal.find("button").prop("disabled", lock);
    transactionForm.find("fieldset").prop("disabled", lock);

    const modal = bootstrap.Modal.getOrCreateInstance(transactionModal);
    modal._config.backdrop = (lock) ? "static" : true;
    modal._config.keyboard = !lock;
}

async function showTransactionModal(data: any) {
    const datetimeInputFormat: string = "YYYY-MM-DDTHH:mm";

    transactionForm[0].reset();
    transactionFormResetButton.off("click");
    transactionModalSubmitButton.off("click");

    transactionFormCategoryNameSelect.prop("disabled", true);
    transactionFormCategoryNameSelect.find("option").not(":first").remove();

    var categoriesRows = await window.api.getCategories();
    if (categoriesRows.length <= 0) {
        showError("No categories found");
    }

    var expenseRows: string[] = categoriesRows.filter((element, index, arr) => { return element.type == "expense" });
    var incomeRows: string[] = categoriesRows.filter((element, index, arr) => { return element.type == "income" });

    transactionFormExpenseInput.prop("disabled", expenseRows.length <= 0);
    transactionFormIncomeInput.prop("disabled", incomeRows.length <= 0);

    const transactionFormCategoryTypeRadioQuery: string = "input[type='radio'][name='transaction-form-category-type']";
    var transactionFormCategoryTypeRadio = $(transactionFormCategoryTypeRadioQuery);
    transactionFormCategoryTypeRadio.off("change");

    const radioChangeFunction = () => {
        transactionFormCategoryNameSelect.prop("disabled", false);
        transactionFormCategoryNameSelect.find("option").not(":first").remove();
        transactionFormCategoryNameSelect.val("");

        var value: string = $(`${transactionFormCategoryTypeRadioQuery}:checked`).val();
        switch (value) {
            case "expense":
                for (var i = 0; i < expenseRows.length; i += 1) {
                    var res = expenseRows[i];
                    transactionFormCategoryNameSelect.append(new Option(capitalizeFirstLetter(res.name), res.id));
                }
                break;

            case "income":
                for (var i = 0; i < incomeRows.length; i += 1) {
                    var res = incomeRows[i];
                    transactionFormCategoryNameSelect.append(new Option(capitalizeFirstLetter(res.name), res.id));
                }
                break;
        }
    };
    transactionFormCategoryTypeRadio.on("change", radioChangeFunction);

    if (data === undefined) {
        transactionModalTitle.text("Add Transaction");
        transactionModalSubmitButton.text("Add");

        transactionFormResetButton.on("click", () => {
            transactionFormCategoryNameSelect.prop("disabled", true);
            transactionForm[0].reset();
        });

        transactionModalSubmitButton.on("click", () => {
            var datetimeStr: string = transactionFormDatetimeInput.val();
            if (!datetimeStr) {
                showError("Please select a valid Date/Time");
                return;
            }
            var datetime: number = moment(datetimeStr, datetimeInputFormat).unix();

            var categoryIdStr: string = transactionFormCategoryNameSelect.val();
            if (!categoryIdStr) {
                showError("Please select a category");
                return;
            }
            var categoryId: number = parseInt(categoryIdStr);

            var amountStr: string = transactionFormAmountInput.val();
            var amount: number = 0;
            if (amountStr) {
                amount = convertToDp(parseFloat(amountStr), 2);
            }
            if (amount < 0) {
                showError("Amount must be greater than or equal $0");
                return;
            }

            var description: string = transactionFormDescriptionInput.val();
            if (!description) {
                description = null;
            }

            addTransaction(datetime, categoryId, amount, description);
        });
    } else {
        transactionModalTitle.text("Edit Transaction");
        transactionModalSubmitButton.text("Save");

        const resetFunction = () => {
            transactionFormDatetimeInput.val(moment.unix(data.datetime).format(datetimeInputFormat));

            $(`${transactionFormCategoryTypeRadioQuery}[value='${data.category_type}']`).prop("checked", true);
            radioChangeFunction();
            transactionFormCategoryNameSelect.val(data.category_id);

            transactionFormAmountInput.val(data.amount).trigger("change");
            transactionFormDescriptionInput.val(data.description);
        };

        resetFunction();

        transactionFormResetButton.on("click", resetFunction);

        transactionModalSubmitButton.on("click", () => {
            var datetimeStr: string = transactionFormDatetimeInput.val();
            if (!datetimeStr) {
                showError("Please select a valid Date/Time");
                return;
            }
            var datetime: number = moment(datetimeStr, datetimeInputFormat).unix();

            var categoryIdStr: string = transactionFormCategoryNameSelect.val();
            if (!categoryIdStr) {
                showError("Please select a category");
                return;
            }
            var categoryId: number = parseInt(categoryIdStr);

            var amountStr: string = transactionFormAmountInput.val();
            var amount: number = 0;
            if (amountStr) {
                amount = convertToDp(parseFloat(amountStr), 2);
            }
            if (amount < 0) {
                showError("Amount must be greater than or equal $0");
                return;
            }

            var description: string = transactionFormDescriptionInput.val();
            if (!description) {
                description = null;
            }

            editTransaction(data.id, datetime, categoryId, amount, description);
        });
    }

    transactionModal.modal("show");
}

transactionFormAmountInput.on("change", () => {
    var value: string = transactionFormAmountInput.val();

    var num: number;
    if (!value || isNaN(value)) {
        num = 0.00;
    } else {
        num = parseFloat(value);
    }

    transactionFormAmountInput.val(convertToDp(num, 2));
});

addTransactionButton.on("click", () => {
    showTransactionModal();
});

transactionModal.on("show.bs.modal", event => {
    lockTransactionModal(false);
});

transactionTable.bootstrapTable({
    ajax: (params: any) => {
        setTransactionTableData(params);
    },
    search: true,
    sidePagination: "server",
    pagination: true,
    showRefresh: true,
    toolbar: transactionTableToolbar,
    sortName: "datetime",
    sortOrder: "desc",
    columns: [{
        field: "id",
        visible: false
    }, {
        field: "category_id",
        visible: false
    }, {
        field: "datetime",
        title: "Date/Time",
        sortable: true,
        formatter: (value, row, index, field) => {
            return moment.unix(value).format("DD MMM YYYY HH:mm:ss");
        }
    }, {
        field: "category_name",
        title: "Category",
        sortable: true,
        formatter: capitalizeFirstLetterFormatter
    }, {
        field: "category_type",
        title: "Type",
        sortable: true,
        formatter: capitalizeFirstLetterFormatter
    }, {
        field: "amount",
        title: "Amount",
        sortable: true,
        formatter: (value, row, index, field) => {
            return `$${convertToDp(value, 2)}`;
        }
    }, {
        field: "description",
        title: "Description",
        sortable: true
    }, {
        field: "actions",
        title: "Actions",
        width: 0.1,
        widthUnit: "%",
        searchable: false,
        formatter: (value, row, index, field) => {
            return [
                "<div class='btn-group' role='group'>",
                "<button type='button' class='btn btn-light btn-sm edit'>",
                "<i class='bi bi-pencil-square'></i>",
                "</button>",
                "<button type='button' class='btn btn-light btn-sm delete'>",
                "<i class='bi bi-trash'></i>",
                "</button>",
                "</div>"
            ].join("");
        },
        events: {
            "click .edit": function (event, value, row, index) {
                showTransactionModal(row);
            },
            "click .delete": function (event, value, row, index) {
                deleteTransaction(row.id);
            },
        }
    }]
});
