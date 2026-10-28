import {writeOfficialDistrictBases} from './official-district-research.mjs';
import {writeRemainingDistrictBases} from './remaining-district-research.mjs';
import {writeVkOnlyDistrictBases,writeVkResearchMaterials} from './vk-note-research.mjs';
await writeOfficialDistrictBases();
await writeRemainingDistrictBases();
await writeVkOnlyDistrictBases();
await writeVkResearchMaterials();
