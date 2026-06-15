import { handleGenerateReportRequest } from "../../api/generate-report.js";

export default async (request) => {
  return handleGenerateReportRequest(request);
};
