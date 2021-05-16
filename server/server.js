require('dotenv').config();
const app = require("express")();
const server = require("http").createServer(app);
const mongoose = require('mongoose');
const Document = require('./Document');

mongoose.connect(process.env.DB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
    useCreateIndex: true,
});

const PORT = process.env.PORT || 5000;

const io = require('socket.io')(server, {
    cors: {
        origin: process.env.ORIGIN,
        methods: ['GET', 'POST'],
    },
});

const defaultValue = '';

io.on("connection", socket => {
    socket.on('get-document', async documentId => {
        const document = await findOrCreatedocument(documentId);
        socket.join(documentId);
        socket.emit('load-document', document.data);

        socket.on('send-changes', delta => {
            socket.broadcast.to(documentId).emit('receive-changes', delta);
        });
        socket.on('save-document', async data => {
            await Document.findByIdAndUpdate(documentId, { data });
        });
    });
});

async function findOrCreatedocument(id) {
    if(id == null) return;

    const document = await Document.findById(id);
    if(document) return document;
    return await Document.create({_id: id, data: defaultValue});

}

server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));