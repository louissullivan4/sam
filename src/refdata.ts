export const provinces: Record<string, string[]> = {
  "Dublin Scout Province": [
    "Cluain Toirc Scout County",
    "Dodder Scout County",
    "Dublinia Scout County",
    "Dún na Farraige Scout County",
    "Liffey West Scout County",
    "Mountpelier Scout County",
    "Three Rock Scout County",
    "Tolka Scout County",
  ],
  "Northern Scout Province": [
    "Brian Boru Scout County",
    "Down & Connor Scout County",
    "Erne Scout County",
    "Errigal Scout County",
  ],
  "North Eastern Scout Province": [
    "Cavan — Monaghan Scout County",
    "Fingal Scout County",
    "Reachra Scout County",
    "Atha Cliath 15 Scout County",
    "Gleann Na Boinne Scout County",
    "Lakelands Scout County",
    "Louth Scout County",
  ],
  "Western Scout Province": [
    "Clare Scout County",
    "Galway Scout County",
    "Lough Keel Scout County",
    "Mayo Scout County",
    "Sligo Scout County",
  ],
  "Southern Scout Province": [
    "Cois Laoi Chorcaí Scout County",
    "Cork South Scout County",
    "Kerry Scout County",
    "Lee Valley Scout County",
    "Limerick Scout County",
    "North Cork Scout County",
    "Tipperary Scout County",
    "West Cork Scout County",
  ],
  "South Eastern Scout Province": [
    "Carlow-Kilkenny Scout County",
    "Cill Dara Scout County",
    "Cill Mhantáin Scout County",
    "Slieve Bloom Scout County",
    "South Kildare Scout County",
    "Waterford Scout County",
    "Wexford Scout County",
  ],
};

export const scoutCounties: string[] = Object.values(provinces).flat();

export const countyToProvince: Record<string, string> = Object.entries(
  provinces,
).reduce(
  (acc, [province, counties]) => {
    counties.forEach((c) => (acc[c] = province));
    return acc;
  },
  {} as Record<string, string>,
);
