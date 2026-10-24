import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to PawPath Backend API!",
  });
});

app.listen(PORT, () => {
  console.log(`PawPath server is running on port ${PORT}`);
});