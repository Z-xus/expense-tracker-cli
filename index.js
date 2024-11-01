const fs = require("fs").promises;
const path = require("path");
const readline = require("node:readline");
const filePath = path.join(__dirname, "data.json");

async function readData() {
  try {
    const data = await fs.readFile(filePath, "utf8");
    return data ? JSON.parse(data) : {};
  } catch (err) {
    if (err.code === "ENOENT") return {};
    throw new Error(`Error reading data: ${err.message}`);
  }
}

async function writeData(data) {
  try {
    data.meta = {
      totalExpenses: data.expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0,
      ),
    };
    await fs.writeFile(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    throw new Error(`Error writing data: ${err.message}`);
  }
}

async function argsParser() {
  const args = process.argv.slice(2);
  const parsedArgs = {};

  try {
    args.forEach((arg, index) => {
      if (arg === "--description") {
        parsedArgs.description = args[index + 1];
      } else if (arg === "--amount") {
        parsedArgs.amount = parseFloat(args[index + 1]);
      } else if (arg === "--id") {
        parsedArgs.id = parseInt(args[index + 1]);
      } else if (arg === "--month") {
        parsedArgs.month = parseInt(args[index + 1]);
      }
    });
  } catch (err) {
    throw new Error(`Invalid arguments: ${err.message}`);
  }
  return parsedArgs;
}

async function addExpense() {
  const args = await argsParser();
  if (!args.description || !args.amount) {
    throw new Error("Description and amount are required");
  }

  const data = await readData();
  if (!data.expenses) data.expenses = [];
  const newExpense = {
    id: data.expenses.length + 1,
    amount: args.amount,
    description: args.description,
    createdAt: formatDate(new Date()),
  };

  data.expenses.push(newExpense);
  await writeData(data);
  console.log(`Expense added with ID: ${newExpense.id}`);
}

function formatDate(date) {
  return new Date(date).toISOString().split("T")[0];
}

async function listExpenses() {
  const data = await readData();
  if (!data.expenses || data.expenses.length === 0) {
    console.log("No expenses found");
    return;
  }

  data.expenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const idWidth = 5;
  const amountWidth = 10;
  const descriptionWidth = 18;
  const createdAtWidth = 15;
  const header =
    "| " +
    `ID`.padEnd(idWidth) +
    " | " +
    `Amount (₹)`.padEnd(amountWidth) +
    " | " +
    `Description`.padEnd(descriptionWidth) +
    " | " +
    `Date`.padEnd(createdAtWidth) +
    " | ";
  console.log(header);
  console.log("-".repeat(header.length));
  data.expenses.forEach((expense) => {
    const id = expense.id.toString().padEnd(idWidth);
    const amount = expense.amount.toString().padEnd(amountWidth);
    const description = expense.description.padEnd(descriptionWidth);
    const createdAt = formatDate(expense.createdAt).padEnd(createdAtWidth);
    console.log(`| ${id} | ${amount} | ${description} | ${createdAt} |`);
  });
}

async function updateExpense() {
  const args = await argsParser();
  if (!args.id || (!args.amount && !args.description)) {
    throw new Error(
      "ID is required, and at least one of amount or description must be provided.",
    );
  }

  const data = await readData();
  const expense = data.expenses.find((exp) => exp.id === args.id);

  if (!expense) {
    throw new Error(`Expense with ID ${args.id} not found`);
  }

  if (args.amount) expense.amount = args.amount;
  if (args.description) expense.description = args.description;

  await writeData(data);
  console.log(`Expense with ID ${args.id} has been updated`);
}

async function deleteExpense() {
  const args = await argsParser();
  if (!args.id) {
    throw new Error("ID is required to delete an expense");
  }

  const data = await readData();
  data.expenses = data.expenses.filter((exp) => exp.id !== args.id);
  await writeData(data);
  console.log(`Expense with ID ${args.id} has been deleted`);
}

async function summarizeExpenses() {
  const args = await argsParser();
  if (!args.month) {
    throw new Error(
      "Month and number of months are required to summarize expenses",
    );
  }

  const data = await readData();
  const month = args.month;

  if (!data.expenses || data.expenses.length === 0) {
    console.log("No expenses found");
    return;
  }
  const totalExpenses = data.expenses.reduce((sum, expense) => {
    const expenseMonth = new Date(expense.createdAt).getMonth() + 1;
    return expenseMonth === month ? sum + expense.amount : sum;
  }, 0);

  console.log(`Total expenses for month ${month}: ₹${totalExpenses}`);
}

(async () => {
  try {
    switch (process.argv[2]) {
      case "add":
        addExpense();
        break;
      case "list":
        listExpenses();
        break;
      case "update":
        updateExpense();
        break;
      case "delete":
        deleteExpense();
        break;
      case "summary":
        summarizeExpenses();
        break;
      default:
        throw new Error("Invalid command");
    }
  } catch (err) {
    console.error(err.message);
  }
})();
