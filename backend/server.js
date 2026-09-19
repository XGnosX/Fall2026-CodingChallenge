// IMPORTS
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Stores Collections
let collections = [];


// API ROUTEs
app.get("/api/collections", (req, res) => {
    res.json(collections);
});

// Adds a new collection
app.post("/api/collections", (req, res) => {
    const id = collections.length + 1;

    const newCollection = {
        id: id,
        name: req.body.name,
        images: [],
        // Generates random string for sharing code
        shareId: Math.random().toString(36).substring(2, 10)
    };

    // If user input is empty, assign a name
    if (req.body.name === "") {
        newCollection.name = "Collection " + id;
    }

    collections.push(newCollection);

    res.status(201).json(newCollection);
});

// Adds new image to a collection
app.post("/api/collections/:id/images", (req, res) => {
    const collection = collections.find(
        (collection) => collection.id === Number(req.params.id)
    );

    // Throw error if collection does not exist
    if (!collection) {
        return res.status(404).json({
            error: "Collection not found"
        });
    }

    // Create a new image with +1 id
    const newImage = {
        id: collection.images.length + 1,
        url: req.body.url
    }

    collection.images.push(newImage);

    res.status(201).json(newImage);
});

// Delete an image in a collection
app.delete("/api/collections/:collectionId/images/:imageId", (req, res) => {
    const collection = collections.find(
        (collection) => collection.id === Number(req.params.collectionId)
    );

    // If collection does not exist, throw error
    if (!collection) {
        return res.status(404).json({
            error: "Collection not found"
        });
    }

    // Check if image to be deleted exists in the collection
    const image = collection.images.find(
        (image) => image.id === Number(req.params.imageId)
    );

    // If image does not exist, throw error
    if (!image) {
        return res.status(404).json({
            error: "Image not found"
        });
    }

    // Delete: set the images to everything except the one we want deleted
    collection.images = collection.images.filter(
        (image) => image.id != Number(req.params.imageId)
    );

    res.json({
        message: "Image deleted"
    });
});

// Returns data from Pixabay when user searches the searchTerm
app.get("/api/search", async (req, res) => {
    const searchTerm = req.query.q;

    const response = await fetch(
        `https://pixabay.com/api/?key=${process.env.PIXABAY_API_KEY}&q=${encodeURIComponent(searchTerm)}&image_type=photo&safesearch=true`
    );

    const data = await response.json();

    res.json(data);
});

// Returns the shareId of collection with target id
app.post("/api/collections/:id/share", (req, res) => {
    const collection = collections.find(
        (collection) => collection.id === Number(req.params.id)
    );

    if (!collection) {
        return res.status(404).json({
            error: "Collection not found"
        });
    }

    res.json({
        shareId: collection.shareId
    });
});

// Returns collection with the shareId
app.get("/api/shared/:shareId", (req, res) => {
    const collection = collections.find(
        (collection) => collection.shareId === req.params.shareId
    );

    if (!collection) {
        return res.status(404).json({
            error: "Shared collection not found"
        });
    }
    
    res.json(collection);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});