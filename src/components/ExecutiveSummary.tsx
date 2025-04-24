
import React, { useMemo } from "react";
import { DataRow } from "@/utils/fileProcessor";

// Coloring helpers for Target %
function getTargetPercentColor(targetPercent: number) {
  // < 80%: red | >130%: red | 80-130%: green
  if (isNaN(targetPercent)) return "";
  if (targetPercent < 80) return "bg-red-100 text-red-700 font-bold";
  if (targetPercent > 130) return "bg-red-100 text-red-700 font-bold";
  return "bg-green-100 text-green-700 font-semibold";
}

function getCellClass(border: boolean = false) {
  return `px-2 py-1 text-center align-middle ${border ? "border" : ""}`;
}

// ExecutiveSummary: One row per client, only when All clients selected
interface ExecutiveSummaryProps {
  summaryData: DataRow[];
  amData: DataRow[];
}

const metricColumns = [
  "sent_count",
  "unique_sent_count",
  "Target",
  "Target %",
  "AM",
  "Weekend sendout",
  "positive_reply_count",
  "unique_sent_per_positives",
  "prr_vs_rr",
  "reply_count",
  "rr",
  "bounce_count",
  "bounce_rate"
];

const ExecutiveSummary: React.FC<ExecutiveSummaryProps> = ({ summaryData, amData }) => {
  // Combine all client summary rows (each unique client_name)
  // Assume summaryData already filtered to skip "- Summary" rows per client/client_name.
  // Map: client_name => summary row data (sums)
  // Also lookup AM info by client_name

  // The below only runs when "All clients" summary is being shown.
  const clientField = useMemo(() => {
    if (summaryData.length === 0) return null;
    return Object.keys(summaryData[0]).find(key => key.toLowerCase().includes("client"));
  }, [summaryData]);

  // Build executive rows
  const executiveRows = useMemo(() => {
    if (!clientField) return [];

    // Group rows by client_name, excluding any " - Summary" or empty client
    const clientGroups: Record<string, DataRow> = {};
    
    summaryData.forEach(row => {
      const client = String(row[clientField]);
      if (client && !client.includes(" - Summary") && client !== "") {
        // Initialize client entry if first time seeing this client
        if (!clientGroups[client]) {
          clientGroups[client] = {
            [clientField]: client,
            sent_count: 0,
            unique_sent_count: 0,
            positive_reply_count: 0,
            reply_count: 0,
            bounce_count: 0,
          };
        }
        
        // Aggregate numeric values - FIX: Convert values to numbers before addition
        ["sent_count", "unique_sent_count", "positive_reply_count", "reply_count", "bounce_count"].forEach(field => {
          if (typeof row[field] === "number") {
            clientGroups[client][field] = Number(clientGroups[client][field] || 0) + row[field];
          } else if (row[field] && !isNaN(Number(row[field]))) {
            clientGroups[client][field] = Number(clientGroups[client][field] || 0) + Number(row[field]);
          }
        });
      }
    });

    // Process each client's data and add calculated fields
    return Object.keys(clientGroups).map(clientName => {
      const summary = clientGroups[clientName];

      // Find AM data by client_name (strict match)
      const am = amData.find(a => String(a["client_name"]).trim() === clientName);

      // Gather stats for row
      const sent = Number(summary["sent_count"] || 0);
      const uniqueSent = Number(summary["unique_sent_count"] || 0);
      const positive = Number(summary["positive_reply_count"] || 0);
      const reply = Number(summary["reply_count"] || 0);
      const bounce = Number(summary["bounce_count"] || 0);

      // AM values (fallback to empty)
      const target = am && Number(am["Target"]) ? Number(am["Target"]) : 0;
      const amName = am ? am["Account Manager"] : "";
      const weekendSendout = am ? am["Weekend sendout"] : "";

      // Calculated values
      const targetPercent = target > 0 ? (uniqueSent / target) * 100 : 0;
      const targetPercentStr = target > 0 ? `${targetPercent.toFixed(2)}%` : "";

      // PRR vs RR
      const prr_vs_rr = reply > 0 ? (positive / reply) * 100 : 0;

      // RR - Reply Rate (reply count / unique sent count)
      const rr = uniqueSent > 0 ? (reply / uniqueSent) * 100 : 0;

      // Bounce Rate
      const bounce_rate = uniqueSent > 0 ? (bounce / uniqueSent) * 100 : 0;

      // Unique sent per positive
      const unique_sent_per_positives = positive > 0 
        ? (uniqueSent / positive).toFixed(2) 
        : "no positive";

      return {
        client_name: clientName,
        sent_count: sent,
        unique_sent_count: uniqueSent,
        Target: target || "",
        "Target %": targetPercentStr,
        targetPercentValue: targetPercent,
        AM: amName,
        "Weekend sendout": weekendSendout,
        positive_reply_count: positive,
        unique_sent_per_positives,
        prr_vs_rr,
        reply_count: reply,
        rr,
        bounce_count: bounce,
        bounce_rate,
      };
    });
  }, [summaryData, amData, clientField]);

  if (!clientField || executiveRows.length === 0) return null;

  // Table headers (show only those from design)
  const headers = [
    { key: "client_name", label: "Client" },
    { key: "sent_count", label: "Sent" },
    { key: "unique_sent_count", label: "Unique Sent" },
    { key: "Target", label: "Target" },
    { key: "Target %", label: "Target %" },
    { key: "AM", label: "AM" },
    { key: "Weekend sendout", label: "Weekend" },
    { key: "positive_reply_count", label: "Positive" },
    { key: "unique_sent_per_positives", label: "Unique sent/positives" },
    { key: "prr_vs_rr", label: "PRR" },
    { key: "reply_count", label: "Replies" },
    { key: "rr", label: "RR" },
    { key: "bounce_count", label: "Bounce" },
    { key: "bounce_rate", label: "Bounce %" },
  ];

  return (
    <div className="overflow-x-auto border rounded-md p-4 bg-cyan-50 mb-2">
      <h2 className="text-xl font-bold mb-2 text-sky-900">Executive Summary</h2>
      <table className="min-w-[900px] w-full border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h.key} className="px-2 py-1 border-b text-xs font-medium text-cyan-900 whitespace-nowrap bg-cyan-100">{h.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {executiveRows.map((row, idx) => (
            <tr key={row.client_name} className={idx % 2 === 0 ? "bg-cyan-200/60" : ""}>
              {headers.map(h => {
                // Special case for Target %
                if (h.key === "Target %") {
                  const n = Number(row.targetPercentValue);
                  return (
                    <td key={h.key} className={`${getCellClass(true)} ${getTargetPercentColor(n)}`}>
                      {row[h.key]}
                    </td>
                  );
                }
                // "no positive" color for unique_sent/positives, PRR etc
                if (h.key === "unique_sent_per_positives" && row[h.key] === "no positive") {
                  return (
                    <td key={h.key} className={`${getCellClass(true)} bg-red-100 text-red-600`}>{row[h.key]}</td>
                  );
                }
                // Format percentage values
                if (["prr_vs_rr", "rr", "bounce_rate"].includes(h.key)) {
                  return (
                    <td key={h.key} className={getCellClass(true)}>
                      {typeof row[h.key] === "number" ? `${row[h.key].toFixed(2)}%` : row[h.key]}
                    </td>
                  );
                }
                // Others: regular formatting
                return (
                  <td key={h.key} className={getCellClass(true)}>
                    {typeof row[h.key] === "number"
                      ? Number(row[h.key]).toLocaleString(undefined, { maximumFractionDigits: 2 })
                      : row[h.key]}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="text-xs text-muted-foreground mt-2">Target %: Red if less than 80% or over 130%. Weekend and AM columns are loaded from AM subsheet.</div>
    </div>
  );
};

export default ExecutiveSummary;
