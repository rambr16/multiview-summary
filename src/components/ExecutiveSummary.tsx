import React, { useMemo } from "react";
import { DataRow } from "@/utils/fileProcessor";
import { format, getDay } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

// Coloring helpers for Target %
function getTargetPercentColor(targetPercent: number, weekendValue: string, currentDate: Date) {
  if (isNaN(targetPercent)) return "";
  
  // Get day of week (0 = Sunday, 1 = Monday, etc.)
  const dayOfWeek = getDay(currentDate);
  
  // Monday conditions
  if (dayOfWeek === 1) {
    if (weekendValue === 'Y' && targetPercent > 0 && targetPercent < 30) {
      return "bg-red-100 text-red-700 font-bold";
    }
    if (weekendValue === 'N' && targetPercent > 0 && targetPercent < 15) {
      return "bg-red-100 text-red-700 font-bold";
    }
  }
  // Tuesday condition
  else if (dayOfWeek === 2 && targetPercent < 50) {
    return "bg-red-100 text-red-700 font-bold";
  }
  // Friday condition
  else if (dayOfWeek === 5 && targetPercent < 95) {
    return "bg-red-100 text-red-700 font-bold";
  }
  // Default conditions (from previous implementation)
  else {
    if (targetPercent < 80) return "bg-red-100 text-red-700 font-bold";
    if (targetPercent > 130) return "bg-red-100 text-red-700 font-bold";
    return "bg-green-100 text-green-700 font-semibold";
  }
}

function getUniquePerPositiveColor(value: string | number): string {
  if (value === "no positive") return "bg-red-100 text-red-600";
  const numValue = typeof value === "number" ? value : parseFloat(String(value));
  if (isNaN(numValue)) return "";
  if (numValue > 1000) return "bg-red-100 text-red-700 font-bold";
  if (numValue < 500) return "bg-green-100 text-green-700 font-semibold";
  return "";
}

// Coloring helpers for Target %
function getTargetPercentColorOld(targetPercent: number) {
  // < 80%: red | >130%: red | 80-130%: green
  if (isNaN(targetPercent)) return "";
  if (targetPercent < 80) return "bg-red-100 text-red-700 font-bold";
  if (targetPercent > 130) return "bg-red-100 text-red-700 font-bold";
  return "bg-green-100 text-green-700 font-semibold";
}

function getCellClass(border: boolean = false) {
  return `px-2 py-1 text-center align-middle ${border ? "border" : ""}`;
}

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
  // Get current date in NY timezone
  const nyDate = useMemo(() => {
    return new Date(formatInTimeZone(new Date(), "America/New_York", "yyyy-MM-dd'T'HH:mm:ssXXX"));
  }, []);

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
        
        // Aggregate numeric values
        ["sent_count", "unique_sent_count", "positive_reply_count", "reply_count", "bounce_count"].forEach(field => {
          if (typeof row[field] === "number") {
            clientGroups[client][field] = Number(clientGroups[client][field] || 0) + row[field];
          } else if (row[field] && !isNaN(Number(row[field]))) {
            clientGroups[client][field] = Number(clientGroups[client][field] || 0) + Number(row[field]);
          }
        });
      }
    });

    // Process each client's data, filter out clients with sent_count < 1, and add calculated fields
    return Object.keys(clientGroups)
      .filter(clientName => {
        const summary = clientGroups[clientName];
        return Number(summary["sent_count"] || 0) >= 1;
      })
      .map(clientName => {
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

        // RR - Reply Rate
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
          weekendValue: weekendSendout,
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
      })
      .sort((a, b) => String(a.client_name).localeCompare(String(b.client_name)));
  }, [summaryData, amData, clientField]);

  if (!clientField || executiveRows.length === 0) return null;

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
      <div className="text-sm text-gray-500 mb-2">
        Report Date (NY): {format(nyDate, 'EEEE, MMMM d, yyyy')}
      </div>
      <table className="min-w-[900px] w-full border-collapse">
        <thead>
          <tr>
            {headers.map(h => (
              <th key={h.key} className="px-2 py-1 border-b text-xs font-medium text-cyan-900 whitespace-nowrap bg-cyan-100">
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {executiveRows.map((row, idx) => (
            <tr key={row.client_name} className={idx % 2 === 0 ? "bg-cyan-200/60" : ""}>
              {headers.map(h => {
                // Target % coloring with new conditions
                if (h.key === "Target %") {
                  return (
                    <td key={h.key} className={`${getCellClass(true)} ${getTargetPercentColor(row.targetPercentValue, String(row.weekendValue), nyDate)}`}>
                      {row[h.key]}
                    </td>
                  );
                }
                // Unique sent/positives coloring
                if (h.key === "unique_sent_per_positives") {
                  return (
                    <td key={h.key} className={`${getCellClass(true)} ${getUniquePerPositiveColor(row[h.key])}`}>
                      {row[h.key]}
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
      <div className="text-xs text-muted-foreground mt-2">
        Target %: Conditions vary by day of week. Unique sent/positives: Red if &gt; 1000, Green if &lt; 500.
      </div>
    </div>
  );
};

export default ExecutiveSummary;
