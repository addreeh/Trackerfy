const path = require("path")
const fastify = require('fastify')({
    logger: true
})
const port = process.env.PORT || 3000;


let playlistUrl = ''; // Variable para almacenar la URL

const {
    getArtistsImage,
    generateMatrix,
    getPlaylist,
} = require('./functions');
const { log } = require("console");

fastify.register(require('@fastify/static'), {
    root: path.join(__dirname, 'public'),
    prefix: '/'
})

fastify.get('/', (request, reply) => {
    reply.sendFile('index.html')
})

fastify.get('/playlist', (request, reply) => {
    reply.sendFile('playlist.html')
})

fastify.get('/indexdata', async function (request, reply) {
    try {
        const { first17Artists, restOfArtists } = await getArtistsImage();
        const matriz1 = generateMatrix(7, 5, first17Artists);
        const matriz2 = generateMatrix(2, 5, restOfArtists);

        reply.send({ matriz1, matriz2 });
    } catch (error) {
        reply.status(500).send({ error: 'Error obteniendo datos' });
    }
})

fastify.post('/submitPlaylist', async function (request, reply) {
    try {
        playlistUrl = request.body.urlInput;
        reply.send({ message: 'Información de la lista de reproducción recibida correctamente.' });
    } catch (error) {
        reply.status(500).send({ error: 'Error al procesar la información de la lista de reproducción' });
    }
});


fastify.get('/playlistdata', async (request, reply) => {
    try {
        const data = await getPlaylist(playlistUrl);
        reply.send({
            playlistInfo: data.playlistInfo,
            detailedArtistInfo: data.detailedArtistInfo,
        });
    } catch (error) {
        fastify.log.error('Error en la ruta /playlist:', error);
        reply.status(500).send({ error: 'Error obteniendo la información de la playlist' });
    }
});

fastify.listen({ port }, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})