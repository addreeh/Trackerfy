require('dotenv').config();
const path = require("path")

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;


let playlistUrl = ''; // Variable para almacenar la URL

const {
    getArtistsImage,
    generateMatrix,
    getPlaylist,
} = require('./functions');


// Configura middleware para manejar datos JSON
app.use(express.json());
// Configura el directorio de archivos estáticos (para servir el HTML y otros recursos)
app.use(express.static('public'));

// Endpoint para servir el archivo HTML en la ruta '/'
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'public') });
})

// Endpoint para servir el archivo HTML en la ruta '/'
app.get('/playlist', (req, res) => {
    res.sendFile('playlist.html', { root: path.join(__dirname, 'public') });
})

app.get('/indexdata', async function (req, res) {
    try {
        const { first17Artists, restOfArtists } = await getArtistsImage();
        const matriz1 = generateMatrix(7, 5, first17Artists);
        const matriz2 = generateMatrix(2, 5, restOfArtists);

        res.send({ matriz1, matriz2 });
    } catch (error) {
        res.status(500).send({ error: 'Error obteniendo datos' });
    }
})

app.post('/submitPlaylist', async function (req, res) {
    try {
        playlistUrl = req.body.urlInput;
        res.send({ message: 'Información de la lista de reproducción recibida correctamente.' });
    } catch (error) {
        res.status(500).send({ error: 'Error al procesar la información de la lista de reproducción' });
    }
});


app.get('/playlistdata', async (req, res) => {
    try {
        const data = await getPlaylist(playlistUrl);
        res.send({
            playlistInfo: data.playlistInfo,
            detailedArtistInfo: data.detailedArtistInfo,
        });
    } catch (error) {
        app.log.error('Error en la ruta /playlist:', error);
        res.status(500).send({ error: 'Error obteniendo la información de la playlist' });
    }
});

app.listen(port, () => {
    console.log(`Servidor escuchando en http://localhost:${port}`);
});

module.exports = app;

