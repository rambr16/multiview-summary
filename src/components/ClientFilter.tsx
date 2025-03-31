
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface ClientFilterProps {
  data: any[];
  onFilter: (client: string | null) => void;
  viewType: "detailed" | "summary";
  onViewTypeChange: (type: "detailed" | "summary") => void;
  onWeeklyTargetChange: (target: number) => void;
  weeklyTarget: number;
}

const ClientFilter: React.FC<ClientFilterProps> = ({
  data,
  onFilter,
  viewType,
  onViewTypeChange,
  onWeeklyTargetChange,
  weeklyTarget
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string | null>(null);

  const clientNames = useMemo(() => {
    if (!data.length) return [];
    
    // Get unique client names from the data
    const clientCol = data.some(row => row.client_name) ? 'client_name' : 
                      data.some(row => row.clientName) ? 'clientName' : 
                      data.some(row => row.client) ? 'client' : null;
    
    if (!clientCol) return [];
    
    const uniqueClients = [...new Set(data.map(row => row[clientCol]))].filter(Boolean);
    return uniqueClients.sort();
  }, [data]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientNames;
    return clientNames.filter(client => 
      client.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientNames, searchTerm]);

  const handleClientSelect = (value: string) => {
    const client = value === "all" ? null : value;
    setSelectedClient(client);
    onFilter(client);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const handleWeeklyTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onWeeklyTargetChange(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Input
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pr-8"
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2"
              aria-label="Clear search"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          )}
        </div>
        
        <Select
          value={selectedClient || "all"}
          onValueChange={handleClientSelect}
        >
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="Select a client" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {filteredClients.length > 0 ? (
              <ScrollArea className="h-[200px]">
                {filteredClients.map((client) => (
                  <SelectItem key={client} value={client}>
                    {client}
                  </SelectItem>
                ))}
              </ScrollArea>
            ) : (
              <div className="p-2 text-sm text-center text-muted-foreground">
                No clients found
              </div>
            )}
          </SelectContent>
        </Select>
        
        <div className="flex gap-2">
          <Button
            variant={viewType === "detailed" ? "default" : "outline"}
            onClick={() => onViewTypeChange("detailed")}
            className="h-10"
          >
            Detailed
          </Button>
          <Button
            variant={viewType === "summary" ? "default" : "outline"}
            onClick={() => onViewTypeChange("summary")}
            className="h-10"
          >
            Summary
          </Button>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <Label htmlFor="weekly-target" className="whitespace-nowrap">Weekly Target (Unique Sent):</Label>
        <Input
          id="weekly-target"
          type="number"
          min="0"
          value={weeklyTarget}
          onChange={handleWeeklyTargetChange}
          className="max-w-[150px]"
        />
      </div>
    </div>
  );
};

export default ClientFilter;
