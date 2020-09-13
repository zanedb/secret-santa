require('dotenv').config()

const {
  APP_AUTH_TOKEN,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_MESSAGING_SERVICE_SID
} = process.env

const Twilio = require('twilio')
const validator = require('validator')
const twilio = Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const fs = require('fs')
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'))

// init sqlite db
const dbFile = './.data/sqlite.db'
const exists = fs.existsSync(dbFile)
const sqlite3 = require('sqlite3').verbose()
const db = new sqlite3.Database(dbFile)

// if ./.data/sqlite.db does not exist, create it, otherwise print records to console
db.serialize(() => {
  if (!exists) {
    db.run(
      'CREATE TABLE People (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, phone TEXT, assigned_name TEXT)'
    )
    console.log('New table People created!')
  } else {
    console.log('Database "People" ready to go!')
    db.each('SELECT * from People', (err, row) => {
      if (row) {
        console.log(`record: ${row.name}`)
      }
    })
  }
})

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (request, response) => {
  response.sendFile(`${__dirname}/views/index.html`)
})

app.get('/admin', (request, response) => {
  response.sendFile(`${__dirname}/views/admin.html`)
})

// endpoint to get all the people in the database
app.get('/getPeople', (req, res) => {
  db.all('SELECT * from People', (err, rows) => {
    if (req.get('Authorization')) {
      // if token is supplied, send full data, otherwise filter
      if (authenticate(req.get('Authorization').split(' ')[1])) {
        res.send(JSON.stringify({ status: 200, people: rows }))
      } else {
        res.status(401).json({ status: 401, error: 'invalid auth token' })
      }
    } else {
      const filteredPeople = []
      rows.forEach(row => {
        filteredPeople.push({ name: row.name })
      })
      res.send(JSON.stringify({ status: 200, people: filteredPeople }))
    }
  })
})

// endpoint to add a person to the database
app.post('/addPerson', (request, response) => {
  console.log(`add to people ${request.body}`)

  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    const cleansedName = cleanseString(request.body.name)
    const cleansedPhone = cleanseString(request.body.phone)
    db.run(
      `INSERT INTO People (name,phone,assigned_name) VALUES (?,?,?)`,
      cleansedName,
      cleansedPhone,
      '',
      error => {
        if (error) {
          response.send({ message: 'error!' })
        } else {
          response.send({ message: 'success' })
        }
      }
    )
  }
})

app.use('/*', (req, res, next) => {
  // only allow authenticated users to access API
  if (req.get('Authorization')) {
    // for Bearer token authorization, extract the token
    if (authenticate(req.get('Authorization').split(' ')[1])) {
      next()
    } else {
      res.status(401).json({ status: 401, error: 'permission denied' })
    }
  } else {
    res.status(401).json({ status: 401, error: 'authorization required' })
  }
})

// endpoint to clear people from the database
app.post('/clearPeople', (request, response) => {
  // DISALLOW_WRITE is an ENV variable that gets reset for new projects so you can write to the database
  if (!process.env.DISALLOW_WRITE) {
    db.each(
      'SELECT * from People',
      (err, row) => {
        console.log('row', row)
        db.run(`DELETE FROM People WHERE ID=?`, row.id, error => {
          if (row) {
            console.log(`deleted row ${row.id}`)
          }
        })
      },
      err => {
        if (err) {
          response.send({ message: 'error!' })
        } else {
          response.send({ message: 'success' })
        }
      }
    )
  }
})

app.post('/deletePerson', (req, res) => {
  if (req.body.id) {
    db.run(`DELETE FROM People WHERE ID=?`, req.body.id, error => {
      if (error) {
        res.status(400).send({ status: 400, message: 'error! does id exist?' })
      } else {
        res.status(200).send({ status: 200, message: 'success' })
      }
    })
  } else {
    res.status(400).send({ status: 400, message: 'requires a user id' })
  }
})

app.post('/assignSecretSanta', (req, res) => {
  db.all('SELECT * from People', (err, rows) => {
    const names = rows.map(row => row.name)
    const picks = getPicks(names)

    picks.forEach(pick => {
      db.run(
        `UPDATE People SET assigned_name=? WHERE name=?`,
        pick.assigned_name,
        pick.name,
        (err, rows) => {
          if (rows) {
            console.log(rows)
          }
        }
      )
    })
    res.status(200).send({ status: 200 })
  })
})

app.post('/sendText', (req, res) => {
  db.all('SELECT * from People', (err, rows) => {
    Promise.all(
      rows.map(row => {
        if (validator.isMobilePhone(row.phone)) {
          twilio.messages.create({
            to: row.phone,
            from: TWILIO_MESSAGING_SERVICE_SID,
            body: `Good morrow, sirrah! Thou hath been assigned ${row.assigned_name.toUpperCase()} for thine Secret Santa 🎅🎁`
          })
        }
        return
      })
    )
      .then(() => {
        res.status(200).send({ status: 200, message: 'messages sent!' })
      })
      .catch(err => {
        res.status(500).send({ status: 500, message: err.toString() })
      })
  })
})

// modified from https://stackoverflow.com/a/21295633
const getPicks = names => {
  return names
    .slice(0)
    .sort(function() {
      return Math.random() - 0.5
    })
    .map(function(name, index, arr) {
      const assigned_name = arr[(index + 1) % arr.length]
      return { name, assigned_name }
    })
}

// helper function that prevents html/css/script malice
const cleanseString = function(string) {
  return string.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// helper function to authenticate with token
const authenticate = token => {
  const tokens = APP_AUTH_TOKEN.split(',')
  return tokens.includes(token)
}

// listen for requests :)
var listener = app.listen(process.env.PORT, () => {
  console.log(`Your app is listening on port ${listener.address().port}`)
})
