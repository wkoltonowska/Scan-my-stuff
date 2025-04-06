require("dotenv").config();

const requiredEnvVars = ['COSMOS_DB_ENDPOINT', 'COSMOS_DB_KEY', 'COSMOS_DB_DATABASE', 'COSMOS_DB_CONTAINER'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ Brak wymaganej zmiennej środowiskowej: ${envVar}`);
    process.exit(1); // Zakończ aplikację, jeśli brakuje kluczowych zmiennych
  }
}

require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const { CosmosClient } = require("@azure/cosmos");



const express = require("express");
const bodyParser = require("body-parser");
const { CosmosClient } = require("@azure/cosmos");

const app = express();
const port = process.env.PORT || 3000;

// Połączenie z Azure Cosmos DB
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY,
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
const container = database.container(process.env.COSMOS_DB_CONTAINER);

app.use(bodyParser.json());

// ✅ **Strona główna API**
app.get("/", (req, res) => {
  res.send("🚀 Scan My Stuff API is running! Go to /barcodes to see stored data.");
});

// 🚀 **Dodanie nowego kodu kreskowego**
app.post("/barcode", async (req, res) => {
  try {
    const { barcode, description } = req.body;
    if (!barcode) return res.status(400).json({ error: "Barcode is required" });

    const item = { id: barcode, barcode, description: description || "No description" };
    const { resource } = await container.items.create(item);

    res.status(201).json({ message: "Barcode added", data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// 🔍 **Pobranie wszystkich kodów kreskowych**
app.get("/barcodes", async (req, res) => {
  try {
    const { resources } = await container.items.readAll().fetchAll();
    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✏️ **Aktualizacja kodu kreskowego**
app.put("/barcode/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const { resource } = await container.item(id, id).read();
    if (!resource) return res.status(404).json({ error: "Barcode not found" });

    resource.description = description || resource.description;
    await container.item(id, id).replace(resource);

    res.json({ message: "Barcode updated", data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ❌ **Usunięcie kodu kreskowego**
app.delete("/barcode/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await container.item(id, id).delete();
    res.json({ message: "Barcode deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ **Obsługa nieistniejących endpointów**
app.use((req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// 🚀 **Uruchomienie serwera**
app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`);
});
