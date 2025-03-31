
import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface SheetSelectorProps {
  sheetNames: string[];
  selectedSheets: string[];
  onSheetsChange: (sheets: string[]) => void;
  onGenerateSummary: () => void;
  isLoading: boolean;
}

const SheetSelector: React.FC<SheetSelectorProps> = ({ 
  sheetNames,
  selectedSheets,
  onSheetsChange,
  onGenerateSummary,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredSheets = useMemo(() => {
    if (!searchTerm) return sheetNames;
    return sheetNames.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [sheetNames, searchTerm]);

  const handleSheetSelection = (sheetName: string) => {
    // Fix: Pass the new array directly instead of a function
    const newSelection = selectedSheets.includes(sheetName)
      ? selectedSheets.filter(name => name !== sheetName)
      : [...selectedSheets, sheetName];
    
    onSheetsChange(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedSheets.length === filteredSheets.length && filteredSheets.length > 0) {
      onSheetsChange([]);
    } else {
      onSheetsChange([...filteredSheets]);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Step 2: Select Sheets</CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={handleSelectAll}
        >
          {selectedSheets.length === filteredSheets.length && filteredSheets.length > 0 ? "Deselect All" : "Select All"}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="mb-4 relative">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search sheets..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-8 pr-8"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-2.5 top-2.5"
                aria-label="Clear search"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            )}
          </div>
        </div>
        
        {filteredSheets.length > 0 ? (
          <div>
            {filteredSheets.length > 10 ? (
              <Accordion type="multiple" className="w-full">
                {Array.from(new Array(Math.ceil(filteredSheets.length / 10))).map((_, groupIndex) => {
                  const groupStart = groupIndex * 10;
                  const groupEnd = Math.min((groupIndex + 1) * 10, filteredSheets.length);
                  const groupSheets = filteredSheets.slice(groupStart, groupEnd);
                  const groupTitle = `Sheets ${groupStart + 1}-${groupEnd}`;
                  
                  return (
                    <AccordionItem key={groupIndex} value={`group-${groupIndex}`}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span>{groupTitle}</span>
                          <span className="text-sm text-muted-foreground">
                            {groupSheets.filter(name => selectedSheets.includes(name)).length} / {groupSheets.length} selected
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                          {groupSheets.map((name) => (
                            <div key={name} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`sheet-${name}`}
                                checked={selectedSheets.includes(name)}
                                onCheckedChange={() => handleSheetSelection(name)}
                              />
                              <Label htmlFor={`sheet-${name}`} className="truncate">{name}</Label>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredSheets.map((name) => (
                  <div key={name} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`sheet-${name}`}
                      checked={selectedSheets.includes(name)}
                      onCheckedChange={() => handleSheetSelection(name)}
                    />
                    <Label htmlFor={`sheet-${name}`} className="truncate">{name}</Label>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : searchTerm ? (
          <div className="text-center py-8 text-gray-500">No sheets found matching "{searchTerm}"</div>
        ) : (
          <div className="text-center py-8 text-gray-500">No sheets found in workbook</div>
        )}
        
        <div className="mt-4 flex justify-end">
          <Button 
            onClick={onGenerateSummary} 
            disabled={isLoading || selectedSheets.length === 0}
          >
            {isLoading ? "Generating..." : "Generate Summary"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default SheetSelector;
