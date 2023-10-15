const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/teacher', { useNewUrlParser: true, useUnifiedTopology: true });

const ClassSchema = new mongoose.Schema({
    value: String,
    students: [String]
});

const Class = mongoose.model('Class', ClassSchema, 'class');

io.on('connection', (socket) => {
    console.log('A user connected');

    // Event for student to join their personal room (based on roll number)
    socket.on('joinRollNumberRoom', (rollNumber) => {
        if(rollNumber) {
            socket.join(rollNumber);
            console.log(`User with roll number ${rollNumber} has joined their room.`);
        }
    });

    // Event to send data to all students of a specific class (based on the provided batch)
    socket.on('sendMessageToClass', async ({ batch, data }) => {
        const classData = await Class.findOne({ value: batch });

        if(classData && classData.students && classData.students.length > 0) {
            classData.students.forEach(studentRollNumber => {
                io.to(studentRollNumber).emit('receiveMessage', data);
            });
            console.log(`Data sent to students of batch ${batch}.`);
        } else {
            console.log(`No students found for batch ${batch} or batch not found.`);
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(3005, () => {
    console.log('listening on *:3005');
});
