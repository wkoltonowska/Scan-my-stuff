// const express = require('express');
// const bodyParser = require('body-parser');
// const path = require('path');

// const app = express();
// const PORT = process.env.PORT || 3000;

// app.use(bodyParser.json());
// app.use(express.static(path.join(__dirname, 'public')));

// // Przyjęcie i walidacja kodów EAN
// app.post('/api/barcode', (req, res) => {
//     const { barcode } = req.body;

//     if (!barcode || barcode.length !== 13 || isNaN(barcode)) {
//         return res.status(400).json({ 
//             error: 'Proszę wpisać poprawny kod EAN (13 cyfr).' 
//         });
//     }

//     console.log('Odebrano kod EAN:', barcode);

//     res.json({ 
//         status: 'success', 
//         message: 'Kod został pomyślnie zapisany.',
//         barcode: barcode
//     });
// });

// // Serwowanie plików statycznych
// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname, 'public', 'index.html'));
// });

// // Uruchomienie serwera
// app.listen(PORT, () => {
//     console.log(`Serwer działa na http://localhost:${PORT}`);
// });