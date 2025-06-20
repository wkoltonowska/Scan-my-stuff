
require("dotenv/lib/main").config();

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
  process.exit(1);
});

console.log("Uruchamianie aplikacji. Zmienne środowiskowe:");
console.log({
  port: process.env.PORT,
  COSMOS_ENDPOINT: process.env.COSMOS_DB_ENDPOINT ? "OK" : "MISSING",
  COSMOS_KEY: process.env.COSMOS_DB_KEY ? "OK" : "MISSING"
});

//Weryfikacja, czy są kluczowe zmienne
const requiredEnvVars = ['COSMOS_DB_ENDPOINT', 'COSMOS_DB_KEY', 'COSMOS_DB_DATABASE', 'COSMOS_DB_CONTAINER'];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(` Brak wymaganej zmiennej środowiskowej: ${envVar}`);
    process.exit(1); 
  }
}


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

// Strona główna API
app.get("/", (req, res) => {
  res.send("Aplikacja Scan My Stuff działa - sprawdź dane pod /barcodes.");
});

// Dodanie nowego kodu kreskowego
app.post("/barcode", async (req, res) => {
  try {
    const { barcode, description } = req.body;
    if (!barcode) return res.status(400).json({ error: "Kod kreskowy jest wymagany" });

    const item = { id: barcode, barcode, description: description || "Brak opisu" };
    const { resource } = await container.items.create(item);

    res.status(201).json({ message: "Kod kreskowy został dodany", data: resource });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Błąd serwera" });
  }
});

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

// Obsługa nieistniejących endpointów
app.use((req, res) => {
  res.status(404).json({ error: "Nie znaleziono" });
});

// Uruchomienie serwera
app.listen(port, '0.0.0.0', () => {
  console.log(`Serwer uruchomiony (kompatybilny z Azure)`);
}).on('error', (err) => {
  console.error('BŁĄD SERWERA', err);
});
