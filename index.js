const express = require('express');
const path = require('path');
const {connectToMongoDB} = require("./dbconnect");
const urlRoute = require("./routes/url");
const staticRoute = require('./routes/staticRouter');
const URL = require('./model/url');
const dotenv = require('dotenv');
dotenv.config();

const app = express();

const MONGODB_URI = process.env.MONGODB_URI;
const PORT = process.env.PORT || 8001;

connectToMongoDB(MONGODB_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch((error) => console.error('MongoDB Connection Error:', error));

app.set("view engine", "ejs");
app.set("views", path.resolve("./views"));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/url", urlRoute);
app.use("/", staticRoute);

app.get("/url/:shortId", async (req, res) => {
    const shortId = req.params.shortId;
    try {
        const entry = await URL.findOneAndUpdate(
            {
                shortId,
            },
            {
                $push: {
                    visitHistory: {
                        timestamps: Date.now(),
                    },
                },
            },
        );
        if (entry && entry.redirectURL) {
            res.redirect(entry.redirectURL);
        } else {
            // Handle the case when entry is null or redirectURL is not defined
            res.status(404).send("URL not found");
        }
    } catch (error) {
        console.error("Error finding URL:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.listen(PORT, () => console.log(`Server started at PORT ${PORT}`));