/** ტრავმის სტატუსები, რომლითაც მოთამაშე არ ითამაშებს (DAY_TO_DAY და QUESTIONABLE შეიძლება ითამაშოს) */
const OUT = new Set(["OUT", "INJURY_RESERVE", "SUSPENSION"]);

export const isOut = (injury?: string | null) => !!injury && OUT.has(injury);

/** მოკლე წარწერა: DAY_TO_DAY → DTD, INJURY_RESERVE → IR */
export const injuryLabel = (injury: string) => ({ DAY_TO_DAY: "DTD", INJURY_RESERVE: "IR", QUESTIONABLE: "Q", SUSPENSION: "SUSP" })[injury] ?? injury.replace(/_/g, " ");
