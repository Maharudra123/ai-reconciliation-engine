const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini. It will automatically use process.env.GEMINI_API_KEY
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Sends the reconciliation report to Gemini to generate an executive summary.
 */
const generateExecutiveSummary = async (reportData) => {
  try {
    // We use gemini-1.5-flash as it is fast and excellent at text summarization
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
        You are a meticulous Chief Financial Officer (CFO). Review the following month-end reconciliation report between our internal platform and the bank's settlements.
        
        Here is the raw data of the discrepancies found:
        ${JSON.stringify(reportData, null, 2)}
        
        Please write a concise, professional 3-paragraph executive summary for the finance team. 
        - Paragraph 1: Give the high-level overview (Total Platform Volume vs Total Bank Volume, and the Net Difference).
        - Paragraph 2: Explain the specific discrepancies found (mention the $0.01 rounding error, the timing gap, the duplicate, and the orphaned refund).
        - Paragraph 3: Provide a brief recommendation on how to resolve these in the production system.
        
        Do not use markdown formatting like **bold** or bullet points, just write 3 clean paragraphs.
        `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("[Gemini AI Error]:", error.message);
    return "AI Summary is currently unavailable due to an API error. Please review the raw data below.";
  }
};

module.exports = { generateExecutiveSummary };
