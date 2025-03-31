
import React, { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, Filter, CheckSquare, Square, ChevronDown, ChevronUp, Calendar } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface SheetSelectorProps {
  sheetNames: string[];
  selectedSheets: string[];
  onSheetsChange: (sheets: string[]) => void;
  onGenerateSummary: () => void;
  isLoading: boolean;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const MONTH_ABBREVIATIONS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const SheetSelector: React.FC<SheetSelectorProps> = ({ 
  sheetNames,
  selectedSheets,
  onSheetsChange,
  onGenerateSummary,
  isLoading
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPattern, setSelectedPattern] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [filterType, setFilterType] = useState<"pattern" | "month">("month");

  // Find patterns in sheet names (dates, common prefixes, etc.)
  const patterns = useMemo(() => {
    if (!sheetNames.length) return [];
    
    const datePatterns = new Map<string, string[]>();
    const prefixMap = new Map<string, number>();
    
    sheetNames.forEach(name => {
      const dateMatch = name.match(/\d{1,4}[-/\.]\d{1,2}([-/\.]\d{1,4})?/);
      if (dateMatch) {
        const datePattern = dateMatch[0];
        if (!datePatterns.has(datePattern)) {
          datePatterns.set(datePattern, []);
        }
        datePatterns.get(datePattern)!.push(name);
      }
      
      const prefixMatch = name.match(/^([a-zA-Z0-9]+)[\s_-]/);
      if (prefixMatch) {
        const prefix = prefixMatch[1];
        prefixMap.set(prefix, (prefixMap.get(prefix) || 0) + 1);
      }
    });
    
    const commonPrefixes = Array.from(prefixMap.entries())
      .filter(([_, count]) => count > 1)
      .map(([prefix]) => prefix);
    
    const allPatterns = [
      ...Array.from(datePatterns.keys()),
      ...commonPrefixes
    ];
    
    return allPatterns;
  }, [sheetNames]);

  // Find months mentioned in sheet names
  const months = useMemo(() => {
    if (!sheetNames.length) return [];
    
    const foundMonths = new Set<string>();
    
    sheetNames.forEach(name => {
      const normalizedName = name.toLowerCase();
      
      MONTHS.forEach((month, index) => {
        if (normalizedName.includes(month.toLowerCase()) || 
            normalizedName.includes(MONTH_ABBREVIATIONS[index].toLowerCase()) ||
            name.includes(month) ||
            name.includes(MONTH_ABBREVIATIONS[index])) {
          foundMonths.add(month);
        }
      });
    });
    
    return Array.from(foundMonths);
  }, [sheetNames]);

  // Group sheets based on selected filter
  const groupedSheets = useMemo(() => {
    const groups: Record<string, string[]> = {};
    
    if (filterType === "month" && selectedPattern) {
      const month = selectedPattern;
      // Find the month index to get its abbreviation
      const monthIndex = MONTHS.indexOf(month);
      const abbreviation = monthIndex >= 0 ? MONTH_ABBREVIATIONS[monthIndex].toLowerCase() : "";
      
      const matchingSheets = sheetNames.filter(name => {
        const normalizedName = name.toLowerCase();
        return normalizedName.includes(month.toLowerCase()) || 
               normalizedName.includes(abbreviation);
      });
      
      if (matchingSheets.length) {
        groups[`${month}`] = matchingSheets;
      }
      
      const otherSheets = sheetNames.filter(name => {
        const normalizedName = name.toLowerCase();
        return !(normalizedName.includes(month.toLowerCase()) || 
                normalizedName.includes(abbreviation));
      });
      
      if (otherSheets.length) {
        groups["Other Sheets"] = otherSheets;
      }
    } else if (filterType === "pattern" && selectedPattern) {
      // Pattern-based filtering
      const matchingSheets = sheetNames.filter(name => 
        name.includes(selectedPattern)
      );
      
      if (matchingSheets.length) {
        groups[`Contains "${selectedPattern}"`] = matchingSheets;
      }
      
      const otherSheets = sheetNames.filter(name => 
        !name.includes(selectedPattern)
      );
      
      if (otherSheets.length) {
        groups["Other Sheets"] = otherSheets;
      }
    } else {
      // Default alphabetical grouping when no filter is selected
      for (let i = 0; i < 26; i++) {
        const letter = String.fromCharCode(65 + i);
        const sheetsStartingWithLetter = sheetNames.filter(name => 
          name.toUpperCase().startsWith(letter)
        );
        
        if (sheetsStartingWithLetter.length > 0) {
          groups[letter] = sheetsStartingWithLetter;
        }
      }
      
      const sheetsStartingWithNumbers = sheetNames.filter(name => 
        /^\d/.test(name)
      );
      
      if (sheetsStartingWithNumbers.length > 0) {
        groups["0-9"] = sheetsStartingWithNumbers;
      }
      
      const sheetsStartingWithOther = sheetNames.filter(name => 
        !/^[A-Za-z0-9]/.test(name)
      );
      
      if (sheetsStartingWithOther.length > 0) {
        groups["Other"] = sheetsStartingWithOther;
      }
    }
    
    // Apply search term filter if present
    if (searchTerm) {
      Object.keys(groups).forEach(groupName => {
        groups[groupName] = groups[groupName].filter(sheet => 
          sheet.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        if (groups[groupName].length === 0) {
          delete groups[groupName];
        }
      });
    }
    
    return groups;
  }, [sheetNames, searchTerm, selectedPattern, filterType]);

  const filterGroups = Object.keys(groupedSheets);
  
  // Expand the first group by default when groups change
  useEffect(() => {
    if (filterGroups.length > 0 && expandedGroups.length === 0) {
      setExpandedGroups([filterGroups[0]]);
    }
  }, [filterGroups, expandedGroups]);
  
  // Count total sheets after filtering
  const totalFilteredSheets = useMemo(() => {
    return Object.values(groupedSheets).reduce(
      (total, sheets) => total + sheets.length, 
      0
    );
  }, [groupedSheets]);

  // Count selected sheets after filtering
  const totalSelectedFilteredSheets = useMemo(() => {
    let count = 0;
    Object.values(groupedSheets).forEach(sheets => {
      sheets.forEach(sheet => {
        if (selectedSheets.includes(sheet)) {
          count++;
        }
      });
    });
    return count;
  }, [groupedSheets, selectedSheets]);

  // Handle individual sheet selection
  const handleSheetSelection = (sheetName: string) => {
    const newSelection = selectedSheets.includes(sheetName)
      ? selectedSheets.filter(name => name !== sheetName)
      : [...selectedSheets, sheetName];
    
    onSheetsChange(newSelection);
  };

  // Handle select/deselect all sheets
  const handleSelectAll = () => {
    if (totalSelectedFilteredSheets === totalFilteredSheets && totalFilteredSheets > 0) {
      const sheetsToRemove = new Set();
      Object.values(groupedSheets).forEach(sheets => {
        sheets.forEach(sheet => sheetsToRemove.add(sheet));
      });
      
      const newSelection = selectedSheets.filter(sheet => !sheetsToRemove.has(sheet));
      onSheetsChange(newSelection);
    } else {
      const sheetsToAdd = new Set<string>();
      Object.values(groupedSheets).forEach(sheets => {
        sheets.forEach(sheet => sheetsToAdd.add(sheet));
      });
      
      const existingSelection = new Set(selectedSheets);
      const combinedSelection = [...existingSelection, ...sheetsToAdd];
      
      onSheetsChange([...new Set(combinedSelection)]);
    }
  };

  // Handle select/deselect all sheets in a group
  const handleGroupSelectAll = (groupName: string) => {
    const groupSheets = groupedSheets[groupName] || [];
    
    const allSelected = groupSheets.every(sheet => selectedSheets.includes(sheet));
    
    if (allSelected) {
      const newSelection = selectedSheets.filter(sheet => !groupSheets.includes(sheet));
      onSheetsChange(newSelection);
    } else {
      const newSelection = [...selectedSheets];
      groupSheets.forEach(sheet => {
        if (!newSelection.includes(sheet)) {
          newSelection.push(sheet);
        }
      });
      onSheetsChange(newSelection);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const clearPatternFilter = () => {
    setSelectedPattern(null);
  };

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName) 
        : [...prev, groupName]
    );
  };

  const toggleFilterType = () => {
    setFilterType(prev => prev === "pattern" ? "month" : "pattern");
    setSelectedPattern(null);
  };

  // Safely handle month selection
  const handleSelectMonth = (month: string) => {
    try {
      if (MONTHS.includes(month)) {
        setSelectedPattern(month);
      } else {
        console.error("Invalid month:", month);
        setSelectedPattern(null);
      }
    } catch (error) {
      console.error("Error selecting month:", error);
      setSelectedPattern(null);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-xl">Step 2: Select Sheets</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            {totalSelectedFilteredSheets} / {totalFilteredSheets} selected
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSelectAll}
            className="flex items-center gap-1"
          >
            {totalSelectedFilteredSheets === totalFilteredSheets && totalFilteredSheets > 0 ? (
              <>
                <Square className="h-4 w-4" />
                <span className="hidden sm:inline">Deselect All</span>
                <span className="inline sm:hidden">Deselect</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Select All</span>
                <span className="inline sm:hidden">Select</span>
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-3">
          <div className="flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-48">
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
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleFilterType}
                className="flex items-center gap-1"
              >
                {filterType === "month" ? (
                  <>
                    <Calendar className="h-4 w-4" />
                    <span className="hidden sm:inline">Month Filter</span>
                  </>
                ) : (
                  <>
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Pattern Filter</span>
                  </>
                )}
              </Button>
              
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="flex items-center gap-1.5">
                    {filterType === "month" ? <Calendar className="h-4 w-4" /> : <Filter className="h-4 w-4" />}
                    <span className="hidden sm:inline">{filterType === "month" ? "Month" : "Filter"}</span>
                    {selectedPattern && <Badge variant="secondary" className="ml-1">{selectedPattern}</Badge>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0" align="end">
                  <Command>
                    <CommandInput placeholder={filterType === "month" ? "Search months..." : "Search patterns..."} />
                    <CommandEmpty>No {filterType === "month" ? "months" : "patterns"} found</CommandEmpty>
                    <CommandGroup>
                      {filterType === "month" ? (
                        months.length > 0 ? (
                          months.map((month) => (
                            <CommandItem
                              key={month}
                              onSelect={() => handleSelectMonth(month)}
                              className="cursor-pointer"
                            >
                              {month}
                            </CommandItem>
                          ))
                        ) : (
                          <div className="px-2 py-3 text-sm text-muted-foreground">
                            No month patterns detected in sheet names
                          </div>
                        )
                      ) : (
                        patterns.length > 0 ? (
                          patterns.map((pattern) => (
                            <CommandItem
                              key={pattern}
                              onSelect={() => setSelectedPattern(pattern)}
                              className="cursor-pointer"
                            >
                              {pattern}
                            </CommandItem>
                          ))
                        ) : (
                          <div className="px-2 py-3 text-sm text-muted-foreground">
                            No patterns detected in sheet names
                          </div>
                        )
                      )}
                    </CommandGroup>
                  </Command>
                  {selectedPattern && (
                    <div className="p-2 border-t">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={clearPatternFilter}
                        className="w-full"
                      >
                        Clear Filter
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        
        {Object.keys(groupedSheets).length > 0 ? (
          <div className="border rounded-md">
            {Object.entries(groupedSheets).map(([groupName, sheets]) => (
              <div key={groupName} className="border-b last:border-b-0">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-muted/50"
                  onClick={() => toggleGroup(groupName)}
                >
                  <div className="flex items-center gap-3">
                    {expandedGroups.includes(groupName) ? 
                      <ChevronUp className="h-4 w-4 flex-shrink-0" /> : 
                      <ChevronDown className="h-4 w-4 flex-shrink-0" />
                    }
                    <span className="font-medium">{groupName}</span>
                    <Badge variant="outline" className="ml-2">
                      {sheets.length} {sheets.length === 1 ? 'sheet' : 'sheets'}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGroupSelectAll(groupName);
                    }}
                  >
                    {sheets.every(sheet => selectedSheets.includes(sheet)) ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>
                {expandedGroups.includes(groupName) && (
                  <div className="p-3 pt-0">
                    <ScrollArea className={sheets.length > 12 ? "h-48" : ""}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
                        {sheets.map((name) => (
                          <div key={name} className="flex items-center space-x-2 py-1.5 px-1.5 rounded hover:bg-accent">
                            <Checkbox 
                              id={`sheet-${name}`}
                              checked={selectedSheets.includes(name)}
                              onCheckedChange={() => handleSheetSelection(name)}
                            />
                            <Label 
                              htmlFor={`sheet-${name}`} 
                              className="truncate text-sm cursor-pointer"
                              title={name}
                            >
                              {name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>
            ))}
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
