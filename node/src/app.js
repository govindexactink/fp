const express = require('express');
const categoryRouter = require('./routes/categoryRoute');
const taskRouter = require('./routes/taskRoute');
const errorHandler = require('./middleware/errorMiddleware');
const app = express();
const cors = require('cors');
const userRouter = require('./routes/userRoutes');

app.use(cors({
    origin: 'http://localhost:4200' || '*'
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    console.log('node working');
});

app.get('/health', (req, res) => {
    return console.log('health working');
});

app.use('/v1/category', categoryRouter);
app.use('/v1/task', taskRouter);
app.use('/v1/user', userRouter);

app.use(errorHandler);

module.exports = app;
