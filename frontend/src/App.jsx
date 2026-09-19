import { useEffect, useState } from 'react'
import './App.css'

function App() {
  // STATES
  const [collectionName, setCollectionName] = useState("");
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState("");
  const [sharedCollection, setSharedCollection] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [cfopied, setCopied] = useState(false);

  // Gets shareId from search bar if share is in url
  const shareId = new URLSearchParams(window.location.search).get("share");

  // EFFECTS
  useEffect(() => {
    getCollections();
  }, []);
  
  useEffect(() => {
    // Update collections after each render
    if (selectedCollection) {
      const updatedCollection = collections.find(
        (collection) => collection.id === selectedCollection.id
      );

      setSelectedCollection(updatedCollection);
    }
  }, [collections]);

  
  useEffect(() => {
    // If shareId found, get data associated with image with that shareId
    if (!shareId) {
      return;
    }

    const getSharedCollection = async () => {
      const response = await fetch(
        `http://localhost:3000/api/shared/${shareId}`
      );

      const data = await response.json();

      setSharedCollection(data);
    };

    getSharedCollection();
  }, []);


  // FUNCTIONS
  const createCollection = async () => {
    const response = await fetch("http://localhost:3000/api/collections", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: collectionName
      })
    });

    const newCollection = await response.json();

    // Sets collections to everything in it, plus the new collection to the end
    setCollections((currentCollections) => [
      ...currentCollections,
      newCollection
    ])
  }

  const getCollections = async () => {
    // Gets collection from backend
    const response = await fetch("http://localhost:3000/api/collections");

    const data = await response.json();

    console.log(data);

    setCollections(data);
  }

  const saveImage = async (collectionId, image) => {
    const response = await fetch(`http://localhost:3000/api/collections/${collectionId}/images`,
      {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: image.webformatURL
          })
      }
    )

    const newImage = await response.json();

    setCollections((currentCollections) => 
      currentCollections.map((collection) => {
        if (collection.id === collectionId) {
          return {
            ...collection,
            images: [...collection.images, newImage]
          };
        }

        return collection; 
      })
    );
  }

  const deleteImage = async (collectionId, imageId) => {
    const response = await fetch(`http://localhost:3000/api/collections/${collectionId}/images/${imageId}`,
      {
        method: "DELETE"
      }
    );

    const data = await response.json();

    setCollections((currentCollections) =>
      currentCollections.map((collection) => {
        if (collection.id === collectionId) {
          // Keep images that are not the image we want deleted
          return {
            ...collection,
            images: collection.images.filter(
              (image) => image.id !== imageId
            )
          };
        }

        return collection;
      })
    );
  };

  const searchImages = async () => {
    const response = await fetch(
      // Makes the searchTerm a safe string for URL
      `http://localhost:3000/api/search?q=${encodeURIComponent(searchTerm)}`
    );

    const data = await response.json();

    setSearchResults(data.hits);
  };

  const shareCollection = async (collectionId) => {
    const response = await fetch(
      `http://localhost:3000/api/collections/${collectionId}/share`,
      {
        method: "POST"
      }
    );

    const data = await response.json();

    const newShareUrl = `${window.location.origin}/?share=${data.shareId}`;

    console.log(newShareUrl);

    setShareUrl(newShareUrl);
  }

  const copyShareLink = async () => {
    // Once sharelink copied, change text to show "Copied!"
    await navigator.clipboard.writeText(shareUrl);

    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  // RENDER UI
  return (
    <div className="app">
      <header className="header">
        <h1>My Image Boards</h1>
        <p>Search, save, and share your favorite images.</p>
      </header>

      {/* Search Section */}
      <div className = "search-section">
        <h2>Search Images</h2>

        <input
          type = "text"
          placeholder = "Search for images..."
          value = {searchTerm}
          onChange = {(event) => setSearchTerm(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              searchImages();
            }
          }}
        />

        <button onClick = {searchImages}>
          Search
        </button>

        {/* Search Results -- list the images from search */}
        <div className = "search-results">
          {searchResults.map((image) => (
            <div className = "image-card" key = {image.id}>
              <img
                src = {image.webformatURL}
                alt = {image.tags}
              />

              <div className = "image-card-content">
                <select
                  value = {selectedCollectionId}
                  // Convert event.target.value (String) to a number
                  onChange = {(event) => setSelectedCollectionId(Number(event.target.value))}>
                  
                  <option value = "">
                    Choose a collection
                  </option>

                  {collections.map((collection) => (
                    <option key = {collection.id} value = {collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>

                <button 
                  onClick = {() => saveImage(selectedCollectionId, image)}
                  disabled = {!selectedCollectionId}
                >
                  Save
                </button>

              </div>
            </div>
          ))}
        </div>
      </div>

      {/* My Collections Section */}
      <div className = "collections-section">
        <h1>My Collections</h1>

        <input
          type = "text"
          placeholder = "Collection name"
          value = {collectionName}
          onChange = {(event) => setCollectionName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              createCollection();
            }
          }}
        />

        <button onClick = {createCollection}>
          Create Collection
        </button>
        
        {/* List Collection */}
        <div className = "collection-list">
          {collections.map((collection) => (
            <div className = "collection-card" key = {collection.id}>
              <button
                // If a collection is selected, then use selected CSS, otherwise keep normal CSS.
                className = {
                  selectedCollection?.id === collection.id 
                  ? "collection-button selected"
                  : "collection-button"
                }
                onClick={() => setSelectedCollection(collection)}
              >
                {collection.name}
              </button>
              
              <button onClick={() => shareCollection(collection.id)}>
                Share
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Display Images from Selected Collection */} 
      {selectedCollection && (
        <div className = "selected-collection">
          <h2>{selectedCollection.name}</h2>

          <div className = "saved-images">
            {selectedCollection.images.map((image) => (
              <div className = "saved-image" key = {image.id}>
                <img
                  src = {image.url}
                  alt = ""
                />

                <button onClick = {() => deleteImage(selectedCollection.id, image.id)}>
                  Delete
                </button>

              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sharing URL Popup */}
      {shareUrl && (
        <div className = "modal-overlay">
          <div className = "share-modal">
            <h2>Share your collection</h2>

            <p>Copy this link to share your collection:</p>

            <input
              type = "text"
              value = {shareUrl}
              readOnly
            />

            <button onClick = {copyShareLink}>
              {copied ? "✓ Copied!" : "Copy Link"}
            </button>

            <button onClick={() => setShareUrl("")}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* Show sharedCollection if status of sharedCollection is true */}
      {sharedCollection && (
        <div>
          <h2>Shared Collection</h2>

          <h3>{sharedCollection.name}</h3>

          <div className = "saved-images">
            {sharedCollection.images.map((image) => (
              <div className = "saved-image" key = {image.id}>
                <img
                  src = {image.url}
                  alt = ""
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default App;