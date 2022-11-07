const express = require('express');
const cors = require('cors');
require('dotenv').config();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const verify = require('jsonwebtoken/verify');
const app = express();
const port = 5000;

//Middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.2redmm4.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
   useNewUrlParser: true,
   useUnifiedTopology: true,
   serverApi: ServerApiVersion.v1,
});

//Jwt Verify function
const verifyJWT = (req, res, next) => {
   const authHeader = req.headers.authorization;
   if (!authHeader) {
      return res.status(401).send({ message: 'unauthorized access' });
   }
   const token = authHeader.split(' ')[1];

   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
      if (err) {
         return res.status(401).send({ message: 'unauthorized access' });
      }
      req.decoded = decoded;
      next();
   });
};

const run = async () => {
   try {
      const eventCollection = client.db('earthCare').collection('event');
      const perticipateCollection = client.db('earthCare').collection('perticipate');

      app.post('/jwt', (req, res) => {
         const user = req.body;
         const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
         console.log(user);
         res.send({ token });
      });

      app.get('/events', async (req, res) => {
         const query = {};
         const cursor = eventCollection.find(query);
         const events = await cursor.toArray();
         res.send(events);
      });

      app.get('/events/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         const cursor = await eventCollection.findOne(query);
         res.send(cursor);
      });

      app.post('/perticipate', async (req, res) => {
         const perticipates = req.body;
         console.log(perticipates);
         const result = await perticipateCollection.insertOne(perticipates);
         console.log(result);
         res.send(result);
      });

      app.get('/perticipate', verifyJWT, async (req, res) => {
         const decoded = req.decoded;
         console.log(decoded);
         if (decoded.email !== req.query.email) {
            res.status(403).send({ message: 'unauthorized access' });
         }

         let query = {};
         if (req.query.email) {
            query = {
               email: req.query.email,
            };
         }
         const cursor = perticipateCollection.find(query);
         const perticipate = await cursor.toArray();
         res.send(perticipate);
      });

      app.patch('/perticipate/:id', async (req, res) => {
         const id = req.params.id;
         const status = req.body.status;
         const query = { _id: ObjectId(id) };
         const updateDoc = {
            $set: {
               status: status,
            },
         };
         const result = await perticipateCollection.updateOne(query, updateDoc);
         res.send(result);
         console.log(status);
      });

      app.delete('/perticipate/:id', async (req, res) => {
         const id = req.params.id;
         const query = { _id: ObjectId(id) };
         console.log(query);
         const cursor = await perticipateCollection.deleteOne(query);
         console.log(cursor);
         res.send(cursor);
      });
   } finally {
   }
};
run().catch((error) => console.log(error));

app.get('/', (req, res) => {
   res.send('Earth care running ');
});

app.listen(port, () => {
   console.log(`Earth care running on ${port}`);
});
