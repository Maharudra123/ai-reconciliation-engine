const { generateMockData } = require("../services/dataGenerator.service");
const { reconcileData } = require("../services/reconciliation.service");
const { generateExecutiveSummary } = require("../services/ai.service");

const getReconciliationReport = async (req, res) => {
  try {
    // 1. Fetch our synthetic data (with the 4 planted bugs)
    const { platformTransactions, bankSettlements } = generateMockData();

    // 2. Run the deterministic math engine
    const report = reconcileData(platformTransactions, bankSettlements);

    // 3. Generate the AI Executive Summary based on the report
    // (We only send the arrays, not the full objects to save AI token limits)
    const aiSummary = await generateExecutiveSummary({
      summary: report.summary,
      timingGapsCount: report.timingGaps.length,
      roundingErrorsCount: report.roundingErrors.length,
      duplicatesCount: report.duplicates.length,
      orphanedRefundsCount: report.orphanedRefunds.length,
    });

    // 4. Send the combined response
    res.status(200).json({
      success: true,
      data: {
        ...report,
        aiInsights: aiSummary,
      },
    });
  } catch (error) {
    console.error("[Reconciliation Controller Error]:", error);
    res.status(500).json({
      success: false,
      message: "Failed to run reconciliation engine.",
    });
  }
};

module.exports = { getReconciliationReport };
