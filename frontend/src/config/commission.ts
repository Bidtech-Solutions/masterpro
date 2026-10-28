/**
 * Struktur komisi agen (PRD §7.8, sumber: materi "Komisi Agen" MasterPro).
 * Label tier diambil dari messages joinAgent.tier.* ; [KONFIRMASI KLIEN] batas tier & tarif daerah.
 */
export const saleCommissionTiers = [
  { key: "saleBelow1b", percent: 3 },
  { key: "sale1to3b", percent: 2.5 },
  { key: "saleAbove3b", percent: 2 },
] as const;

export const rentCommissionTiers = [
  { key: "rentBelow25m", percent: 10 },
  { key: "rent25to50m", percent: 7.5 },
  { key: "rentAbove50m", percent: 5 },
] as const;

export const commissionSplit = [
  { key: "agentSelling", percent: 40 },
  { key: "agentListing", percent: 30 },
  { key: "manager", percent: 5 },
  { key: "masterCool", percent: 5 },
  { key: "masterpro", percent: 20 },
] as const;
