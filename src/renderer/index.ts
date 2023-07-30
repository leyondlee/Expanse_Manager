// @ts-nocheck

var transactionsChartCanvas = $("#transactionsChart");
var expensesChartCanvas = $("#expensesChart");
var incomesChartCanvas = $("#incomesChart");

var transactionsChart = null;
var expensesChart = null;
var incomesChart = null;

async function createCharts() {
    var res: Array<any> = await window.api.getAmountPerCategory();
    if (res === undefined) {
        showError("Something went wrong");
        return;
    }

    var expenseAmount: number = 0;
    var expenseCategories = {};
    var incomeAmount: number = 0;
    var incomeCategories = {};
    for (var i = 0; i < res.length; i += 1) {
        var data = res[i];
        var name: string = data.name.toLowerCase();
        var type: string = data.type.toLowerCase();
        var amount: number = data.amount;

        switch (type) {
            case "expense":
                expenseAmount += amount;

                if (name in expenseCategories) {
                    expenseCategories[name] += amount;
                } else {
                    expenseCategories[name] = amount;
                }

                break;

            case "income":
                incomeAmount += amount;

                if (name in incomeCategories) {
                    incomeCategories[name] += amount;
                } else {
                    incomeCategories[name] = amount;
                }

                break;
        }
    }

    const getOptions = (title: string) => {
        return {
            // responsive: true,
            // maintainAspectRatio: false,
            plugins: {
                title: {
                    display: false,
                    text: title,
                },
                legend: {
                    display: false
                }
            }
        };
    };

    transactionsChart = new Chart(transactionsChartCanvas, {
        type: "doughnut",
        data: {
            labels: [
                'Expense',
                'Income'
            ],
            datasets: [{
                label: 'Amount ($)',
                data: [convertToDp(expenseAmount, 2), convertToDp(incomeAmount, 2)],
                hoverOffset: 4
            }]
        },
        options: getOptions("Transactions")
    });

    var expenseChartLabels: string[] = [];
    var expenseChartData: number[] = [];
    Object.entries(expenseCategories).forEach(([key, value]) => {
        expenseChartLabels.push(capitalizeFirstLetter(key));
        expenseChartData.push(convertToDp(value, 2));
    });

    expensesChart = new Chart(expensesChartCanvas, {
        type: "doughnut",
        data: {
            labels: expenseChartLabels,
            datasets: [{
                label: 'Amount ($)',
                data: expenseChartData,
                hoverOffset: 4
            }]
        },
        options: getOptions("Expenses")
    });

    var incomeChartLabels: string[] = [];
    var incomeChartData: number[] = [];
    Object.entries(incomeCategories).forEach(([key, value]) => {
        incomeChartLabels.push(capitalizeFirstLetter(key));
        incomeChartData.push(convertToDp(value, 2));
    });

    incomesChart = new Chart(incomesChartCanvas, {
        type: "doughnut",
        data: {
            labels: incomeChartLabels,
            datasets: [{
                label: 'Amount ($)',
                data: incomeChartData,
                hoverOffset: 4
            }]
        },
        options: getOptions("Incomes")
    });
}

createCharts();
