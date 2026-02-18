interface RiskInput {
    historyReports: number;
    rainfallForecast: number;
    trafficDensity: number;
    roadAge: number;
    aiSeverity: number;
}

export const calculateRiskScore = (input: RiskInput): number => {
    // Risk = (H*0.4) + (W*0.3) + (T*0.2) + (A*0.1)
    // We need to normalize inputs to 0-1 range first.

    const H = Math.min(input.historyReports / 10, 1); // Cap at 10 reports
    const W = Math.min(input.rainfallForecast / 50, 1); // Cap at 50mm
    const T = input.trafficDensity; // Already 0-1
    const A = Math.min(input.roadAge / 20, 1); // Cap at 20 years

    // Base formula
    let risk = (H * 0.4) + (W * 0.3) + (T * 0.2) + (A * 0.1);

    // Factor in AI Severity (Heavy weighting)
    // If AI says it's critical (severity > 8), boost risk
    const severityFactor = input.aiSeverity / 10;

    // Average with severity
    risk = (risk + severityFactor) / 2;

    return parseFloat(risk.toFixed(2));
};
