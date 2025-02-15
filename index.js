const express = require('express')
const bodyparser = require('body-parser')
const cors = require('cors')
const userRoute = require("./routes/userRoute");

const app = express()

app.use(express.json());
app.use(bodyparser.json())
app.use(cors())

const port = 4000; //8000

app.use("/api", userRoute);

app.listen(port, (req, res) => {
    console.log('API Listening On Port ' + port)
}) 