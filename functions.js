require('dotenv').config();
const { removeBackground } = require("@imgly/background-removal-node");
const Vibrant = require('node-vibrant');
const SpotifyWebApi = require('spotify-web-api-node');
const imgbbUploader = require("imgbb-uploader");

const { CLIENT_ID, CLIENT_SECRET } = process.env;

const spotifyApi = new SpotifyWebApi({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
});

function isWhiteColor(vibrantColor) {
    const red = parseInt(vibrantColor.substring(1, 3), 16);
    const green = parseInt(vibrantColor.substring(3, 5), 16);
    const blue = parseInt(vibrantColor.substring(5, 7), 16);

    return red === 255 && green === 255 && blue === 255;
}

async function getVibrantColor(imageUrl) {
    return new Promise((resolve, reject) => {
        Vibrant.from(imageUrl).getPalette((err, palette) => {
            if (err) {
                reject(err);
            } else {
                const vibrantColor = palette.Vibrant ? palette.Vibrant.getHex() : null;
                resolve(vibrantColor);
            }
        });
    });
}

function getArtistsImage() {
    return new Promise((resolve, reject) => {
        spotifyApi.clientCredentialsGrant().then(
            function (data) {
                console.log('The access token expires in ' + data.body['expires_in']);
                console.log('The access token is ' + data.body['access_token']);

                spotifyApi.setAccessToken(data.body['access_token']);

                let ids = ["53XhwfbYqKCa1cC15pYq2q", "1Xyo4u8uXC1ZmMpatF05PJ", "06HL4z0CvFAxyc27GXpf02", "4q3ewBCX7sLwd24euuV69X", "246dkjvS1zLTtiykXe5h60", "7dGJo4pcD2V6oG8kP0tJRR", "3TVXtAsR1Inumwj472S9r4", "1uNFoZAHBGtllmzznpCI3s", "1bAftSH8umNcGZ0uyV7LMg", "2LRoIwlKmHjgvigdNGBHNo", "716NhGYqD1jl2wI1Qkgq36", "52iwsT98xCoGgiGntTiR7K", "1vCWHaC5f2uS3yhpwWbIA6", "224rbIjYbXaTI7lnP2ZMNJ", "1DxLCyH42yaHKGK3cl5bvG", "0jeYkqwckGJoHQhhXwgzk3", "0Y5tJX1MQlPlqiwlOH1tJY", "7uXKIO6VDeOCo6ImWZpZJn", "0DjGDEVSQsodFbL1bMVPRs", "5Uox3n7m4W2CoM9MmHPJwQ", "2UZIAOlrnyZmyzt1nuXr9y", "3vQ0GE3mI0dAaxIMYe5g7z", "0Q8NcsJwoCbZOHHW63su5S", "2O8vbr4RYPpk6MRA4fio7u"]

                spotifyApi.getArtists(ids)
                    .then(function (data) {
                        const artistsData = data.body.artists.map(artist => {
                            return {
                                name: artist.name,
                                image: artist.images[0].url
                            };
                        });

                        // Dividir los artistas en dos conjuntos
                        const first17Artists = artistsData.slice(0, 17);
                        const restOfArtists = artistsData.slice(17);

                        // Devolver ambos conjuntos de datos
                        resolve({ first17Artists, restOfArtists });
                    })
                    .catch(reject);
            })
            .catch(reject);
    });
}


function generateMatrix(rows, cols, artistsData) {
    let cont = 0;
    const matriz = [];
    for (let i = 0; i < rows; i++) {
        const fila = [];
        for (let j = 0; j < cols; j++) {
            if (i % 2 === 0) {
                fila.push(j % 2 === 0 ? 'vacio' : artistsData[cont++]);
            } else {
                fila.push(j % 2 === 0 ? artistsData[cont++] : 'vacio');
            }
        }
        matriz.push(fila);
    }
    return matriz;
}

async function performBackgroundRemoval(imagePath) {
    try {
        const resultBlob = await removeBackground(imagePath);
        const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

        const base64String = resultBuffer.toString('base64');

        const options = {
            apiKey: process.env.IMGBB_API_KEY, // MANDATORY
            expiration: 300,
            base64string: base64String, // OPTIONAL: pass an URL to imgBB (max 32Mb)
        };

        return imgbbUploader(options)
            .then((response) => {
                return response.display_url;
            })
            .catch((error) => {
                console.error(error);
                return imagePath;
            });
    } catch (error) {
        console.error("Error al intentar eliminar el fondo:", error);
        throw error;
    }
}


// async function performBackgroundRemoval(imagePath) {
//     try {
//         const resultBlob = await removeBackground(imagePath);
//         const resultBuffer = Buffer.from(await resultBlob.arrayBuffer());

//         let tempDir = path.join(__dirname, 'public');
//         tempDir = path.join(tempDir, 'temp');
//         console.log(tempDir);

//         await fs.mkdir(tempDir, { recursive: true });

//         const timestamp = new Date().toISOString().replace(/:/g, '_');
//         const tempImagePath = path.join(tempDir, `imagen_${timestamp}.png`);
//         console.log(tempImagePath);

//         await fs.writeFile(tempImagePath, resultBuffer);

//         return {
//             imagePath: `temp/imagen_${timestamp}.png`,
//         };
//     } catch (error) {
//         console.error("Error al intentar eliminar el fondo:", error);
//         throw error;
//     }
// }

function getPlaylist(url) {
    const tracksInfo = []

    return new Promise((resolve, reject) => {
        function getDuration(milisegundos) {
            const horas = Math.floor(milisegundos / 3600000);
            const minutos = Math.floor((milisegundos % 3600000) / 60000);
            const segundos = Math.floor((milisegundos % 60000) / 1000);

            return {
                horas,
                minutos,
                segundos
            };
        }

        function getPlaylistId(url) {
            const expresionRegular = /playlist\/([a-zA-Z0-9]+)/;
            const coincidencia = url.match(expresionRegular);

            if (coincidencia && coincidencia[1]) {
                return coincidencia[1];
            } else {
                return null;
            }
        }

        spotifyApi.clientCredentialsGrant().then(
            function (data) {
                spotifyApi.setAccessToken(data.body['access_token']);

                spotifyApi.getPlaylist(getPlaylistId(url))
                    .then(async function (data) {
                        // Obtén el color vibrante de la imagen de la playlist
                        const vibrantColor = await getVibrantColor(data.body.images[0].url);
                        const isWhite = isWhiteColor(vibrantColor);

                        let textColor = ""

                        if (isWhite) {
                            textColor = "#000000";
                        } else {
                            textColor = "FFFFFF";
                        }


                        playlistInfo = {
                            name: data.body.name,
                            description: data.body.description,
                            url: data.body.external_urls.spotify,
                            image: data.body.images[0].url,
                            imagePng: "",
                            color: vibrantColor,
                            text: textColor,
                            owner: {
                                name: data.body.owner.display_name,
                                url: data.body.owner.external_urls.spotify
                            },
                            followers: data.body.followers.total,
                            totalSongs: data.body.tracks.total,
                            totalDuration: 0
                        };
                    }, function (err) {
                        reject('Something went wrong while getting playlist information: ' + err);
                    });

                let offset = 0;
                let totalDuration = 0;

                function getPlaylistTracksRecursive(offset) {
                    spotifyApi.getPlaylistTracks(getPlaylistId(url), {
                        offset: offset,
                        limit: 100
                    }).then(
                        async function (data) {
                            let tracks = data.body.items;
                            let cont = offset;

                            if (tracks.length > 0) {
                                tracks.forEach(async (element, index) => {
                                    if (element.track && element.track.name) {
                                        const artistInfoArray = [];

                                        let artists = element.track.artists;
                                        artists.forEach(artist => {
                                            artistInfoArray.push({
                                                id: artist.id,
                                                name: artist.name
                                            });
                                        });

                                        const imageUrl = element.track.album.images[0] && element.track.album.images[0].url ? element.track.album.images[0].url : 'images/album.jpg';

                                        let trackInfo = {
                                            name: element.track.name,
                                            duration_ms: element.track.duration_ms,
                                            url: element.track.external_urls.spotify,
                                            album: {
                                                name: element.track.album.name,
                                                url: element.track.album.external_urls.spotify,
                                                image: imageUrl
                                            },
                                            preview_url: element.track.preview_url,
                                            artists: artistInfoArray
                                        };

                                        tracksInfo.push(trackInfo);

                                        totalDuration += element.track.duration_ms;
                                        cont++;
                                    }
                                });

                                getPlaylistTracksRecursive(offset + 100);
                            } else {
                                const uniqueArtists = new Set();

                                tracksInfo.forEach(track => {
                                    track.artists.forEach(artist => {
                                        if (artist && artist.id) {
                                            uniqueArtists.add(artist);
                                        }
                                    });
                                });

                                const uniqueArtistsArray = Array.from(uniqueArtists);
                                const fullArtists = [];

                                function getArtistsInfoInChunks(startIndex) {
                                    const chunkSize = 50;
                                    const endIndex = Math.min(startIndex + chunkSize, uniqueArtistsArray.length);

                                    const chunkOfArtists = uniqueArtistsArray.slice(startIndex, endIndex);

                                    return spotifyApi.getArtists(chunkOfArtists.map(artist => artist.id))
                                        .then(function (data) {
                                            data.body.artists.forEach(artist => {
                                                fullArtists.push(artist);
                                            });

                                            if (endIndex < uniqueArtistsArray.length) {
                                                return getArtistsInfoInChunks(endIndex);
                                            }
                                        })
                                        .catch(function (err) {
                                            console.error('Error getting artists information:', err);
                                            reject('Error getting artists information: ' + err);
                                        });
                                }

                                getArtistsInfoInChunks(0)
                                    .then(async () => {
                                        const totalSongs = tracksInfo.length;
                                        const detailedArtistInfo = {};

                                        fullArtists.forEach(artist => {
                                            const artistSongs = tracksInfo.filter(track => track.artists.some(a => a.id === artist.id));
                                            const percentage = (artistSongs.length / totalSongs) * 100;

                                            // Check if the artist has an image and the 'url' property is defined
                                            const imageUrl = artist.images[0] && artist.images[0].url ? artist.images[0].url : 'images/avatar.webp';

                                            detailedArtistInfo[artist.id] = {
                                                artist: {
                                                    name: artist.name,
                                                    url: artist.external_urls.spotify,
                                                    image: imageUrl,
                                                    followers: artist.followers.total
                                                },
                                                songs: artistSongs,
                                                percentage: percentage.toFixed(2)
                                            };
                                        });

                                        const sortedDetailedArtistInfo = Object.entries(detailedArtistInfo)
                                            .sort(([, a], [, b]) => b.percentage - a.percentage)
                                            .reduce((acc, [key, value]) => {
                                                acc[key] = value;
                                                return acc;
                                            }, {});

                                        // Perform background removal on the artist's image for the first artist
                                        const firstArtistId = Object.keys(sortedDetailedArtistInfo)[0];
                                        const firstArtist = sortedDetailedArtistInfo[firstArtistId];

                                        if (firstArtist && firstArtist.artist && firstArtist.artist.image) {
                                            try {
                                                const removalResult = await performBackgroundRemoval(firstArtist.artist.image);
                                                // Convert the background-removed image to a data URI

                                                // Replace the artist's image with the data URI
                                                firstArtist.artist.imagePng = removalResult;
                                            } catch (error) {
                                                console.error('Error performing background removal on artist image:', error);
                                            }
                                        }

                                        playlistInfo.totalDuration = getDuration(totalDuration)
                                        resolve({
                                            playlistInfo: playlistInfo,
                                            detailedArtistInfo: sortedDetailedArtistInfo
                                        });
                                    })
                                    .catch(function (err) {
                                        console.error('Error getting artists information:', err);
                                        reject('Error getting artists information: ' + err);
                                    });
                            }
                        },
                        function (err) {
                            console.error('Something went wrong:', err);
                            reject('Error getting playlist tracks: ' + err);
                        }
                    );
                }

                getPlaylistTracksRecursive(offset);
            },
            function (err) {
                console.error('Something went wrong when retrieving an access token', err);
                reject('Error retrieving access token: ' + err);
            }
        );
    });
}

// Exportar funciones para ser utilizadas en otros archivos
module.exports = {
    getArtistsImage,
    generateMatrix,
    getPlaylist
};