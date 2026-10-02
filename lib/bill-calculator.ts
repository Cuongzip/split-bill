export interface Participant {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

export interface BillProduct {
  id: string;
  name: string;
  price: number;
  participantIds: string[];
}

export interface Bill {
  id: string;
  title: string;
  date?: string;
  image?: string;
  totalAmount?: number;
  products: BillProduct[];
}

export interface StandaloneProduct {
  id: string;
  name: string;
  price: number;
  participantIds: string[];
  note?: string;
}

export interface ParticipantItemShare {
  productId: string;
  productName: string;
  share: number;
  fullPrice: number;
  splitCount: number;
}

export interface BillParticipantCalculation {
  participantId: string;
  participantName: string;
  total: number;
  items: ParticipantItemShare[];
}

export interface ParticipantBillFormula {
  participantId: string;
  participantName: string;
  formula: string;
  shortFormula: string;
  total: number;
  formattedTotal: string;
  displayLine: string;
  commonShare: number;
  privateShare: number;
  privateItems: ParticipantItemShare[];
}

export interface BillFormulaBreakdown {
  billTotal: number;
  activeParticipantsCount: number;
  commonProductsTotal: number;
  nonCommonProductsTotal: number;
  formulas: ParticipantBillFormula[];
  fullFormulaText: string;
}

export interface BillCalculationResult {
  billId: string;
  billTitle: string;
  billTotal: number;
  hasUnassigned: boolean;
  unassignedItems: BillProduct[];
  participantCalculations: BillParticipantCalculation[];
  formulaBreakdown?: BillFormulaBreakdown;
}

export interface StandaloneCalculationResult {
  total: number;
  hasUnassigned: boolean;
  unassignedItems: StandaloneProduct[];
  participantCalculations: {
    participantId: string;
    participantName: string;
    total: number;
    items: ParticipantItemShare[];
  }[];
}

export interface GlobalParticipantSummary {
  participantId: string;
  participantName: string;
  total: number;
  bills: {
    billId: string;
    billTitle: string;
    total: number;
    formula: string;
    shortFormula: string;
    items: ParticipantItemShare[];
  }[];
  standaloneItems: ParticipantItemShare[];
  standaloneTotal: number;
}

export interface GlobalCalculationResult {
  grandTotal: number;
  totalProductsCount: number;
  unassignedProductsCount: number;
  participants: GlobalParticipantSummary[];
}

export function formatVND(amount: number): string {
  const rounded = Math.round(amount);
  return `${new Intl.NumberFormat("vi-VN").format(rounded)}đ`;
}

export function formatCompactK(amount: number): string {
  const rounded = Math.round(amount);
  const abs = Math.abs(rounded);
  const sign = rounded < 0 ? "-" : "";
  if (abs >= 1000 && abs % 1000 === 0) {
    return `${sign}${abs / 1000}k`;
  }
  if (abs >= 1000) {
    const kVal = (abs / 1000).toFixed(1).replace(/\.0$/, "");
    return `${sign}${kVal}k`;
  }
  return `${rounded}đ`;
}

export function calculateBill(
  bill: Bill,
  participants: Participant[]
): BillCalculationResult {
  const sumOfProducts = bill.products.reduce((acc, p) => acc + (p.price || 0), 0);
  const billTotal =
    typeof bill.totalAmount === "number" && bill.totalAmount > 0
      ? bill.totalAmount
      : sumOfProducts;
  const unassignedItems: BillProduct[] = [];

  const partMap: Record<string, BillParticipantCalculation> = {};
  for (const p of participants) {
    partMap[p.id] = {
      participantId: p.id,
      participantName: p.name,
      total: 0,
      items: [],
    };
  }

  for (const product of bill.products) {
    const validPids = product.participantIds.filter((pid) => partMap[pid]);
    if (validPids.length === 0) {
      unassignedItems.push(product);
      continue;
    }

    const share = product.price / validPids.length;
    for (const pid of validPids) {
      partMap[pid].total += share;
      partMap[pid].items.push({
        productId: product.id,
        productName: product.name,
        share,
        fullPrice: product.price,
        splitCount: validPids.length,
      });
    }
  }

  if (sumOfProducts > 0 && billTotal !== sumOfProducts && unassignedItems.length === 0) {
    const scale = billTotal / sumOfProducts;
    for (const p of participants) {
      partMap[p.id].total = Math.round(partMap[p.id].total * scale);
    }
  }

  const formulaBreakdown = calculateBillFormulas(bill, participants);

  return {
    billId: bill.id,
    billTitle: bill.title,
    billTotal,
    hasUnassigned: unassignedItems.length > 0,
    unassignedItems,
    participantCalculations: Object.values(partMap),
    formulaBreakdown,
  };
}

export function calculateBillFormulas(
  bill: Bill,
  participants: Participant[]
): BillFormulaBreakdown {
  const sumOfProducts = bill.products.reduce((acc, p) => acc + (p.price || 0), 0);
  const billTotal =
    typeof bill.totalAmount === "number" && bill.totalAmount > 0
      ? bill.totalAmount
      : sumOfProducts;

  const activeParticipants = participants.filter((p) =>
    bill.products.some((prod) => prod.participantIds.includes(p.id))
  );
  const targetParticipants =
    activeParticipants.length > 0 ? activeParticipants : participants;
  const N = targetParticipants.length;

  const commonProducts: BillProduct[] = [];
  const nonCommonProducts: BillProduct[] = [];

  for (const prod of bill.products) {
    if (prod.participantIds.length === 0) continue;
    const isEatenByAll = targetParticipants.every((p) =>
      prod.participantIds.includes(p.id)
    );
    if (isEatenByAll) {
      commonProducts.push(prod);
    } else {
      nonCommonProducts.push(prod);
    }
  }

  const commonProductsTotal = commonProducts.reduce(
    (sum, p) => sum + p.price,
    0
  );
  const nonCommonProductsTotal = nonCommonProducts.reduce(
    (sum, p) => sum + p.price,
    0
  );

  const formulas: ParticipantBillFormula[] = [];

  for (const p of targetParticipants) {
    const scale = sumOfProducts > 0 ? billTotal / sumOfProducts : 1;
    const commonShare =
      nonCommonProductsTotal === 0 && N > 0
        ? billTotal / N
        : N > 0
        ? Math.max(0, (billTotal - nonCommonProductsTotal * scale) / N)
        : 0;

    const privateItems: ParticipantItemShare[] = [];
    for (const prod of nonCommonProducts) {
      if (prod.participantIds.includes(p.id)) {
        const share = (prod.price * scale) / prod.participantIds.length;
        privateItems.push({
          productId: prod.id,
          productName: prod.name,
          share,
          fullPrice: prod.price * scale,
          splitCount: prod.participantIds.length,
        });
      }
    }

    const privateShare = privateItems.reduce((sum, it) => sum + it.share, 0);
    const total = Math.round(commonShare + privateShare);

    let formula = "";
    let shortFormula = "";
    if (nonCommonProductsTotal > 0 && commonProductsTotal > 0) {
      const basePart = `(${formatVND(billTotal)} - ${formatVND(Math.round(nonCommonProductsTotal * scale))}) / ${N}`;
      const shortBasePart = `(${formatCompactK(billTotal)} - ${formatCompactK(Math.round(nonCommonProductsTotal * scale))}) / ${N}`;
      if (privateShare > 0) {
        formula = `${basePart} + ${formatVND(privateShare)}`;
        shortFormula = `${shortBasePart} + ${formatCompactK(privateShare)}`;
      } else {
        formula = `${basePart}`;
        shortFormula = `${shortBasePart}`;
      }
    } else if (nonCommonProductsTotal === 0) {
      formula = `${formatVND(billTotal)} / ${N}`;
      shortFormula = `${formatCompactK(billTotal)} / ${N}`;
    } else {
      formula =
        privateItems.map((it) => formatVND(it.share)).join(" + ") || "0đ";
      shortFormula =
        privateItems.map((it) => formatCompactK(it.share)).join(" + ") || "0đ";
    }

    const displayLine = `${p.name} : ${formula} = ${formatVND(total)}`;

    formulas.push({
      participantId: p.id,
      participantName: p.name,
      formula,
      shortFormula,
      total,
      formattedTotal: formatVND(total),
      displayLine,
      commonShare,
      privateShare,
      privateItems,
    });
  }

  const fullFormulaText = formulas.map((f) => f.displayLine).join("\n");

  return {
    billTotal,
    activeParticipantsCount: N,
    commonProductsTotal,
    nonCommonProductsTotal,
    formulas,
    fullFormulaText,
  };
}

export function calculateStandalone(
  products: StandaloneProduct[],
  participants: Participant[]
): StandaloneCalculationResult {
  const total = products.reduce((acc, p) => acc + (p.price || 0), 0);
  const unassignedItems: StandaloneProduct[] = [];

  const partMap: Record<
    string,
    {
      participantId: string;
      participantName: string;
      total: number;
      items: ParticipantItemShare[];
    }
  > = {};

  for (const p of participants) {
    partMap[p.id] = {
      participantId: p.id,
      participantName: p.name,
      total: 0,
      items: [],
    };
  }

  for (const product of products) {
    const validPids = product.participantIds.filter((pid) => partMap[pid]);
    if (validPids.length === 0) {
      unassignedItems.push(product);
      continue;
    }

    const share = product.price / validPids.length;
    for (const pid of validPids) {
      partMap[pid].total += share;
      partMap[pid].items.push({
        productId: product.id,
        productName: product.name,
        share,
        fullPrice: product.price,
        splitCount: validPids.length,
      });
    }
  }

  return {
    total,
    hasUnassigned: unassignedItems.length > 0,
    unassignedItems,
    participantCalculations: Object.values(partMap),
  };
}

export function calculateGlobal(
  bills: Bill[],
  standaloneProducts: StandaloneProduct[],
  participants: Participant[]
): GlobalCalculationResult {
  let grandTotal = 0;
  let totalProductsCount = 0;
  let unassignedProductsCount = 0;

  const summaryMap: Record<string, GlobalParticipantSummary> = {};
  for (const p of participants) {
    summaryMap[p.id] = {
      participantId: p.id,
      participantName: p.name,
      total: 0,
      bills: [],
      standaloneItems: [],
      standaloneTotal: 0,
    };
  }

  for (const bill of bills) {
    const billCalc = calculateBill(bill, participants);
    grandTotal += billCalc.billTotal;
    totalProductsCount += bill.products.length;
    unassignedProductsCount += billCalc.unassignedItems.length;

    for (const pCalc of billCalc.participantCalculations) {
      if (pCalc.items.length > 0) {
        summaryMap[pCalc.participantId].total += pCalc.total;
        const formulaObj = billCalc.formulaBreakdown?.formulas.find(
          (f) => f.participantId === pCalc.participantId
        );
        summaryMap[pCalc.participantId].bills.push({
          billId: bill.id,
          billTitle: bill.title,
          total: pCalc.total,
          formula: formulaObj?.formula || formatVND(pCalc.total),
          shortFormula:
            formulaObj?.shortFormula || formatCompactK(pCalc.total),
          items: pCalc.items,
        });
      }
    }
  }

  const standaloneCalc = calculateStandalone(standaloneProducts, participants);
  grandTotal += standaloneCalc.total;
  totalProductsCount += standaloneProducts.length;
  unassignedProductsCount += standaloneCalc.unassignedItems.length;

  for (const pCalc of standaloneCalc.participantCalculations) {
    if (pCalc.items.length > 0) {
      summaryMap[pCalc.participantId].total += pCalc.total;
      summaryMap[pCalc.participantId].standaloneItems = pCalc.items;
      summaryMap[pCalc.participantId].standaloneTotal = pCalc.total;
    }
  }

  return {
    grandTotal,
    totalProductsCount,
    unassignedProductsCount,
    participants: Object.values(summaryMap),
  };
}
