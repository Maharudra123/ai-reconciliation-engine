require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 AI Reconciliation Backend running on http://localhost:${PORT}`,
  );
});
