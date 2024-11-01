const fs = require("fs").promises;
const path = require("path");
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
    createdAt: new Date(),
  };

  data.expenses.push(newExpense);
  await writeData(data);
  console.log(`Expense added with ID: ${newExpense.id}`);
}

(async () => {
  try {
    switch (process.argv[2]) {
      case "add":
        addExpense();
        break;
      default:
        throw new Error("Invalid command");
    }
  } catch (err) {
    console.error(err.message);
  }
})();
