let mysql = require("mysql");
let config = require("./config.js");
let inquirer = require("inquirer");

let connection = mysql.createConnection(config);


function close(){
  // close connections
  connection.end(function(err) {
    if (err) throw err;
  });
}


function displayItems () {
  return new Promise((resolve, reject) => {
    connection.query(
      `SELECT item_id, product_name, price
		FROM products`,
      (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        console.log("");
        for (let x in res) {
          console.log(`id: ${res[x].item_id}  |  product: ${res[x].product_name}  |  price: $${res[x].price}`);
        }
        resolve();    // needed otherwise program hangs after showing above
      });
  });
}


function prompt () {
  console.log("");
  inquirer.prompt([
    {
      type: "input",
      message: `Please enter the ID of the item want: `,
      name: "id"
    },
    {
      type: "input",
      message: `How many would you like: `,
      name: "amt"
    }
  ]).then( function (answers) {
    dealWithInput(answers);
  });
}

function dealWithInput (answers) {
  // check if req <= stock qty
  connection.query(
    `SELECT stock_quantity
		FROM products
		WHERE item_id = '${answers.id}'`,
    (err, res) => {
      if (err) {
        console.error("an error occurred with query");
      } else {
        //console.log(res);
        let amount = res[0].stock_quantity;
        //console.log (amount);

        if (amount >= answers.amt){
          // request can be fulfilled

          // This means updating the SQL database to reflect the remaining quantity.
          updateDB(answers);
          // Once the update goes through, show the customer the total cost of their purchase.
          showOrderCosts(answers);

        } else {
          console.log("Insufficient quantity! The order can't be fulfilled");
        }

        close();
      }
    }
  );
}

// This means updating the SQL database to reflect the remaining quantity.
function updateDB (answers) {
  connection.query(
    `UPDATE products
		SET stock_quantity = stock_quantity - ${answers.amt}
		WHERE item_id = '${answers.id}'`,
    (err, res) => {
      if (err) {
        console.log("Error in updateDB");
      }
    }
  );
}

// get price and the figure out total
function showOrderCosts(answers) {
  connection.query(
    `SELECT price
		FROM products
		WHERE item_id = '${answers.id}'`,
    (err, res) => {
      if (err) {
        console.log("Error in updateDB");
      } else {
        let price = res[0].price;
        console.log("Your total purchase is $" + (price * answers.amt) )
      }
    }
  );
}


async function run () {
  await displayItems();
  prompt();
}


run();