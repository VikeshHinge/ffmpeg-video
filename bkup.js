
const express = require('express');
const cors = require ('cors');
const multer = require('multer');
const {createFFmpeg} = require ('@ffmpeg/ffmpeg');


const ffmpegInstance = createFFmpeg({ log: true });
let ffmpegLoadingPromise = ffmpegInstance.load();

async function getFFmpeg() {
    if (ffmpegLoadingPromise) {
        await ffmpegLoadingPromise;
        ffmpegLoadingPromise = undefined;
    }
    return ffmpegInstance;
}


const app = express();
app.use(cors());
app.set('view engine', 'ejs');

app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    next();
  });


const port = 8085;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});




app.get('/',async(req,res)=>{
    try{
        res.render('index.ejs', { message: 'Hello, EJS!' });
    }catch(err){
        res.send({err})
    }
})

app.post('/', upload.array('image'), async(req, res) => {

    //console.log(req.files)

    try {
        // const videoData = req.files.buffer;
        // console.log({videoData});

        const ffmpeg = await getFFmpeg();

        const inputFileName = `input-video`;
        const outputFileName = `output.mp4`;
        let outputData = null;

        let { files } = req;


        files.forEach((file, i) => {
            ffmpeg.FS('writeFile', `inputFileName${i}`, file.buffer);
        })
         
        // ffmpeg.FS('writeFile', inputFileName, videoData);

        await ffmpeg.run(
            "-loop", "1", "-t", "5",
            "-i",
            "inputFileName0",
            "-loop", "1", "-t", "5",
            "-i",
            "inputFileName1",
            "-filter_complex",
            "[0:v]scale=480:800[s0];[1:v]scale=480:800[s1];[s0][s1]xfade=transition=fade:duration=0.5:offset=2.5[f3]",
            "-map", "[f3]", "-r", "24", "-pix_fmt", "yuv420p", "-vcodec", "libx264",
             outputFileName
        );

        outputData = ffmpeg.FS('readFile', outputFileName);
        // ffmpeg.FS('unlink', inputFileName);
        ffmpeg.FS('unlink', outputFileName);

        res.writeHead(200, {
            'Content-Type': 'video/mp4',
            'Content-Disposition': `attachment;filename=${outputFileName}`,
            'Content-Length': outputData.length
        });
        res.end(Buffer.from(outputData, 'binary'));

    }
    catch (error) {
        console.error(error);
        res.sendStatus(500);
    }

});


app.listen(port, () => {
    console.log(`[info] ffmpeg-api listening at http://localhost:${port}`)
});