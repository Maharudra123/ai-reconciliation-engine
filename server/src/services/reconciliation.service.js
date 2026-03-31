/**
 * Processes platform and bank data to find discrepancies and matched items.
 */
const reconcileData = (platformData, bankData) => {
  const discrepancies = {
    matched: [], // NEW: Tracks successful reconciliations
    timingGaps: [],
    roundingErrors: [],
    duplicates: [],
    orphanedRefunds: [],
    summary: {
      totalPlatformVolume: 0,
      totalBankVolume: 0,
      netDifference: 0,
    },
  };

  // 1. Calculate Totals
  platformData.forEach(
    (tx) => (discrepancies.summary.totalPlatformVolume += tx.amount),
  );
  bankData.forEach(
    (stl) => (discrepancies.summary.totalBankVolume += stl.amount),
  );

  discrepancies.summary.totalPlatformVolume = Number(
    discrepancies.summary.totalPlatformVolume.toFixed(2),
  );
  discrepancies.summary.totalBankVolume = Number(
    discrepancies.summary.totalBankVolume.toFixed(2),
  );
  discrepancies.summary.netDifference = Number(
    (
      discrepancies.summary.totalPlatformVolume -
      discrepancies.summary.totalBankVolume
    ).toFixed(2),
  );

  // 2. Map Platform transactions for easy lookup
  const platformMap = new Map();
  platformData.forEach((tx) => platformMap.set(tx.id, tx));

  // 3. Aggregate Bank Settlements
  const bankAggregates = {};
  bankData.forEach((stl) => {
    if (!bankAggregates[stl.transaction_id]) {
      bankAggregates[stl.transaction_id] = {
        count: 0,
        totalAmount: 0,
        dates: [],
        records: [],
      };
    }
    bankAggregates[stl.transaction_id].count += 1;
    bankAggregates[stl.transaction_id].totalAmount += stl.amount;
    bankAggregates[stl.transaction_id].dates.push(
      new Date(stl.settlement_date),
    );
    bankAggregates[stl.transaction_id].records.push(stl);
  });

  // 4. Run the 1-to-1 Matching Logic
  platformData.forEach((tx) => {
    let isAnomaly = false; // Tracker for our new filter

    // Check for Orphaned Refunds
    if (tx.type === "refund" && tx.parent_id) {
      if (!platformMap.has(tx.parent_id)) {
        isAnomaly = true;
        discrepancies.orphanedRefunds.push({
          error: "Refund parent_id does not exist",
          transaction: tx,
        });
      } else {
        discrepancies.matched.push(tx);
      }
      return;
    }

    const bankRecord = bankAggregates[tx.id];

    if (bankRecord) {
      // Duplicates
      if (bankRecord.count > 1) {
        isAnomaly = true;
        discrepancies.duplicates.push({
          error: "Multiple bank settlements for single transaction",
          platformTx: tx,
          bankRecords: bankRecord.records,
        });
      }

      // Timing Gaps
      const txMonth = new Date(tx.timestamp).getMonth();
      const stlMonth = bankRecord.dates[0].getMonth();
      if (txMonth !== stlMonth) {
        isAnomaly = true;
        discrepancies.timingGaps.push({
          error: "Settled in a different accounting month",
          platformTx: tx,
          bankRecords: bankRecord.records,
        });
      }

      // Rounding Errors
      if (
        Math.abs(tx.amount - bankRecord.totalAmount) > 0.001 &&
        bankRecord.count === 1
      ) {
        isAnomaly = true;
        discrepancies.roundingErrors.push({
          error: "Amount mismatch (potential rounding error)",
          difference: Number((tx.amount - bankRecord.totalAmount).toFixed(2)),
          platformTx: tx,
          bankRecords: bankRecord.records,
        });
      }

      // If no anomalies triggered, it's a perfect match!
      if (!isAnomaly) {
        discrepancies.matched.push(tx);
      }
    }
  });

  return discrepancies;
};

module.exports = { reconcileData };
