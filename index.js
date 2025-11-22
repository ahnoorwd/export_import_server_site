const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const app = express();
const port = process.env.PORT || 1000;

// middlewares
app.use(cors());
app.use(express.json());

// simple GET route
app.get("/", (req, res) => {
  res.send("Server is running now port 1000 !!!");
});

const uri =
  `mongodb+srv://${process.env.DB_UserName}:${process.env.DB_password}@cluster0.u05ii.mongodb.net/?appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const db = client.db("products_db");
    const productcollection = db.collection("products");
    const importCollection = db.collection("imports");

    // load the all products here via get api calling

    app.get("/products", async (req, res) => {
      const result = await productcollection.find().toArray();
      res.send(result);
    });

    //  load the latest six products via get api calling

    app.get("/latest-products", async (req, res) => {
      const result = await productcollection
        .find()
        .sort({ createdAt: -1 })
        .limit(6)
        .toArray();
      res.send(result);
    });

    // products details api is calling here

    app.get("/products/:id", async (req, res) => {
      const { id } = req.params;
      const result = await productcollection.findOne({ _id: new ObjectId(id) });
      res.send(result);
    });

    //add new product to the database

    app.post("/products", async (req, res) => {
      const data = req.body;
      const result = await productcollection.insertOne(data);
      res.send(result);
    });

    //save imported information to the database

    app.post("/import", async (req, res) => {
      const { productId, quantity, userEmail } = req.body;

      const product = await productcollection.findOne({
        _id: new ObjectId(productId),
      });

      if (!product) {
        return res.status(404).send({ message: "Product not found" });
      }

      // Save import record
      const importData = {
        userEmail, // ⭐ store the logged-in user's email
        productId,
        productName: product.productName,
        productImage: product.productImage,
        price: product.price,
        originCountry: product.originCountry,
        rating: product.rating,
        availableQuantity: product.availableQuantity,
        importedQuantity: quantity,
        importedAt: new Date(),
      };

      const result = await importCollection.insertOne(importData);
      res.send(result);
    });

    // Get all imported products of a specific user
    app.get("/imports/:email", async (req, res) => {
      const { email } = req.params;

      const result = await importCollection
        .find({ userEmail: email })
        .sort({ importedAt: -1 })
        .toArray();

      res.send(result);
    });

    // Reduce the available quantity of product
    app.patch("/products/:id", async (req, res) => {
      const { id } = req.params;
      const { quantity } = req.body;

      // Reduce availableQuantity
      const updateResult = await productcollection.updateOne(
        { _id: new ObjectId(id) },
        { $inc: { availableQuantity: -quantity } }
      );

      // Get updated product
      const updatedProduct = await productcollection.findOne({
        _id: new ObjectId(id),
      });

      res.send({
        message: "Quantity updated",
        updatedProduct,
      });
    });

    // DELETE an import item
    app.delete("/imports/:id", async (req, res) => {
      const { id } = req.params;

      const result = await importCollection.deleteOne({
        _id: new ObjectId(id),
      });

      res.send(result);
    });

    // search operation is here to client side

    app.get("/search", async (req, res) => {
      const search_text = req.query.search;
      // console.log(search_text);
      const result = await productcollection
        .find({
          productName: { $regex: search_text, $options: "i" },
        })
        .toArray();
      res.send(result);
    });

    // // 1) Get all products created by a specific user
    app.get("/products/user/:email", async (req, res) => {
      const { email } = req.params;
      try {
        const items = await productcollection
          .find({ userEmail: email })
          .sort({ createdAt: -1 })
          .toArray();
        res.send(items);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 2) Delete a product by id
    app.delete("/products/:id", async (req, res) => {
      const { id } = req.params;
      try {
        const result = await productcollection.deleteOne({
          _id: new ObjectId(id),
        });
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // 3) Update a product by id
    app.put("/products/:id", async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;

      // optional: sanitize/convert numeric fields here
      if (updatedData.price !== undefined)
        updatedData.price = Number(updatedData.price);
      if (updatedData.rating !== undefined)
        updatedData.rating = Number(updatedData.rating);
      if (updatedData.availableQuantity !== undefined)
        updatedData.availableQuantity = Number(updatedData.availableQuantity);

      try {
        const result = await productcollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: updatedData }
        );
        res.send(result);
      } catch (err) {
        res.status(500).send({ error: err.message });
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
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
