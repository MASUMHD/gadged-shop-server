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

// token verification
const verifyJWT = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization){
        return res.send({message: 'No Token'})
    }
    const token = authorization.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_KWT_TOKEN,(err,decoded) => {
        if (err){
            return res.send({message: 'Invalid Token'})
        }
        req.decoded = decoded;
        next();
    })
};

// verify seller
const verifySeller = async (req, res, next) => {
    const email = req.decoded.email;
    const query = {email: email};
    const user = await userCollection.findOne(query);
    if(user?.role !== 'seller'){
        return res.send({message: 'Forbidden Access'});
    }
    next();
}

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


        // add product

        app.post('/products',verifyJWT, verifySeller, async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product);
            res.send(result);
        });

        // get all products

        // ....all products query....
        // ** name searching
        // ** sort by price
        // ** filter by category
        // ** filter by brand

//         app.get('/all-products', async (req , res) => {
//             const {title, category, brand} = req.query
//             const query = {};

//             if(title){
//                 query.title = {$regex: title, $options: 'i'}
//             }

//             if(category){
//                 query.category = {$regex: category, $options: 'i'}
//             }

//             if(brand){
//                 query.brand = brand;
//             }

//             const sortOptions =  req.query.sort === 'asc' ? 1 : -1

//             const products = await productCollection.find(query).sort({price: sortOptions}).toArray();
            
//             // pagination 
//             const totalProducts = await productCollection.countDocuments();

//           const productsInfo = await productCollection
//          .find({}, { projection: { category: 1, brand: 1 } })
//          .toArray();

//          const categories = [
//          ...new Set(productsInfo.map((product) => product.category)),
//          ];

//          const brands = [
//          ...new Set(productsInfo.map((product) => product.brand)),
//          ];

//          res.json({ products: productsInfo, brands, categories, totalProducts });


//         })


    app.get('/all-products', async (req, res) => {
        const { title, category, brand, page = 1, limit = 9 } = req.query;
        const query = {};
  
        if (title) {
        query.title = { $regex: title, $options: 'i' };
        }
        if (category) {
        query.category = { $regex: category, $options: 'i' };
        }
        if (brand) {
        query.brand = brand;
        }
    
        const pageNumber = Number(page)
        const limitNumber = Number(limit)

        const sortOptions = req.query.sort === 'asc' ? 1 : -1;
  
        const products = await productCollection
        .find(query)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .sort({ price: sortOptions })
        .toArray();
  
        const totalProducts = await productCollection.countDocuments(query);
  
        const allProducts = await productCollection.find({}).toArray();
        const categories = [...new Set(allProducts.map((product) => product.category))];
        const brands = [...new Set(allProducts.map((product) => product.brand))];
  
        res.json({ products, brands, categories, totalProducts });
    });
  


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