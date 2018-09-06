const express = require("express");
const app = express();
const path = require("path");
const port = process.env.PORT || 8080;
const cors = require("cors");

app.use(cors());
app.use("/", express.static(path.join(__dirname, "dist")));

app.listen(port, () => console.info("server listening on port", port));
