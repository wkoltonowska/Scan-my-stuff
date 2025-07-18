
require("dotenv").config();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

console.log("Uruchamianie aplikacji. Zmienne środowiskowe:");
console.log({
  port: process.env.PORT,
  COSMOS_ENDPOINT: process.env.COSMOS_DB_ENDPOINT ? "OK" : "BRAK",
  COSMOS_KEY: process.env.COSMOS_DB_KEY ? "OK" : "BRAK"
});

const PORT = process.env.PORT || 8080;


//Weryfikacja, czy są wprowadzone kluczowe zmienne
const requiredEnvVars = ['COSMOS_DB_ENDPOINT', 'COSMOS_DB_KEY', 'COSMOS_DB_DATABASE', 'COSMOS_DB_CONTAINER'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(` Brak wymaganej zmiennej środowiskowej: ${envVar}`);
    process.exit(1); 
  }
}


const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const { CosmosClient } = require("@azure/cosmos");

const app = express();

app.use(cors({
  origin: 'http://localhost:8080', 
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.options('*', cors());

// Połączenie z Azure Cosmos DB
const cosmosClient = new CosmosClient({
  endpoint: process.env.COSMOS_DB_ENDPOINT,
  key: process.env.COSMOS_DB_KEY,
});

const database = cosmosClient.database(process.env.COSMOS_DB_DATABASE);
const container = database.container(process.env.COSMOS_DB_CONTAINER);

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

const pathFrontend = path.join(__dirname, 'public');

app.use(bodyParser.json());
app.use(express.static(pathFrontend));


// Serwowanie statycznych plików z folderu public
app.use(express.static(pathFrontend));

// Domyślna ścieżka '/' będzie serwować index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(pathFrontend, 'index.html'));
});


// Dodanie nowego kodu kreskowego
app.post("/barcode", async (req, res) => {
  try {
    const { barcode, description } = req.body;
    if (!barcode) return res.status(400).json({ error: "Kod kreskowy jest wymagany" });

    const item = { id: uuidv4(), barcode, description: description || "Brak opisu" };
    const { resource } = await container.items.create(item);

    res.status(201).json({ message: "Kod kreskowy został dodany", data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: JSON.stringify(error) });
  }
});

app.get('/debug', (req, res)=>{
  res.send(pathFrontend)
})

// Pobranie wszystkich kodów kreskowych
app.get("/barcodes", async (req, res) => {
  try {
    const { resources } = await container.items.readAll().fetchAll();
    res.json(resources);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// Aktualizacja kodu kreskowego
app.put("/barcode/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { description } = req.body;

    const { resource } = await container.item(id, id).read();
    if (!resource) return res.status(404).json({ error: "Kod kreskowy nie znaleziony" });

    resource.description = description || resource.description;
    await container.item(id, id).replace(resource);

    res.json({ message: "Kod kreskowy zaktulaizowany", data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// Usunięcie kodu kreskowego
app.delete("/barcode/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await container.item(id, id).delete();
    res.json({ message: "Kod kreskowy został usunięty" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

// Zliczanie ile produktów ma dany kod kreskowy
app.get("/barcode/:barcode/count", async (req, res) => {
  try {
    const { barcode } = req.params;

    const querySpec = {
      query: "SELECT VALUE COUNT(1) FROM c WHERE c.barcode = @barcode",
      parameters: [
        { name: "@barcode", value: barcode }
      ]
    };

    const { resources } = await container.items.query(querySpec).fetchAll();
    const count = resources[0] || 0;

    res.json({ barcode, count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});




// Obsługa nieistniejących endpointów
app.use((req, res) => {
  res.status(404).json({ error: "Nie znaleziono" });
});


