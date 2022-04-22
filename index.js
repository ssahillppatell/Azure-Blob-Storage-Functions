const express = require('express')
const multer = require('multer')
const path = require('path')

const app = express()

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

app.listen(3000, () => {
    console.log('listening on port 3000')
})