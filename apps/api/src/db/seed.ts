import "dotenv/config";
import postgres from "postgres";

import {
  cells,
  districts,
  issues,
  provinces,
  sectors,
  villages,
} from "./schema";
import { drizzle } from "drizzle-orm/postgres-js";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error("DATABASE_URL is required");

  const client = postgres(databaseUrl, { prepare: false });
  const db = drizzle(client);

  const [province] = await db
    .insert(provinces)
    .values({
      name: "Kigali City",
      nameKinyarwanda: "Umujyi wa Kigali",
      code: "KG",
    })
    .returning();

  const [district] = await db
    .insert(districts)
    .values({
      provinceId: province.id,
      name: "Gasabo",
      nameKinyarwanda: "Gasabo",
      code: "KG-GS",
    })
    .returning();

  const [sector] = await db
    .insert(sectors)
    .values({
      districtId: district.id,
      name: "Kimironko",
      nameKinyarwanda: "Kimironko",
      code: "KG-GS-KM",
    })
    .returning();

  const [cell] = await db
    .insert(cells)
    .values({
      sectorId: sector.id,
      name: "Kimironko Cell",
      nameKinyarwanda: "Akagari ka Kimironko",
      executiveName: "Uwimana Jean Pierre",
      executivePhone: "+250788000001",
      pin: "1234",
    })
    .returning();

  const insertedVillages = await db
    .insert(villages)
    .values([
      {
        cellId: cell.id,
        name: "Rugarama",
        nameKinyarwanda: "Rugarama",
        coordinatorName: "Murekatete Alice",
      },
      {
        cellId: cell.id,
        name: "Kibagabaga",
        nameKinyarwanda: "Kibagabaga",
        coordinatorName: "Habimana Eric",
      },
      {
        cellId: cell.id,
        name: "Nyarutarama",
        nameKinyarwanda: "Nyarutarama",
        coordinatorName: "Ingabire Diane",
      },
    ])
    .returning();

  const villageByName = new Map(insertedVillages.map((v) => [v.name, v]));

  await db.insert(issues).values([
    {
      cellId: cell.id,
      villageId: villageByName.get("Rugarama")!.id,
      rawText:
        "Mwaramutse! Umuhanda ujya ku ishuri ribanza wuzura amazi cyane iyo imvura iguye. Abana banyerera bakagwa, hari n’aho imodoka zidashobora kuhanyura. Mudufashe kuwusanura no gukora inzira y’amazi.",
      submissionChannel: "whatsapp",
      submitterPhone: "+250788111111",
      languageDetected: "kinyarwanda",
      category: "infrastructure",
      severity: 5,
      severityReason:
        "Flooding on a school road during rain creates immediate safety risk for children and blocks access.",
      summary: "Road to primary school floods during rain, children at safety risk",
      recommendedAction:
        "Repair drainage channel along school road, notify sector education office",
      estimatedParticipants: 60,
      requiresEscalation: false,
      status: "open",
    },
    {
      cellId: cell.id,
      villageId: villageByName.get("Rugarama")!.id,
      rawText:
        "Muri Rugarama ingo zigera kuri 12 zimaze iminsi zidakura amazi meza. Umuyoboro w’amazi warangiritse, amazi ntakigerayo. Turasaba ubufasha bwo kuwusana vuba.",
      submissionChannel: "whatsapp",
      submitterPhone: "+250788222222",
      languageDetected: "kinyarwanda",
      category: "water",
      severity: 4,
      severityReason:
        "Loss of clean water for multiple households has major daily-life impact and health risk.",
      summary:
        "12 households in Rugarama lost clean water — pipe infrastructure damaged",
      recommendedAction:
        "Inspect and repair water pipe. Coordinate with sector water office",
      estimatedParticipants: 40,
      requiresEscalation: true,
      escalationReason: "Scale of damage may exceed umuganda capacity",
      status: "open",
    },
    {
      cellId: cell.id,
      villageId: villageByName.get("Kibagabaga")!.id,
      rawText:
        "Urukuta ruzengurutse ishuri ruri gusenyuka. Hari ibice byasadutse kandi byenda kugwira abana. Turasaba ko habaho gusana byihuse kugira ngo hirindwe impanuka.",
      submissionChannel: "web",
      submitterPhone: null,
      languageDetected: "kinyarwanda",
      category: "infrastructure",
      severity: 4,
      severityReason:
        "A crumbling school perimeter wall poses ongoing danger and could cause injury.",
      summary: "Crumbling school perimeter wall poses daily danger to children",
      recommendedAction:
        "Emergency wall repair. Coordinate with district education office",
      estimatedParticipants: 50,
      requiresEscalation: false,
      status: "open",
    },
    {
      cellId: cell.id,
      villageId: villageByName.get("Nyarutarama")!.id,
      rawText:
        "Ahari isoko imyanda irarenze, iragenda isuka mu muhanda no hafi y’amazu. Hari impumuro mbi kandi bikurura udukoko. Turasaba ko hakorwa umuganda wo kuyikuraho no kuyijyana ahabugenewe.",
      submissionChannel: "web",
      submitterPhone: null,
      languageDetected: "kinyarwanda",
      category: "environment",
      severity: 3,
      severityReason:
        "Overflowing waste dump creates a health hazard and significant nuisance for nearby households.",
      summary:
        "Market waste dump overflowing, creating health hazard for surrounding households",
      recommendedAction: "Organize waste clearing and disposal during umuganda",
      estimatedParticipants: 30,
      requiresEscalation: false,
      status: "open",
    },
    {
      cellId: cell.id,
      villageId: villageByName.get("Kibagabaga")!.id,
      rawText:
        "Umuhanda w’ingenzi unyura muri Kibagabaga warasenyutse (erosion) ku ntera nk’iyo meter 20. Abagenzi n’ibinyabiziga biragorwa, by’umwihariko iyo imvura yaguye. Turasaba ko hakorwa gusibura no kuwusana.",
      submissionChannel: "web",
      submitterPhone: null,
      languageDetected: "kinyarwanda",
      category: "infrastructure",
      severity: 3,
      severityReason:
        "Road erosion affects mobility and access but is not an immediate life-threatening emergency.",
      summary:
        "Main road through Kibagabaga eroded over 20 meters, affecting mobility",
      recommendedAction: "Road erosion repair — fill and compact damaged section",
      estimatedParticipants: 45,
      requiresEscalation: false,
      status: "open",
    },
  ]);

  await client.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

