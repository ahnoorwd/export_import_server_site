const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 1000;  

// middlewares
app.use(cors());
app.use(express.json());

// simple GET route
app.get('/', (req, res) => {
  res.send('Server is running now port 1000 !!!');
});




const uri = "mongodb+srv://exportimport:tqLiDfBn3fxFhOyH@cluster0.u05ii.mongodb.net/?appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("products_db");
    const productcollection = db.collection("products")
    app.get('/products', async(req,res)=>{
    const result = await productcollection.find().toArray();
    res.send(result);
    })



    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
   // await client.close();
  }
}
run().catch(console.dir);


// start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
