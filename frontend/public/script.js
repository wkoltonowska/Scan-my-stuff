function submitBarcode() {
    const barcode = document.getElementById('barcode').value;
    
    // Walidacja, by sprawdzić, czy wpisano kod prawidłowo
    if (!barcode || barcode.length !== 13 || isNaN(barcode)) {
        alert('Proszę wpisać poprawny kod EAN (13 cyfr).');
        return;
    }

    // Przygotowanie danych do wysłania
    const requestData = {
        barcode: barcode,
        description: "Dodano z aplikacji webowej"
    };

    // Wysłanie kodu na serwer 
    fetch('https://scan-my-stuff-app.azurewebsites.net/barcode', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => { throw new Error(err.error); });
        }
        return response.json();
    })
    .then(data => {
        console.log('Odpowiedź z serwera:', data);
        alert('Kod został wysłany pomyślnie!');
        document.getElementById('barcode').value = '';
    })
    .catch(error => {
        console.error('Błąd:', error);
        alert('Wystąpił błąd podczas wysyłania kodu: ' + error.message);
    });
}

