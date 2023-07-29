// @ts-nocheck

function showError(message: string) {
    bootstrap.showToast({
        header: "<i class='bi bi-exclamation-triangle-fill'></i> Error",
        body: message,
    });
}

function showSuccess(message: string) {
    bootstrap.showToast({
        header: "<i class='bi bi-check-circle-fill'></i> Success",
        body: message,
    });
}

function capitalizeFirstLetter(str: string) {
    if (str.length == 0) {
        return "";
    }

    return `${str.charAt(0).toUpperCase()}${str.slice(1)}`;
}

function capitalizeFirstLetterFormatter(value, row, index, field) {
    return capitalizeFirstLetter(value);
}

function convertToDp(num: number, dp: number) {
    return parseFloat(num).toFixed(dp);
}
