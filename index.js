const express = require('express')
const multer = require('multer')
const path = require('path')
const { BlobServiceClient, } = require("@azure/storage-blob");
const { v4: uuidv4 } = require("uuid");
const fs = require('fs')

require('dotenv').config()

const app = express()
app.use(express.json())

const fileStorageEngine = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads')
    },
    filename: (req, file, cb) => {
        cb(null, path.parse(file.originalname).name + '-' + Date.now() + path.parse(file.originalname).ext)
    }
})

const upload = multer({
    storage: fileStorageEngine,
    limits: {
        fileSize: 1024 * 1024 * 1024
    },
    // fileFilter: (req, file, cb) => {
    //     if (file.mimetype === 'text/csv') {
    //         cb(null, true)
    //     } else {
    //         cb(null, false)
    //     }
    // }
})

const progessMiddleware = (req, res, next) => {
    let progress = 0;
    const fileSize = req.headers['content-length'];

    req.on('data', (chunk) => {
        progress += chunk.length;
        console.log(`${(progress / fileSize) * 100}%`);
    })

    next()
}

app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.post('/upload', progessMiddleware, upload.single('csvfile'), (req, res) => {
    res.json({
        message: 'File uploaded successfully'
    })
})

app.get('/getContainerFiles', async (req, res) => {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw Error("Azure Storage Connection string not found");
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerName = "testingcsv"
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const filesInContainer = []
    for await (const blob of containerClient.listBlobsFlat()) {
        filesInContainer.push(blob.name)
    }

    res.json({
        files: filesInContainer,
        count: filesInContainer.length
    })
})

async function streamToText(readable) {
    readable.setEncoding('utf8');
    let data = '';
    for await (const chunk of readable) {
        data += chunk;
    }
    return data;
}

app.post('/getFileContent', async (req, res) => {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw Error("Azure Storage Connection string not found");
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerName = "testingcsv"
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobName = req.body.blobName

    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    console.log(await streamToText(downloadBlockBlobResponse.readableStreamBody));

    res.json({
        message: 'File downloaded successfully'
    })
})

app.get('/uploadToContianer', async (req, res) => {
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  
    if (!AZURE_STORAGE_CONNECTION_STRING) {
        throw Error("Azure Storage Connection string not found");
    }
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerName = "testingcsv"
    const containerClient = blobServiceClient.getContainerClient(containerName);
    
    const blobName = req.body.blobName
    
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    const data = fs.readFileSync(`./uploads/${blobName}`, 'utf8');
    const uploadBlobResponse = await blockBlobClient.upload(data, data.length);
    console.log(
        "Blob was uploaded successfully. requestId: ",
        uploadBlobResponse.requestId
    );

    res.json({
        message: 'File uploaded successfully'
    })
})

app.listen(3000, () => {
    console.log('listening on port 3000')
})