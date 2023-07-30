// @ts-nocheck

var transactionsChartCanvas = $("#transactionsChart");
var expensesChartCanvas = $("#expensesChart");
var incomesChartCanvas = $("#incomesChart");

var transactionsChart = null;
var expensesChart = null;
var incomesChart = null;

async function getTransactions() {
    var transactions = await window.api.getTransactions();

    return new Promise((resolve, reject) => {
        resolve(transactions);
    });
}

async function createCharts() {
    var transactions: Array<any> = await getTransactions();

    var expenseAmount: number = 0;
    var expenseCategories = {};
    var incomeAmount: number = 0;
    var incomeCategories = {};
    for (var i = 0; i < transactions.length; i += 1) {
        var transaction = transactions[i];
        var amount: number = transaction.amount;
        var categoryName: string = transaction.category_name.toLowerCase();

        switch (transaction.category_type.toLowerCase()) {
            case "expense":
                expenseAmount += amount;

                if (categoryName in expenseCategories) {
                    expenseCategories[categoryName] += amount;
                } else {
                    expenseCategories[categoryName] = amount;
                }

                break;

            case "income":
                incomeAmount += amount;

                if (categoryName in incomeCategories) {
                    incomeCategories[categoryName] += amount;
                } else {
                    incomeCategories[categoryName] = amount;
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
                    display: true,
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
                data: [expenseAmount, incomeAmount],
                backgroundColor: [
                    'rgb(255, 193, 7)',
                    'rgb(13, 202, 240)'
                ],
                hoverOffset: 4
            }]
        },
        options: getOptions("Transactions")
    });

    var expenseChartLabels: string[] = [];
    var expenseChartData: number[] = [];
    Object.entries(expenseCategories).forEach(([key, value]) => {
        expenseChartLabels.push(capitalizeFirstLetter(key));
        expenseChartData.push(value);
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
        incomeChartData.push(value);
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

$(window).on("resize", () => {
    transactionsChart.resize();
    expensesChart.resize();
    incomesChart.resize();
});
