import { app, BrowserWindow, ipcMain } from "electron";
import * as BetterSqlite3 from "better-sqlite3";

var path = require("path");

function createWindow() {
	const win = new BrowserWindow({
		width: 800,
		height: 600,
		//autoHideMenuBar: true,
		webPreferences: {
			preload: path.join(__dirname, "preload.js")
		}
	});

	win.loadFile("index.html");
	//win.webContents.openDevTools();
}

function getDatabasePath() {
	var folder: string = app.getPath("userData");
	return path.join(folder, "database.sqlite");
}

function createTables(db: BetterSqlite3.Database) {
	db.prepare("\
		CREATE TABLE IF NOT EXISTS Categories (\
			id INTEGER PRIMARY KEY AUTOINCREMENT,\
			name TEXT NOT NULL COLLATE NOCASE,\
			type TEXT NOT NULL,\
			UNIQUE (name, type),\
			CHECK (type == 'income' OR type == 'expense')\
		)").run();

	db.prepare("\
		CREATE TABLE IF NOT EXISTS Transactions (\
			id INTEGER PRIMARY KEY AUTOINCREMENT,\
			datetime INTEGER NOT NULL,\
			category_id INTEGER NOT NULL,\
			amount NUMERIC NOT NULL,\
			description TEXT,\
			FOREIGN KEY (category_id) REFERENCES Categories(id),\
			CHECK (amount >= 0)\
		)").run();
}

app.on("window-all-closed", () => {
	if (process.platform !== "darwin") app.quit();
});

app.whenReady().then(() => {
	const databaseFilename: string = getDatabasePath();
	const db = new BetterSqlite3(databaseFilename);
	createTables(db);

	ipcMain.handle("getBalance", (event) => {
		try {
			const stmt = db.prepare("\
			SELECT (\
				SELECT SUM(amount)\
				FROM Transactions\
				WHERE category_id IN (SELECT id FROM Categories WHERE type == 'income')\
			) - (\
				SELECT SUM(amount)\
				FROM Transactions\
				WHERE category_id IN (SELECT id FROM Categories WHERE type == 'expense')\
			) AS balance");
			const row: any = stmt.get();

			if (row !== undefined) {
				return row.balance;
			}
		} catch (error) {
			console.log(error);
		}

		return undefined;
	});

	ipcMain.handle("getTotalTransactions", (event, args) => {
		if (args === undefined) {
			args = {};
		}

		const search: string = args.search;

		var sql: string = "SELECT COUNT(Transactions.id) AS total FROM Transactions JOIN Categories ON Transactions.category_id = Categories.id";

		var filters: Array<any> = [];
		if (search) {
			filters.push({
				condition: "Categories.name LIKE ('%' || ? || '%') OR Categories.type LIKE ('%' || ? || '%') OR Transactions.description LIKE ('%' || ? || '%') OR printf('%.2f', Transactions.amount) LIKE ('%' || ? || '%')",
				values: [search, search, search, search]
			});
		}

		var params: Array<any> = [];
		if (filters.length > 0) {
			sql = `${sql} WHERE`;
			for (var i = 0; i < filters.length; i += 1) {
				var filter = filters[i];
				var condition: string = filter.condition;
				var values: Array<any> = filter.values;

				if (i > 0) {
					sql = `${sql} AND`;
				}

				sql = `${sql} ${condition}`;
				params = params.concat(values);
			}
		}

		try {
			const stmt = db.prepare(sql);
			const row: any = stmt.get.apply(stmt, params);

			if (row !== undefined) {
				return row.total;
			}
		} catch (error) {
			console.log(error);
		}

		return undefined;
	});

	ipcMain.handle("getTransactions", (event, args) => {
		if (args === undefined) {
			args = {};
		}

		const search: string = args.search;
		const sort: string = args.sort;
		const order: string = args.order;
		const offset: number = args.offset;
		const limit: number = args.limit;

		var sql: string = "SELECT Transactions.id, Transactions.datetime, Transactions.category_id, Transactions.amount, Transactions.description, Categories.name as category_name, Categories.type as category_type FROM Transactions JOIN Categories ON Transactions.category_id = Categories.id";

		var filters: Array<any> = [];
		if (search) {
			filters.push({
				condition: "Categories.name LIKE ('%' || ? || '%') OR Categories.type LIKE ('%' || ? || '%') OR Transactions.description LIKE ('%' || ? || '%') OR printf('%.2f', Transactions.amount) LIKE ('%' || ? || '%')",
				values: [search, search, search, search]
			});
		}

		var params: Array<any> = [];
		if (filters.length > 0) {
			sql = `${sql} WHERE`;
			for (var i = 0; i < filters.length; i += 1) {
				var filter = filters[i];
				var condition: string = filter.condition;
				var values: Array<any> = filter.values;

				if (i > 0) {
					sql = `${sql} AND`;
				}

				sql = `${sql} ${condition}`;
				params = params.concat(values);
			}
		}

		if (sort !== undefined && order !== undefined) {
			const whitelist: string[] = ["datetime", "category_name", "category_type", "amount", "description"];
			if (whitelist.includes(sort.toLowerCase())) {
				if (order == "asc") {
					sql = `${sql} ORDER BY ${sort} ASC`;
				} else if (order == "desc") {
					sql = `${sql} ORDER BY ${sort} DESC`;
				}
			}
		}

		if (!isNaN(offset) && !isNaN(limit)) {
			sql = `${sql} LIMIT ${limit} OFFSET ${offset}`;
		}

		var rows: any;
		try {
			const stmt = db.prepare(sql);
			rows = stmt.all.apply(stmt, params);
		} catch (error) {
			console.log(error);
			return undefined;
		}

		var transactions: Array<any> = [];
		for (var i: number = 0; i < rows.length; i += 1) {
			var row: any = rows[i];

			transactions.push({
				id: row.id,
				datetime: row.datetime,
				category_id: row.category_id,
				amount: row.amount,
				description: row.description,
				category_name: row.category_name,
				category_type: row.category_type,
			});
		}

		return transactions;
	});

	ipcMain.handle("addTransaction", (event, datetime: number, categoryId: number, amount: number, description: string) => {
		try {
			const stmt = db.prepare("INSERT INTO Transactions (datetime, category_id, amount, description) VALUES (?, ?, ?, ?)");
			stmt.run(datetime, categoryId, amount, description);
		} catch (error) {
			console.log(error);
			return false;
		}

		return true;
	});

	ipcMain.handle("editTransaction", (event, id: number, datetime: number, categoryId: number, amount: number, description: string) => {
		try {
			const stmt = db.prepare("UPDATE Transactions SET datetime = ?, category_id = ?, amount = ?, description = ? WHERE id = ?");
			stmt.run(datetime, categoryId, amount, description, id);
		} catch (error) {
			console.log(error);
			return false;
		}

		return true;
	});

	ipcMain.handle("deleteTransaction", (event, id: number) => {
		try {
			const stmt = db.prepare("DELETE FROM Transactions WHERE id = ?");
			stmt.run(id);
		} catch (error) {
			console.log(error);
			return false;
		}

		return true;
	});

	ipcMain.handle("hasCategoryNameType", (event, name, type) => {
		try {
			const stmt = db.prepare("SELECT COUNT(name) as count FROM Categories WHERE name = ? and type = ?");
			const row: any = stmt.get(name, type);

			if (row !== undefined) {
				return (row.count > 0);
			}
		} catch (error) {
			console.log(error);
		}

		return undefined;
	});

	ipcMain.handle("getCategory", (event, id) => {
		try {
			const stmt = db.prepare("SELECT id, name, type FROM Categories WHERE id = ?");
			const row: any = stmt.get(id);

			if (row !== undefined) {
				return {
					id: row.id,
					name: row.name,
					type: row.type
				};
			}
		} catch (error) {
			console.log(error);
		}

		return undefined;
	});

	ipcMain.handle("getCategories", (event, args) => {
		if (args === undefined) {
			args = {};
		}

		const search: string = args.search;
		const sort: string = args.sort;
		const order: string = args.order;
		const offset: number = args.offset;
		const limit: number = args.limit;

		var sql: string = "SELECT id, name, type FROM Categories";

		var filters: Array<any> = [];
		if (search) {
			filters.push({
				condition: "name LIKE ('%' || ? || '%') OR type LIKE ('%' || ? || '%')",
				values: [search, search]
			});
		}

		var params: Array<any> = [];
		if (filters.length > 0) {
			sql = `${sql} WHERE`;
			for (var i = 0; i < filters.length; i += 1) {
				var filter = filters[i];
				var condition: string = filter.condition;
				var values: Array<any> = filter.values;

				sql = `${sql} ${condition}`;
				params = params.concat(values);
			}
		}

		if (sort !== undefined && order !== undefined) {
			const whitelist: string[] = ["name", "type"];
			if (whitelist.includes(sort.toLowerCase())) {
				if (order == "asc") {
					sql = `${sql} ORDER BY ${sort} ASC`;
				} else if (order == "desc") {
					sql = `${sql} ORDER BY ${sort} DESC`;
				}
			}
		}

		if (!isNaN(offset) && !isNaN(limit)) {
			sql = `${sql} LIMIT ${limit} OFFSET ${offset}`;
		}

		var rows: Array<any>;
		try {
			const stmt = db.prepare(sql);
			rows = stmt.all.apply(stmt, params);
		} catch (error) {
			console.log(error);
			return undefined;
		}

		var categories: Array<any> = [];
		for (var i: number = 0; i < rows.length; i += 1) {
			var row: any = rows[i];

			categories.push({
				id: row.id,
				name: row.name,
				type: row.type
			});
		}

		return categories;
	});

	ipcMain.handle("addCategory", (event, name: string, type: string) => {
		try {
			const stmt = db.prepare("INSERT INTO Categories (name, type) VALUES (?, ?)");
			stmt.run(name.toLowerCase(), type.toLowerCase());
		} catch (error) {
			console.log(error);
			return false;
		}

		return true;
	});

	ipcMain.handle("editCategory", (event, id: number, name: string, type: string) => {
		try {
			const stmt = db.prepare("UPDATE Categories SET name = ?, type = ? WHERE id = ?");
			stmt.run(name.toLowerCase(), type.toLowerCase(), id);
		} catch (error) {
			console.log(error);
			return false;
		}

		return true;
	});

	ipcMain.handle("deleteCategory", (event, id: number) => {
		try {
			const stmt = db.prepare("DELETE FROM Categories WHERE id = ?");
			stmt.run(id);
		} catch (error) {
			console.log(error);
			return false;
		}

		return true;
	});

	createWindow();

	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) createWindow();
	});
})
