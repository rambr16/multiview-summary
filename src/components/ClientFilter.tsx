
import React, { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClientFilterProps {
  data: any[];
  onFilter: (client: string | null) => void;
  selectedClient: string | null;
}

const ClientFilter: React.FC<ClientFilterProps> = ({
  data,
  onFilter,
  selectedClient
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const clientNames = useMemo(() => {
    if (!data.length) return [];
    
    // Get unique client names from the data
    const clientCol = data.some(row => row.client_name) ? 'client_name' : 
                      data.some(row => row.clientName) ? 'clientName' : 
                      data.some(row => row.client) ? 'client' : null;
    
    if (!clientCol) return [];
    
    // Extract all client names
    const allClients = data.map(row => {
      const clientValue = row[clientCol];
      return clientValue ? String(clientValue) : null;
    }).filter(Boolean); // Remove null/undefined values
    
    // Filter out duplicates and exclude those with "-summary"
    const uniqueClients = [...new Set(allClients)]
      .filter(client => !client.toLowerCase().includes('-summary'));
    
    console.log("Filtered client list:", uniqueClients);
    
    return uniqueClients.sort();
  }, [data]);

  const filteredClients = useMemo(() => {
    if (!searchTerm) return clientNames;
    return clientNames.filter(client => 
      String(client).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clientNames, searchTerm]);

  const handleClientSelect = (value: string) => {
    const client = value === "all" ? null : value;
    onFilter(client);
  };

  const clearSearch = () => {
    setSearchTerm("");
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
      </div>
    </div>
  );
};

export default ClientFilter;
