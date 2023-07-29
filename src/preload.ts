import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
    getTotalTransactions: (args: any) => ipcRenderer.invoke("getTotalTransactions", args),
    getTransactions: (args: any) => ipcRenderer.invoke("getTransactions", args),
    addTransaction: (datetime: number, categoryId: number, amount: number, description: string) => ipcRenderer.invoke("addTransaction", datetime, categoryId, amount, description),
    editTransaction: (id: number, datetime: number, categoryId: number, amount: number, description: string) => ipcRenderer.invoke("editTransaction", id, datetime, categoryId, amount, description),
    deleteTransaction: (id: number) => ipcRenderer.invoke("deleteTransaction", id),
    getCategories: (args: any) => ipcRenderer.invoke("getCategories", args),
    hasCategoryNameType: (name: string, type: string) => ipcRenderer.invoke("hasCategoryNameType", name, type),
    addCategory: (name: string, type: string) => ipcRenderer.invoke("addCategory", name, type),
    editCategory: (id: number, name: string, type: string) => ipcRenderer.invoke("editCategory", id, name, type),
    //getCategory: (id: number) => ipcRenderer.invoke("getCategory", id),
    deleteCategory: (id: number) => ipcRenderer.invoke("deleteCategory", id)
});
