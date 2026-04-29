import { ENV } from "./config/env";

const app = require("./app")

const PORT = ENV.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});