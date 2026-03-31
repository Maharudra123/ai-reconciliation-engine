/**
 * Generates synthetic platform and bank data for January 2024.
 * Explicitly plants 4 anomalies required by the assessment.
 */
const generateMockData = () => {
  const platformTransactions = [];
  const bankSettlements = [];

  // --- NORMAL TRANSACTIONS (Happy Path) ---
  platformTransactions.push({
    id: "tx_001",
    type: "charge",
    amount: 150.0,
    timestamp: "2024-01-15T10:00:00Z",
    parent_id: null,
  });
  bankSettlements.push({
    settlement_id: "stl_001",
    transaction_id: "tx_001",
    amount: 150.0,
    settlement_date: "2024-01-16T08:00:00Z",
  });

  // --- ANOMALY 1: Cross-Month Timing ---
  // Platform records Jan 31, Bank settles Feb 02
  platformTransactions.push({
    id: "tx_002",
    type: "charge",
    amount: 200.0,
    timestamp: "2024-01-31T23:50:00Z",
    parent_id: null,
  });
  bankSettlements.push({
    settlement_id: "stl_002",
    transaction_id: "tx_002",
    amount: 200.0,
    settlement_date: "2024-02-02T09:00:00Z",
  });

  // --- ANOMALY 2: Rounding Error ($0.01 missing) ---
  // Platform splits a $100 charge into three. Bank rounds down.
  platformTransactions.push({
    id: "tx_003_a",
    type: "charge",
    amount: 33.34,
    timestamp: "2024-01-20T10:00:00Z",
    parent_id: null,
  });
  platformTransactions.push({
    id: "tx_003_b",
    type: "charge",
    amount: 33.33,
    timestamp: "2024-01-20T10:01:00Z",
    parent_id: null,
  });
  platformTransactions.push({
    id: "tx_003_c",
    type: "charge",
    amount: 33.33,
    timestamp: "2024-01-20T10:02:00Z",
    parent_id: null,
  });

  bankSettlements.push({
    settlement_id: "stl_003_a",
    transaction_id: "tx_003_a",
    amount: 33.33,
    settlement_date: "2024-01-21T08:00:00Z",
  });
  bankSettlements.push({
    settlement_id: "stl_003_b",
    transaction_id: "tx_003_b",
    amount: 33.33,
    settlement_date: "2024-01-21T08:00:00Z",
  });
  bankSettlements.push({
    settlement_id: "stl_003_c",
    transaction_id: "tx_003_c",
    amount: 33.33,
    settlement_date: "2024-01-21T08:00:00Z",
  });

  // --- ANOMALY 3: Duplicate Entry ---
  // Bank processed the same transaction ID twice
  platformTransactions.push({
    id: "tx_004",
    type: "charge",
    amount: 75.0,
    timestamp: "2024-01-25T14:00:00Z",
    parent_id: null,
  });
  bankSettlements.push({
    settlement_id: "stl_004_1",
    transaction_id: "tx_004",
    amount: 75.0,
    settlement_date: "2024-01-26T08:00:00Z",
  });
  bankSettlements.push({
    settlement_id: "stl_004_2",
    transaction_id: "tx_004",
    amount: 75.0,
    settlement_date: "2024-01-26T08:00:00Z",
  }); // The duplicate

  // --- ANOMALY 4: Orphaned Refund ---
  // Refund points to a parent_id that does not exist in platform data
  platformTransactions.push({
    id: "ref_005",
    type: "refund",
    amount: -50.0,
    timestamp: "2024-01-28T16:00:00Z",
    parent_id: "tx_999",
  });

  return { platformTransactions, bankSettlements };
};

module.exports = { generateMockData };
