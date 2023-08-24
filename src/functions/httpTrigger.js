const { app } = require('@azure/functions');
const imagemin = require('imagemin');
const imageminGuetzli = require('imagemin-guetzli');
const { promises: fs } = require('fs-extra');
const path = require('path');
const sharp = require('sharp');

app.http('httpTrigger', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);
        const sizes = [360, 390, 480, 600, 750, 800, 1200];
        const directoryPath = path.join(__dirname, '../../');

        const compressImage = async (i) => {
            await imagemin([`${directoryPath}images/2-resized/${i}`], {
                destination: 'images/3-processed',
                plugins: [
                    imageminGuetzli({ quality: 85 })
                ]
            });
            console.log(`${i} processed`);
        };

        const resizeImage = (i, w) => {
            try {
                let extension = path.parse(path.basename(i)).ext;
                let fileName  = path.parse(path.basename(i)).name;
                const image = sharp(`${directoryPath}images/1-to-process/${i}`);
                image
                    .resize({ width: w })
                    .toBuffer()
                    .then( data => {
                        const newName = `${fileName}-${w}${extension}`;
                        fs.writeFile(`${directoryPath}images/2-resized/${newName}`, data, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        }).then(x => {
                            compressImage(newName);
                        }).catch(err => {
                            debugger;
                        });
                    });
            } catch (err) {
                console.log(err);
            }
        };

        const readImages = async () => {
            let files = await fs.readdir(`${directoryPath}images/1-to-process`);
            for await (const img of files) {
                for await (const item of sizes) {
                    resizeImage(img, item);
                }
            }
        };

        const images = await readImages();


        return { body: `Processing images` };
    }
});