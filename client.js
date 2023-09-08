const API_ENDPOINT = 'http://localhost:3000/thumbnail';

const fileInput = document.querySelector('#file-input');
const submitButton = document.querySelector('#submit');
const thumbnailPreview = document.querySelector('#thumbnail');
const errorDiv = document.querySelector('#error');

function showError(msg) {
    errorDiv.innerText = `ERROR: ${msg}`;
}

async function blobToDataURL(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.onabort = () => reject(new Error("Read aborted"));
        reader.readAsDataURL(blob);
    });
}

async function createThumbnail(video) {


    console.log('Video Array:', video);

    const payload = new FormData();

    video.forEach((ele, i) => {
      if (ele instanceof File) {
        payload.append(`image`, ele);
        console.log(`Appended video ${i + 1}`);
      } else {
        console.log(`Not a valid File object:`, ele);
        showError('Not a valid File object');
      }
    });

    console.log(video)

    const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        body: payload
    });

    if (!res.ok) {
        throw new Error('Creating thumbnail failed');
    }

    const thumbnailBlob = await res.blob();
    const thumbnail = await blobToDataURL(thumbnailBlob);

    return thumbnail;
}

submitButton.addEventListener('click', async () => {
    const { files } = fileInput;

    if (files.length > 0) {
        const file = files[0];
        console.log(files)

        let Data = [];
        for(let file of files){
            Data.push(file)
        }
        console.log(Data)

        try {
            const thumbnail = await createThumbnail(Data);
            console.log(thumbnail)
            thumbnailPreview.src = thumbnail;
        } catch(error) {
            showError(error);
        }
    } else {
        showError('Please select a file');
    }
});