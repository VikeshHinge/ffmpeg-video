import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { createFFmpeg } from '@ffmpeg/ffmpeg';



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

// app.use((req, res, next) => {
//     console.log('start---')
//     res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
//     next();
//   });


const port = 3000;

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 100 * 1024 * 1024 }
});

app.get('/',async(req,res)=>{

    try{
        console.log('get----')
      res.render('./views/test.ejs')
    }catch(err){
        res.send({err})
    }
})

app.post('/thumbnail', upload.array('image'), async (req, res) => {


    try {
        const videoData = req.files.buffer;

        const ffmpeg = await getFFmpeg();


        const inputFileName = `input-video`;
        const outputFileName = `output.mp4`;
        let outputData = null;

        let {files} = req;

        console.log(files)
        
        files.forEach((file,i)=>{
            console.log(file.buffer,'-------',i)
            ffmpeg.FS('writeFile', `inputFileName${i}`, file.buffer);
        })

   
       // ffmpeg.FS('writeFile', inputFileName, videoData);

        await ffmpeg.run(
            "-loop", "1" ,"-t", "5",
            "-i",
            "inputFileName0",
            "-loop", "1" ,"-t", "5",
            "-i",
            "inputFileName1",
            "-loop", "1" ,"-t", "5",
            "-i",
            "inputFileName2",
            "-loop", "1" ,"-t", "5",
            "-i",
            "inputFileName3",
            "-loop", "1" ,"-t", "5",
            "-i",
            "inputFileName4",
            "-filter_complex",
            "[0:v]scale=480:800[s0];[1:v]scale=480:800[s1];[2:v]scale=480:800[s2];[3:v]scale=480:800[s3];[4:v]scale=480:800[s4];[s0][s1]xfade=transition=fade:duration=0.5:offset=2.5[f0];[f0][s2]xfade=transition=fade:duration=0.5:offset=5[f1];[f1][s3]xfade=transition=pixelize:duration=0.5:offset=7.5[f2];[f2][s4]xfade=transition=circleopen:duration=0.5:offset=10[f3]",
            "-map", "[f3]","-r", "24", "-pix_fmt", "yuv420p","-vcodec", "libx264",
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