'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge, Tooltip, TooltipContent, TooltipTrigger } from '@aegisciso/ui';
import { Info, ExternalLink, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { frameworkColors } from '@/lib/theme';

interface FrameworkCoverage {
  code: string;
  name: string;
  totalControls: number;
  mappedControls: number;
  fullCoverage: number;
  partialCoverage: number;
  noCoverage: number;
}

interface ComplianceBarsProps {
  frameworks: FrameworkCoverage[];
}

export function ComplianceBars({ frameworks }: ComplianceBarsProps) {
  if (!frameworks || frameworks.length === 0) {
    return (
      <Card className="executive-card">
        <CardHeader>
          <CardTitle className="text-lg">Compliance Coverage by Framework</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No framework coverage data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="executive-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Compliance Coverage</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Shows the percentage of framework controls covered by your policies. Full coverage means complete implementation, partial means some aspects covered.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {frameworks.map((framework) => {
          const totalCoverage = Math.round(
            ((framework.fullCoverage + framework.partialCoverage * 0.5) / framework.totalControls) * 100
          );
          const color = frameworkColors[framework.code] || '#003366';

          return (
            <div key={framework.code} className="space-y-2">
              {/* Framework Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-sm font-medium">{framework.name}</span>
                  <Badge variant="outline" className="text-[10px] h-5">
                    {framework.code}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{totalCoverage}%</span>
                  <CoverageIndicator percentage={totalCoverage} />
                </div>
              </div>

              {/* Stacked Progress Bar */}
              <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                {/* Full Coverage */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(framework.fullCoverage / framework.totalControls) * 100}%`,
                        backgroundColor: '#16a34a',
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Full Coverage</p>
                    <p className="text-xs">{framework.fullCoverage} of {framework.totalControls} controls</p>
                  </TooltipContent>
                </Tooltip>

                {/* Partial Coverage */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(framework.partialCoverage / framework.totalControls) * 100}%`,
                        backgroundColor: '#d97706',
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">Partial Coverage</p>
                    <p className="text-xs">{framework.partialCoverage} of {framework.totalControls} controls</p>
                  </TooltipContent>
                </Tooltip>

                {/* No Coverage (Gap) */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className="h-full transition-all duration-500"
                      style={{
                        width: `${(framework.noCoverage / framework.totalControls) * 100}%`,
                        backgroundColor: '#e5e7eb',
                      }}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="font-medium">No Coverage (Gap)</p>
                    <p className="text-xs">{framework.noCoverage} of {framework.totalControls} controls</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              {/* Stats Row */}
              <div className="flex justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-600" />
                  <span>Full: {framework.fullCoverage}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-amber-600" />
                  <span>Partial: {framework.partialCoverage}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-gray-300" />
                  <span>Gap: {framework.noCoverage}</span>
                </div>
              </div>
            </div>
          );
        })}

        {/* Legend */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-center gap-6 text-xs">
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3.5 w-3.5 text-green-600" />
              <span>Full Coverage</span>
            </div>
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1">
              <XCircle className="h-3.5 w-3.5 text-gray-400" />
              <span>Gap</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CoverageIndicator({ percentage }: { percentage: number }) {
  if (percentage >= 80) {
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  }
  if (percentage >= 50) {
    return <AlertCircle className="h-4 w-4 text-amber-600" />;
  }
  return <XCircle className="h-4 w-4 text-red-600" />;
}

// Sample data generator for demo
export function getSampleFrameworkCoverage(): FrameworkCoverage[] {
  return [
    {
      code: 'NCA_ECC',
      name: 'NCA Essential Cybersecurity Controls',
      totalControls: 114,
      mappedControls: 89,
      fullCoverage: 67,
      partialCoverage: 22,
      noCoverage: 25,
    },
    {
      code: 'NIST_CSF',
      name: 'NIST Cybersecurity Framework',
      totalControls: 108,
      mappedControls: 78,
      fullCoverage: 54,
      partialCoverage: 24,
      noCoverage: 30,
    },
    {
      code: 'ISO_27001',
      name: 'ISO/IEC 27001:2022',
      totalControls: 93,
      mappedControls: 71,
      fullCoverage: 48,
      partialCoverage: 23,
      noCoverage: 22,
    },
    {
      code: 'SAMA_CSF',
      name: 'SAMA Cyber Security Framework',
      totalControls: 89,
      mappedControls: 62,
      fullCoverage: 41,
      partialCoverage: 21,
      noCoverage: 27,
    },
  ];
}
