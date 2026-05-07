import { createApp } from "./app";
import { ENV } from "./config/env";
import { loadAnimalCatalog, loadHabitatCatalog } from "./services/catalog.service";

async function main() {
    const app = createApp()
    const PORT = ENV.PORT || 3000;
    loadAnimalCatalog()
    loadHabitatCatalog()
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main()