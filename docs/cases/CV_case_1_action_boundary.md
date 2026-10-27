## Case 1: Forenkl koden ved at bryde Reacts dependency-domino med en boundary

### Resultat

Ved at dirigere kald fra brugerfladen til interne services gennem en action-boundary brydes dependency-dominoen. Serviceafhængigheder kan dermed få nye referencer uden at kræve stabiliserings-hooks omkring hver funktion for at forhindre cascading re-renders.

Boundaryen kræver ikke ekstra manuel wiring eller dobbeltregistrering, hver action registreres én gang. Boundaryen danner automatisk stabile pakker med proxyfunktioner, som de enkelte screens og menuer får gennem context hooks i stedet for prop drilling.

Typesikkerhed og IntelliSense bevares fra registreringen til kaldet i brugerfladen.

### Problemstilling

DailyNagger er et hobbyprojekt, som skal være nemt at udvide i små inkrementer og genoptage efter længere pauser. Især klienten skal derfor have low maintenance og god DX.

Funktionalitet skal isoleres i selvstændige services, der ikke kender hinanden. Samspillet mellem dem skal orkestreres i action-funktioner, der kan læses som simple A→B-scripts.

Brugerfladen (*frontstage*) skal være uvidende om de interne services (*backstage*) og blot kalde actions, som leveres gennem context hooks. Dermed er handlingerne lige ved hånden i screens og menuer uden prop drilling.

### Første løsning: Actions som hooks

Action-funktionerne blev oprindeligt dannet i hooks, så de fik adgang til services, uden at frontstage skulle kende eller medsende dem.

Ved re-renders i backstage blev action-funktionerne oprettet på ny med nye referencer. Når de blev leveret gennem context, udløste det cascading re-renders. Stabilisering af action-funktionerne krævede også stabile serviceafhængigheder. Dermed opstod en dependency-domino, der spredte React-hooks og dependency arrays langt ind i backstages enkelte services og modarbejdede målet om enkel, let vedligeholdelig kode.

Hooken `useStableCallback` (se “Stabil reference trods ændrede dependencies”) blev udviklet, så services kunne levere stabile funktioner uden også at stabilisere deres interne funktioner. Hooken skulle dog tilføjes i hver berørt service, hvor React-stabilisering stadig blev blandet med servicens egentlige ansvar og dermed svækkede cohesion. Men ved at flytte brugen af hooken til en action-boundary kunne frontstage i stedet afkobles fra backstages skiftende referencer.

Fejl i stabiliseringen medførte desuden tidskrævende debugging, blandt andet med *Why Did You Render* (WDYR).

### Krav

DX skal bevares. Derfor er det obligatorisk, at:

- Actions og deres serviceafhængigheder kan tilføjes uden manuel referencestabilisering i de enkelte actions eller services.
- Actions bevarer typesikkerhed og IntelliSense gennem hele forløbet.
- Udvikleren ikke skal kende til skjulte side effects eller timingproblemer for at bruge løsningen korrekt.

### Afkobling af frontstage og backstage med en boundary

For at gøre afkoblingen overskuelig blev alle action-funktioner omskrevet til samme grundform med to argumentobjekter:

```ts
actionFunction(actionArguments, serviceDependencies)
```

`actionArguments`-objektet indeholder de oplysninger, som `actionFunction` skal bruge fra frontstage, eksempelvis den valgte node og brugerens indtastede værdi.

`serviceDependencies` er et objekt med de services fra backstage, som `actionFunction` skal bruge til at udføre arbejdet. Dette objekt kaldes en servicepakke. De forskellige servicepakker er defineret eksplicit i et object literal i action-boundaryen, med pakkenavnene som nøgler.

Opdelingen gør det muligt at have en action-boundary, der danner proxyfunktioner til frontstage. Proxyfunktionerne tager kun frontstages argumentobjekt og videresender kaldene til en fælles eksekveringsfunktion, `executeAction`. Denne funktion henter de aktuelle services og kalder `actionFunction` med begge argumentobjekter.

Registrering af en `actionFunction` i action-boundaryen sker med `registerAction`, som tager to parametre: selve `actionFunction` og nøglen til dens tilhørende servicepakke.

```ts
registerAction(
  actionFunction,
  servicePackageName,
)
```

Så længe typekontrakten overholdes, kan samme servicepakke bruges af flere action-funktioner. En action-funktion kan også bruges på flere screens og i dial-menuer med deres lokale services, eksempelvis `planMemory` eller `editorMemory`.

### Fra registry til frontstage

Registry-filerne er formet som object literals, der grupperer de registrerede actions og giver dem de navne, frontstage skal kalde dem med:

```ts
export const planScreenActionRegistry = {
  taskEntry: {
    setValue: registerAction(...),
  },
  taskXXX: {
    setXXX: registerAction(...),
  },
} as const;
```

Boundaryens `buildProxyActions` danner en tilsvarende pakke med proxyfunktioner, `proxyActions`. Strukturen bevares, så registreringen under `taskEntry.setValue` bliver til proxyfunktionen `taskEntry.setValue` i frontstage.

```ts
// Gennemløb registryets grupper.
Object.entries(registry).forEach(([groupName, group]) => {
  // Opret samme gruppe i proxyActions.
  proxyActions[groupName] = {};

  // Gennemløb gruppens action-registreringer.
  Object.entries(group).forEach(([actionName, action]) => {
    // Opret proxyfunktionen på samme placering som registreringen.
    proxyActions[groupName][actionName] = (actionArguments: unknown) => {
      // Ved et senere kald videresendes registreringen og argumentobjektet.
      executeAction({ action, actionArguments });
    };
  });
});
```

`proxyActions` memoiseres og leveres gennem skærmenes context hooks. Frontstage får adgang til pakken og kan derfor kalde:

```ts
useXxxScreenActions().taskEntry.setValue({ taskEntry, newValue });
```

Boundary-laget udleder dermed både proxyfunktionerne og context-hookens indhold direkte fra registryet. Proxyfunktionerne skal ikke forbindes manuelt til context-hooken som endnu et vedligeholdelsestrin.

### Stabil reference trods ændrede dependencies

I JavaScript er funktioner designet til at tage værdier med sig fra deres omgivelser (*closure*). Funktioner er derfor mere end deres kode, og hver oprettet funktion får sin egen unikke reference, også når koden er den samme.

I React kan en event (brugerhandling, timer, …) ændre en komponents state og udløse en genberegning (*render*): JavaScript-koden køres igen for komponenten og dens underkomponenter, hvor funktioner oprettes med nye referencer. Når React skal vurdere, om de funktioner, en komponent afhænger af, er ændret, sammenligner den referencer, ikke kode. Det giver mening, fordi to funktioner med samme kode kan have hver sin *closure*. **Dermed kan uændret kode udløse en kædereaktion af renders.**

For at bryde kædereaktionen skal boundaryens proxyfunktioner beholde deres referencer, selvom services ændrer sig. I stedet for at bruge stabiliserings-hooks på hver proxyfunktion stabiliseres den funktion, de kalder. Helperen `useStableCallback` pakker `executeAction` ind i en funktion, hvis reference ikke ændres.

Wrapperen stabiliseres med `useCallback`, som bevarer dens reference, så længe dens dependencies ikke ændres.

Wrapperen skal kalde `executeAction`, men denne funktion oprettes på ny ved renders. Hvis den bruges direkte som dependency, får wrapperen også en ny reference. Derfor gemmes `executeAction` i et ref-object fra `useRef`, og wrapperen bruger det stabile ref-object som dependency. **Dermed erstattes en skiftende dependency med et stabilt objekt, hvis indhold stadig kan opdateres.**

Wrapperen skal kalde den nyeste `executeAction`, så actionen bruger de aktuelle services. Indholdet af `useRef` må ikke opdateres under render, da React kan påbegynde en render og kassere den igen, fx for at prioritere en vigtigere opdatering. **En opdatering under render kunne derfor gøre værdier fra en kasseret render tilgængelige for wrapperen.** I stedet bruges `useLayoutEffect` til at opdatere ved commit, altså når React tager renderens resultat i brug.

Grunden til, at `useLayoutEffect` bruges frem for `useEffect`, er, at den opdaterer synkront. `useEffect` kan udskyde opdateringen og lade andre events komme imellem. Det gør eksekveringsrækkefølgen timingafhængig og kan skabe svært gennemskuelige fejl — netop de skjulte timinghensyn, løsningen skulle holde væk fra udvikleren.

Mekanismen er her vist samlet, uden typeannoteringer:

```ts
const executeActionRef = useRef(executeAction);

// Opdater ved commit med den aktuelle executeAction.
useLayoutEffect(() => {
  executeActionRef.current = executeAction;
}, [executeAction]);

// Bevar wrapperens reference; kald gennem det stabile ref-object.
const stableExecuteAction = useCallback(
  (...args) => executeActionRef.current(...args),
  [executeActionRef],
);
```

Builderen får `stableExecuteAction` som eksekveringsfunktion, så alle proxyfunktionernes kald går gennem den stabile wrapper.

`proxyActions` memoiseres med registryet og den stabile wrapper som dependencies. Da begge beholder deres referencer, bliver proxyfunktionerne ikke gendannet, når services ændrer sig.

### Fra proxykald til action

Når frontstage kalder en proxyfunktion, videresender den sin action-registrering og brugerens argumentobjekt til `executeAction`. Registreringen indeholder en reference til `actionFunction` samt navnet på den servicepakke, actionen skal bruge.

Servicepakkerne samles i et object literal, der bruges som en dictionary med pakkenavnene som nøgler. `executeAction` kan derfor slå den relevante pakke op og give dens aktuelle services til actionen.

```ts
function executeAction({ action, actionArguments }) {
  // Slå den navngivne servicepakke op.
  const serviceDependencies = servicePackages[action.servicePackageName];

  // Udfør actionen med begge argumentobjekter.
  action.actionFunction(actionArguments, serviceDependencies);
}
```

Proxyfunktionen videresender altså kaldet, mens `executeAction` henter services og udfører actionen med det uændrede argumentobjekt.

### Typesikkerhed ved registrering

Ved registrering af en action i boundaryen skal TypeScript kontrollere, at den valgte servicepakke passer til actionens `serviceDependencies`. En forkert pakke skal fanges ved typecheck — ikke først, når brugeren kalder actionen.

Actions er grupperet efter deres ansvar. Hver gruppe har en `contracts`-fil, som definerer typen på de services, gruppens actions modtager som deres andet argument.

Servicepakkerne defineres i boundaryens object literal. Hver pakke kontrolleres med `satisfies` mod den tilhørende kontrakt:

```ts
"plan/task-input": {
  memory: inputs.planMemory,
  sending: inputs.sending,
  interactionStamp: inputs.planInteractionStamp,
} satisfies taskInputActions.TaskInputRuntimeDependencies,
```

TypeScript kontrollerer dermed, at pakken indeholder de krævede services med de rigtige typer.

Funktionen `createActionRuntimeDependencies` returnerer object literalen med servicepakkerne. `ReturnType` udleder typen på dette objekt, og `keyof` udleder de tilladte pakkenavne fra dets nøgler:

```ts
type ServicePackages =
  ReturnType<typeof createActionRuntimeDependencies>;

type ServicePackageName = keyof ServicePackages;
```

Ved registreringen bliver det valgte pakkenavn til `TServicePackageName`. Det bruges til at slå pakkens type op og kræve, at action-funktionen kan modtage den som sit andet argument. Her vises den relevante kode med casens parameternavne:

```ts
function registerAction<TServicePackageName extends ServicePackageName, TActionArgs>(
  actionFunction: (
    actionArguments: TActionArgs,
    serviceDependencies: ServicePackages[TServicePackageName],
  ) => void,
  servicePackageName: TServicePackageName,
) {
  return { actionFunction, servicePackageName };
}
```

Vælges `"plan/task-input"`, kontrolleres actionen mod denne pakkes type. Vælges et ukendt pakkenavn eller en pakke, actionen ikke kan modtage, fejler registreringen ved typecheck.

### Typesikkerhed i frontstage

Frontstage skal kunne kalde proxyfunktionen med korrekt IntelliSense, og forkerte argumenter skal fanges ved typecheck.

Registreringen gemmer action-funktionen med dens argumenttype. Når boundaryen danner proxyfunktionernes typer, udleder den derfor typen på actionens første argument og bruger den som proxyfunktionens argumenttype.

Frontstage leverer dermed samme argumentobjekt, som actionen forventer:

```ts
proxyActions.taskEntry.setValue({ taskEntry, newValue });
```

Mangler en krævet property, eller har den en forkert type, afviser TypeScript kaldet.

Her vises, hvordan proxyfunktionens argumenttype udledes:

```ts
type ProxyAction<TAction> =
  TAction extends (
    actionArguments: infer TActionArgs,
    serviceDependencies: any,
  ) => void
    ? (actionArguments: TActionArgs) => void
    : never;
```

`extends` undersøger her, om `TAction` har den viste funktionsform. Hvis den har, bruges den udledte `TActionArgs` til en proxyfunktion med **kun argumentobjektet**. Services skal frontstage ikke levere; dem tilføjer boundaryen ved eksekvering.

Til udledningen af argumentobjektets type bruges TypeScripts `infer`, som betyder **“udled typen her, og giv den et navn”**. Typen på action-funktionens første argument får navnet `TActionArgs`, som bruges som argumenttype i den resulterende proxytype.

Denne udledning anvendes på hver registreret action, så proxyfunktionernes argumenttyper følger deres respektive action-funktioner.

### Afgrænset typecast i builderen

Registryet indeholder actions med forskellige argumenttyper. TypeScript ved eksempelvis, at `taskEntry.setValue` kræver et objekt med `taskEntry` og `newValue`.

Builderen gennemløber registryet med `Object.entries()` og opretter en proxyfunktion for hver registrering. Under dette dynamiske gennemløb kan TypeScript ikke bevare den præcise forbindelse mellem hvert action-navn og dets argumenttype. Den pakke, der bygges inde i loopet, får derfor en mere generel type.

Builderen bevarer dog forbindelsen i selve koden: Hver proxyfunktion gemmer sin registrering og videresender argumentobjektet uændret. Den færdige pakke gives derfor den præcise type, som er udledt fra registryet:

```ts
return proxyActions as ProxyActions<TRegistry>;
```

`as` er et **typecast**: Det fortæller TypeScript, hvilken type pakken skal behandles som. Det er ikke en ekstra kontrol og ændrer ikke koden ved eksekvering. Builderen skal derfor selv sikre, at pakken faktisk passer til typen.

Castet ligger ét sted i builderen. Registreringerne og frontstages kald kontrolleres fortsat af TypeScript, mens builderens arbejde kontrolleres med tests.

### Tests

TypeScript kontrollerer typerne, men kan ikke bevise, at builderen faktisk forbinder proxyfunktionerne korrekt. Testene dækker derfor både de regler, typecheck skal håndhæve, og det arbejde, boundaryen udfører ved eksekvering.

**Typekontrollen testes med både gyldige og ugyldige kald.** Gyldige kald skal accepteres. Ugyldige kald markeres med `@ts-expect-error`, som kræver, at TypeScript finder en fejl på den efterfølgende linje:

```ts
// @ts-expect-error Pakkenavnet findes ikke i servicepakkernes object literal.
registerAction(taskInputActions.taskEntrySetValue, "plan/unknown-package");
```

Hvis registreringen senere accepterer det ukendte pakkenavn, fejler typecheck, fordi den forventede fejl mangler. Tilsvarende kontrolleres det, at en uforenelig servicepakke samt manglende eller forkert typede argumenter afvises.

**Ved eksekvering testes en action gennem hele boundaryen.** Testen gemmer først proxyfunktionens reference. Derefter renderes boundaryen igen med en ny memory-service, og den gemte proxyfunktion kaldes med et argumentobjekt.

Testen kontrollerer tre ting:

- Action-pakken og proxyfunktionen beholder deres referencer.
- Actionen modtager det samme argumentobjekt, som frontstage leverede.
- Actionen bruger den nye memory-service, ikke den fra første render.

Dermed kontrolleres både den stabile forbindelse til frontstage og leveringen af aktuelle services fra backstage.

### Kodehenvisninger

1. **[Action-funktion](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/actions/task-input/setTaskEntryValue.ts)** — modtager argumentobjektet og sine services.
2. **[Plan-screen-registry](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/register/planScreenActionRegistry.ts)** — registrerer actions med deres servicepakker.
3. **[Servicepakker](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/action-dependencies/actionRuntimeDependencies.ts)** — definerer pakkernes indhold og kontrollerer kontrakterne.
4. **[Registrering](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/register/actionRegistrationModel.ts)** — kontrollerer forbindelsen mellem action-funktion og servicepakke.
5. **[Proxy-builder](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/useBuildProxyActions.ts)** — bygger proxyfunktionerne fra registryet.
6. **[Boundary](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/useActionBoundary.ts)** — forbinder builderen med den stabile eksekveringsfunktion.
7. **[Stabil wrapper](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/shared/useStableCallback.ts)** — bevarer wrapperens reference.
8. **[Aktuel implementation](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/shared/useRefLatestValue.ts)** — helperen `useRefLatestValue`, som `useStableCallback` bruger til at opdatere indholdet af `useRef` ved commit.
9. **[Eksekvering](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/useExecuteAction.ts)** — henter servicepakken og kalder actionen.
10. **[Proxytyper](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/src/services/action-boundary/proxyActionsModel.ts)** — udleder argumenttyperne til frontstage.
11. **[Runtime-test](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/tests/action-boundary/runtime/useActionBoundary.test.tsx)** — kontrollerer stabile referencer, uændret argumentobjekt og aktuelle services.
12. **[Registreringens typetests](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/tests/action-boundary/types/registerAction.types.ts)** — kontrollerer gyldige og ugyldige registreringer.
13. **[Frontstages typetests](https://github.com/OctaBech/DailyNagger/blob/main/src/DailyNagger.Mobile/tests/action-boundary/types/frontstageActions.types.ts)** — kontrollerer argumenttyperne ved kald fra frontstage.
