const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 4000;


// middleware
app.use(cors({
    origin: "http://localhost:5173",
    optionsSuccessStatus: 200,
}))
app.use(express.json())

// mongodb

const url = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zi8pxok.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`

const client = new MongoClient(url, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
})

// collection
const userCollection = client.db('gadgetShop').collection('users');
const productCollection = client.db('gadgetShop').collection('products');




const dbConnect = async () => {
    try {
        client.connect();
        console.log('Database connection Successful')

        // get user

        app.get('/user/:email', async (req, res) => {
            const query = {email: req.params.email};
            const user = await userCollection.findOne(query);
            res.send(user);
        })

        // insert user 

        app.post('/users', async (req, res) => {
            const user = req.body;
            // check if email already exists
            const query = {email: user.email}
            const existingUser = await userCollection.findOne(query);

            if (existingUser) {
                return res.status(400).send({message: 'User already exists'})
            }


            const result = await userCollection.insertOne(user);
            res.send(result);
        })



    } catch (error) {
        console.log(error.name, error.message);
    }
}

dbConnect()

// api
app.get('/', (req, res ) =>  {
    res.send('Gadged Shop Server is running')
})

// jwt
app.post('/authentication', async (req, res) => {
    const userEmail = req.body;
    const token = jwt.sign(userEmail, process.env.ACCESS_KWT_TOKEN, { expiresIn: '10d' })

    res.send({ token })
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`)
})