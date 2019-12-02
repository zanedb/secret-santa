const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const fs = require("fs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// http://expressjs.com/en/starter/static-files.html
app.use(express.static("public"));

// init sqlite db
const dbFile = "./.data/sqlite1.db";
const exists = fs.existsSync(dbFile);
const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(dbFile);

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      "CREATE TABLE People (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT)"
    );
    console.log("New table People created!");

    // insert default person
    db.serialize(() => {
      db.run(
        'INSERT INTO People (name,phone) VALUES ("Zane","123")'
      );
    });
  } else {
    console.log('Database "People" ready to go!');
    db.each("SELECT * from People", (err, row) => {
      if (row) {
        console.log(`record: ${row.name}`);
      }
    });
  }
});

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`);
});

// endpoint to get all the people in the database
app.get("/getPeople", (request, response) => {
  db.all("SELECT * from People", (err, rows) => {
    const filteredPeople = []
    rows.forEach(row => { filteredPeople.push({ name: row.name }) })
    response.send(JSON.stringify(filteredPeople));
  });
});

// endpoint to add a person to the database
app.post("/addPerson", (request, response) => {
  console.log(`add to people ${request.body}`);

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedName = cleanseString(request.body.name);
    const cleansedPhone = cleanseString(request.body.phone);
    db.run(`INSERT INTO People (name,phone) VALUES (?,?)`, cleansedName, cleansedPhone, error => {
      if (error) {
        response.send({ message: "error!" });
      } else {
        response.send({ message: "success" });
      }
    });
  }
});

// endpoint to clear people from the database
app.get("/clearPeople", (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      "SELECT * from People",
      (err, row) => {
        console.log("row", row);
        db.run(`DELETE FROM People WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`);
          }
        });
      },
      err => {
        if (err) {
          response.send({ message: "error!" });
        } else {
          response.send({ message: "success" });
        }
      }
    );
  }
});

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, "&lt;").replace(/>/g, "&gt;");
};

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`);
});