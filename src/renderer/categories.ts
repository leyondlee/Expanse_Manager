// @ts-nocheck

var categoryModal = $("#category-modal");
var categoryModalTitle = categoryModal.find(".modal-title");
var categoryModalSubmitButton = $("#category-modal-submit");
var categoryForm = $("#category-form");
var categoryFormNameInput = $("#category-form-name");
var categoryFormTypeSelect = $("#category-form-type");
var categoryFormResetButton = $("#category-form-reset");
var categoryTable = $("#category-table");
var categoryTableToolbar = $("#category-table-toolbar");
var addCategoryButton = $("#add-category");

async function setCategoryTableData(params: any) {
    var res = await window.api.getCategories(params.data);
    if (res === undefined) {
        showError("Something went wrong");
        return;
    }

    params.success(res);
}

async function addCategory(name: string, type: string) {
    lockCategoryModal(true);

    var exists: boolean = await window.api.hasCategoryNameType(name, type);
    if (exists === undefined) {
        showError("Something went wrong");
        lockCategoryModal(false);
        return;
    }

    if (exists) {
        showError(`Category "${name} (${type})" already exists`);
        lockCategoryModal(false);
        return;
    }

    var success: boolean = await window.api.addCategory(name, type);
    if (success) {
        showSuccess("Category Added");

        categoryModal.modal("hide");
        categoryTable.bootstrapTable("refresh");

        return;
    }

    showError(`Fail to add category "${name} (${type})"`);
    lockCategoryModal(false);
}

async function editCategory(id: number, name: string, type: string) {
    lockCategoryModal(true);

    var exists: boolean = await window.api.hasCategoryNameType(name, type);
    if (exists === undefined) {
        showError("Something went wrong");
        lockCategoryModal(false);
        return;
    }

    if (exists) {
        showError(`Category "${name} (${type})" already exists`);
        lockCategoryModal(false);
        return;
    }

    var success: boolean = await window.api.editCategory(id, name, type);
    if (success) {
        showSuccess("Category Saved");

        categoryModal.modal("hide");
        categoryTable.bootstrapTable("refresh");

        return;
    }

    showError("Fail to save category");
    lockCategoryModal(false);
}

async function deleteCategory(id: number) {
    var success: boolean = await window.api.deleteCategory(id);
    if (success) {
        showSuccess("Category Deleted");
        categoryTable.bootstrapTable("refresh");
        return;
    }

    showError("Fail to delete category");
}

function lockCategoryModal(lock: boolean) {
    categoryModal.find("button").prop("disabled", lock);
    categoryForm.find("fieldset").prop("disabled", lock);

    const modal = bootstrap.Modal.getOrCreateInstance(categoryModal);
    modal._config.backdrop = (lock) ? "static" : true;
    modal._config.keyboard = !lock;
}

function showCategoryModal(data: any) {
    categoryForm[0].reset();
    categoryFormResetButton.off("click");
    categoryModalSubmitButton.off("click");

    if (data === undefined) {
        categoryModalTitle.text("Add Category");
        categoryModalSubmitButton.text("Add");

        categoryFormResetButton.on("click", () => {
            categoryForm[0].reset();
        });

        categoryModalSubmitButton.on("click", () => {
            var name = categoryFormNameInput.val();
            var type = categoryFormTypeSelect.val();
            if (!name || !type) {
                showError("Invalid name or type");
                return;
            }

            addCategory(name, type);
        });
    } else {
        categoryModalTitle.text("Edit Category");
        categoryModalSubmitButton.text("Save");

        const resetFunction = () => {
            categoryFormNameInput.val(capitalizeFirstLetter(data.name));
            categoryFormTypeSelect.val(data.type);
        };

        resetFunction();

        categoryFormResetButton.on("click", resetFunction);

        categoryModalSubmitButton.on("click", () => {
            var name = categoryFormNameInput.val();
            var type = categoryFormTypeSelect.val();
            if (!name || !type) {
                showError("Invalid name or type");
                return;
            }

            editCategory(data.id, name, type);
        });
    }

    categoryModal.modal("show");
}

addCategoryButton.on("click", () => {
    showCategoryModal();
});

categoryModal.on("show.bs.modal", event => {
    lockCategoryModal(false);
});

categoryTable.bootstrapTable({
    ajax: (params: any) => {
        setCategoryTableData(params);
    },
    search: true,
    pagination: true,
    showRefresh: true,
    toolbar: categoryTableToolbar,
    columns: [{
        field: "id",
        visible: false
    }, {
        field: "name",
        title: "Name",
        sortable: true,
        formatter: capitalizeFirstLetterFormatter
    }, {
        field: "type",
        title: "Type",
        sortable: true,
        formatter: typeBadgeFormatter
    }, {
        field: "actions",
        title: "Actions",
        width: 0.1,
        widthUnit: "%",
        searchable: false,
        formatter: (value, row, index, field) => {
            return [
                "<div class='btn-group' role='group'>",
                "<button type='button' class='btn btn-light btn-sm edit' title='Edit'>",
                "<i class='bi bi-pencil-square'></i>",
                "</button>",
                "<button type='button' class='btn btn-light btn-sm delete' title='Delete'>",
                "<i class='bi bi-trash'></i>",
                "</button>",
                "</div>"
            ].join("");
        },
        events: {
            "click .edit": function (event, value, row, index) {
                showCategoryModal(row);
            },
            "click .delete": function (event, value, row, index) {
                deleteCategory(row.id);
            },
        }
    }]
});
