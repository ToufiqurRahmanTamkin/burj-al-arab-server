const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const cors = require('cors');
const port = 5000;
const app = express()
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
require('dotenv').config()
// firebase
const admin = require("firebase-admin");
const serviceAccount = require("./configs/burj-al-arab-f8402-firebase-adminsdk-8uvkl-8d3ae1b243.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.z8m97.mongodb.net/burjAlArab?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


client.connect(err => {
  const bookings = client.db("burjAlArab").collection("bookings");
  console.log('Database Connection Successful');

  app.post('/addBooking', (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking)
      .then(result => {
        res.send(result.insertedCount > 0);
      })
    // console.log(newBooking);
  })

  app.get('/bookings', (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith('Bearer ')) {
      const idToken = bearer.split(' ')[1];
      // console.log({ idToken });
      admin.auth().verifyIdToken(idToken)
        .then((decodedToken) => {
          const tokenEmail = decodedToken.email;
          const queryEmail = req.query.email;
          // console.log(tokenEmail, queryEmail);
          if (tokenEmail == req.query.email) {
            bookings.find({ email: queryEmail })
              .toArray((err, documents) => {
                res.status(200).send(documents);
              })
          }
          else{
            res.status(401).send('unauthorised access')
          }
          // console.log({ uid });
          // ...
        })
        .catch((error) => {
          res.status(401).send('unauthorised access')
        });
    }
    else{
      res.status(401).send('unauthorised access')
    }

  })
});

app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.listen(port)