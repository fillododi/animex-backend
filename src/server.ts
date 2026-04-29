import { createApp } from "./app";
import { ENV } from "./config/env";
import { loadAnimalCatalog } from "./services/animalCatalog.service";

async function main() {
    const app = createApp()
    const PORT = ENV.PORT || 3000;
    loadAnimalCatalog()
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main()