## Case 2: Kompleks, persistent afsendelseskø med low maintenance

### Resultat

I en persistent forsendelseskø, der skal samle forskellige indholdstyper, reducere
overflødige requests og håndtere versionskonflikter mellem enheder, kan vedligeholdelsen
forenkles ved at abstrahere sendbart indhold til parcels med fælles forsendelsesinstruktioner.

Kø, persistens og fejlhåndtering kan dermed arbejde ens på tværs af indholdstyper. Nye
indholdstyper får deres egne forsendelsesformularer uden at udvide køen med typespecifik
branching.

Forsendelsesformularens instruktioner gør det også muligt at opdele forsendelsen i led med
afgrænsede ansvar, eksempelvis coalescing, batching og versionering. Hvert led følger
instruktionerne uden at kende indholdets betydning. Skal forsendelsespipelinen udvides med
et nyt trin, kan formularen give trinnet de instruktioner, det behøver, uden at trinnet
skal kende resten af pipelinen.

### Problemstilling

Brugeren skal kunne afslutte sin opgave, selvom forbindelsen til serveren er afbrudt.
Samtidig skal en billig, delt server skånes for overflødige requests, og ændringer fra
flere enheder må ikke lydløst overskrive hinanden.

DailyNagger sender både hele opgavetræer, gentagelsesregler og enkelte feltværdier. De
skal kunne gemmes, samles og sendes senere efter forskellige regler, uden at hver ny
indholdstype gør det fælles forsendelsesforløb mere kompliceret at vedligeholde.

### Første løsning: én fælles afsendelseskø

Den første kø reducerede serverarbejdet gennem debounce, coalescing og batching. Men
DailyNagger har mange former for sendbart indhold: alt fra hele opgavetræer og regler for
gentagelse til enkelte feltværdier og brugerens aktuelle tilstand. De har forskellige
endpoints, versionskrav og muligheder for at erstatte eller blive samlet med andre
ventende ændringer.

Efterhånden blev den fælles kø derfor fyldt med typespecifik branching. Køen skulle både
genkende typen af indhold, vælge dens regler og udføre det fælles forsendelsesforløb. Hver ny
form for sendbart indhold krævede ændringer flere steder, og det var stadig uklart, hvordan
de forskellige køelementer senere skulle gemmes, så køen kunne overleve, at appen blev
lukket.

Problemet var ikke, at ændringerne delte en kø. Problemet var, at køen selv kendte deres
forskelle.

### Parcellen som fælles forsendelsesmodel

De typespecifikke regler skulle ud af køen. Inspireret af Mærsks containere og pakkeforsendelser
omdannes sendbart indhold derfor til en parcel med både indhold og instruktioner til
forsendelsesforløbet.

Når sendbart indhold skal afsted, oprettes en forsendelsesformular ud fra indholdets type. Den beskriver
payloaden, dens endpoint og præcis, hvordan ændringen må coalesces, batches, versioneres og
sendes.

Her er et uddrag af `createTaskEntryFormula`, formularen for en ændret feltværdi
i en node i et opgavetræ. Payloadens øvrige metadata er udeladt:

```ts
return {
  type: "task-entry-updated",
  label: taskEntry.label.trim() || "Task entry",

  // Angiv den rod, ændringens versionering tilhører.
  ownerType: "task-log",
  ownerId: taskEntry.taskLogId,

  // Lad nyere ændringer af samme felt erstatte ventende ændringer.
  coalesceKey: `TaskEntry:${taskEntry.id}`,

  // Tillad batching med parcels af samme type og owner.
  canBatch: true,

  // Fortæl senderen, hvordan og hvor indholdet skal sendes.
  sendMethod: "PATCH",
  endpointPath: `/api/task-logs/${taskEntry.taskLogId}/task-entries`,

  // Modtageren kræver versionsoplysninger.
  recipientExpectsVersioning: true,

  // Selve indholdet, som resten af forløbet ikke skal fortolke.
  payload: toJsonValue({
    id: taskEntry.id,
    value: taskEntry.value,
    // ... øvrige metadata om registreringen
  }),
};
```

Parcellen stemples derefter med tværgående metadata som tidspunkt, klientidentitet og
versionen på det datatræ, ændringen tilhører.

Formularen og stemplet samles til en parcel:

```ts
const parcel = {
  formula,
  stamp: {
    parcelId: newGuid(),
    queuedAt,
    mood: getCurrentMood(),
    clientIdentity,
    ...versionStamp,
  },
} satisfies Parcel;
```

Køen behøver dermed kun at forstå parcels. Reglerne for hver form for sendbart indhold
samles i dens forsendelsesformular i stedet for at brede sig gennem kø, persistens og sender.

### Én persistent kø med runtime-validering

Parcel-modellen løste samtidig spørgsmålet om, hvordan forskelligt sendbart indhold kunne
gemmes i et persistent lager og valideres ved genindlæsning. Med parcels og forsendelsesformularer
behøver køen kun at validere én fælles parcel-kontrakt i stedet for at kende et separat
storageformat for hver slags indhold.

Køen serialiseres som JSON og gemmes i MMKV, en hurtig, native C++-baseret key-value
storage til React Native. Den synkrone adgang betyder, at køen kan persisteres i det samme
lineære forløb, hver gang parcels tilføjes eller fjernes.

Når appen starter, betragtes de indlæste JSON-data som eksterne og utroværdige. TypeScript
kan kontrollere koden under udvikling, men typerne findes ikke, når applikationen kører.
Den indlæste kø behandles derfor først som `unknown` og valideres med Zod:

```ts
const persisted = JSON.parse(json) as unknown;
const parsed = persistedParcelQueueSchema.safeParse(persisted);

if (!parsed.success) {
  return discardPersistedQueue(
    "DailyNagger found an invalid saved parcel queue and discarded it.",
  );
}
```

Zod-schemaerne beskriver den fælles kontrakt for kø, parcels, forsendelsesformularer og stamps.
TypeScript-typerne udledes fra de samme schemaer, så runtime-valideringen og
compile-time-kontrakten ikke skal vedligeholdes hver for sig.

Hvis JSON-data ikke kan læses eller ikke længere matcher kontrakten, får de ikke adgang til
forsendelsesforløbet. Den gemte kø kasseres kontrolleret, og årsagen emitteres som et
`sending.queue.restore_failed`-event.

### Færre requests uden at bryde versionsforløbet

DailyNagger sender nogle ændringer som hele opgavetræer. Det gør opdateringerne idempotente og
fjerner vedligeholdelsesarbejdet ved at skulle splejse delvise træopdateringer på serveren.

Det er dog stadig tungt at dekonstruere træerne og gemme dem i databasen. For ikke at belaste
serveren debounces afsendelsen, så gentagne opdateringer af samme træ kan coalesces til én parcel
med den nyeste tilstand.

Forsendelsesformularens `coalesceKey` angiver, hvilke parcels der kan erstatte hinanden. Køen
søger kun efter et match i den del, der endnu ikke er under afsendelse. Parcels fra andre
opgavetræer kan passeres, men møder søgningen en anden opdateringstype på samme træ, stopper
coalesc søgningen for at bevare rækkefølgen.

Debounce betyder dog, at brugeren kan lukke appen, mens parcels stadig venter i køen, og
fortsætte arbejdet på en anden enhed. Når den første app senere åbnes igen, risikerer de gamle
parcels at overskrive de nyere ændringer.

For at forhindre lydløse overskrivninger har hvert opgavetræ en root-version. Versionsspændet
gemmer både den forventede serverversion og den nye klientversion direkte på parcellen, når den
placeres i køen. Opgavetræets root behøver derfor ikke være persistent, og den næste parcel
behøver ikke vente på et serversvar for at kende sin forventede version.

Ved coalescing samles spændene, eksempelvis `1 → 2` og `2 → 3` til `1 → 3`, så
versionsforløbet bevares, selvom en mellemtilstand fjernes.

Når appen starter, forsøges alle ventende parcels sendt, før opgavetræerne hentes fra serveren. Dermed
afvikles det gemte versionsforløb, før klienten indlæser den opdaterede tilstand.

Ved afsendelse kan kompatible parcels fra køens front samles i én request. Batchen overtager
deres samlede versionsspænd, så serveren stadig kan validere hele forløbet som én
sammenhængende ændring.

Coalescing fjerner altså mellemtilstande; batching sender flere nødvendige ændringer samlet.
Versionsspændet gør begge optimeringer mulige uden at svække beskyttelsen mod ændringer fra
andre enheder.

### Afsendelse og fejlhåndtering

Når debounce-timeren udløber, samles kompatible parcels fra køens front i en batch, som
reserveres til afsendelse. De bliver liggende i den persistente kø, men kan ikke coalesces,
mens afsendelsen foregår. Dermed kan nye brugerændringer fortsat tilføjes uden at ændre det
indhold, senderen arbejder med.

En send-funktion opbygger requesten ud fra forsendelsesformularens HTTP-metode og endpoint.
Requesten indeholder batchens payload og samlede versionsspænd:

```ts
const firstParcel = batch.parcels[0];
const payload = firstParcel.formula.canBatch
  ? batch.parcels.map((parcel) => parcel.formula.payload)
  : firstParcel.formula.payload;

const result = await apiRequest({
  method: firstParcel.formula.sendMethod,
  path: firstParcel.formula.endpointPath,
  body: {
    // ... øvrige request-oplysninger
    baseVersion: batch.versioning.existingVersion,
    nextVersion: batch.versioning.newVersion,
    payload,
  },
});
```

Uddraget viser, hvordan den samme send-funktion kan sende forskellige indholdstyper:
Formularen angiver HTTP-metode, endpoint og om payloaden skal sendes enkeltvis eller som
et array. Senderen behøver ikke undersøge indholdets type.

På serveren kontrolleres både, at ændringen bygger på den aktuelle serverversion, og at
versionsbærende payloads ligger inden for requestens versionsspænd. Dermed valideres både
udgangspunktet og det indhold, der skal gemmes.

Send-funktionen omsætter serverens svar eller en forbindelsesfejl til et afsendelsesresultat,
som styrer det videre forløb. Ved succes får køen besked på at fjerne batchens parcels og
fortsætte. Ved forbindelsesfejl bliver de liggende, og køen planlægger et nyt forsøg med backoff.

Ved en versionskonflikt promptes brugeren om at kassere batchen eller gennemtvinge afsendelsen.
Ved en afvisning, som ikke kan repareres, informeres brugeren, før batchen kasseres.

Fejlhåndteringen arbejder dermed med parcels frem for indholdet i de enkelte payloads. Nye
indholdstyper kan bruge det samme forløb, mens køen alene modtager instruktioner om at beholde
eller fjerne batchen og om at fortsætte, vente eller stoppe.

### Tests

Testene kontrollerer de garantier, som forsendelsesforløbet skal bevare:

- **Versionering:** Når en parcel oprettes, reserveres næste version, så efterfølgende ændringer kan fortsætte versionsforløbet uden at vente på serveren.
- **Coalescing:** En nyere ændring erstatter den ventende parcel, men bevarer det samlede versionsspænd både i den gemte kø og ved afsendelse.
- **Timing og forbindelsesfejl:** Afsendelsen venter på debounce-perioden. Ved forbindelsesfejl beholdes parcellen, og afsendelse forsøges igen efter backoff.
- **Servervalidering:** Serveren afviser et forældet versionsgrundlag og versionsbærende payloads uden for requestens versionsspænd.

Testene fokuserer på systemets egen logik og integrationer, ikke på, om tredjepartskomponenter fungerer som dokumenteret.

### Kodehenvisninger

#### Kode

- **[queueTaskEntry](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/sending/queueTaskEntry.ts)** — opretter forsendelsesformularen for en ændret feltværdi i en node i et opgavetræ.
- **[useCreateParcel](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/sending/parcel-flow/useCreateParcel.ts)** — samler formular og stempel til en parcel og reserverer ændringens versionsspænd.
- **[persistentStorage](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/sending/parcel-flow/persistentStorage.ts)** — gemmer køen i MMKV og validerer de gemte data med Zod ved gendannelse.
- **[useParcelQueue](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/sending/parcel-flow/useParcelQueue.ts)** — styrer coalescing, batching, debounce og køens reaktion på afsendelsesresultatet.
- **[useSendParcelBatch](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/sending/parcel-flow/useSendParcelBatch.ts)** — opbygger requesten fra formularen og omsætter serverens svar eller forbindelsesfejl til instruktioner til køen.
- **[DataDbWrite](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Server/Operations/DataDbWrite.cs)** — kontrollerer versionsgrundlaget og versionsbærende payloads, før ændringer gemmes.

#### Tests

- **[Versionering](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/tests/sending/runtime/parcelVersioning.test.tsx)** — kontrollerer reservation af næste version og opdatering af den lokale root-version.
- **[Køen](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/tests/sending/runtime/useParcelQueue.test.tsx)** — kontrollerer coalescing med bevaret versionsspænd, debounce og retry efter backoff.
- **[Send-funktionen](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/tests/sending/runtime/useSendParcelBatch.test.tsx)** — kontrollerer, at en forbindelsesfejl giver instruktionen om at beholde batchen og vente.
- **[Serverens API](https://github.com/OctaBech/DailyNagger/blob/main/tests/DailyNagger.Server.Tests/Api/NagApiTests.cs)** — kontrollerer afvisning af et forældet versionsgrundlag og payloads uden for versionsspændet.
