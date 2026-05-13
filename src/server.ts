import { createApp } from "./app";
import { ENV } from "./config/env";
import { animalMatcherService } from "./services/animalMatcher.service";
import { catalogService } from "./services/catalog.service";

async function main() {
    const app = createApp()
    const PORT = ENV.PORT || 3000;
    Promise.all([
        catalogService.loadAnimalCatalog().then(()=>animalMatcherService.rebuildIndexes()),
        catalogService.loadHabitatCatalog()
    ])
    
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

main()