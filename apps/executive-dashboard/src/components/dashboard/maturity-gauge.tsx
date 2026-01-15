'use client';

import { Card, CardContent, CardHeader, CardTitle, Badge, Tooltip, TooltipContent, TooltipTrigger } from '@aegisciso/ui';
import { Info, TrendingUp, Shield, FileText, Activity, Target } from 'lucide-react';
import { maturityLevels, getMaturityLevel } from '@/lib/theme';

interface MaturityGaugeProps {
  level: number;
  drivers?: {
    mappingCompleteness: number;
    policyValidity: number;
    remediationHealth: number;
    processMaturity: number;
  };
}

export function MaturityGauge({ level, drivers }: MaturityGaugeProps) {
  const currentLevel = getMaturityLevel(level);
  const levelNumber = Math.max(1, Math.min(5, level)) as 1 | 2 | 3 | 4 | 5;

  const defaultDrivers = drivers || {
    mappingCompleteness: 65,
    policyValidity: 78,
    remediationHealth: 52,
    processMaturity: 60,
  };

  const driverItems = [
    {
      name: 'Mapping Completeness',
      value: defaultDrivers.mappingCompleteness,
      icon: Target,
      description: 'Policy-to-framework mapping coverage',
    },
    {
      name: 'Policy Validity',
      value: defaultDrivers.policyValidity,
      icon: FileText,
      description: 'Policies current and not expired',
    },
    {
      name: 'Remediation Health',
      value: defaultDrivers.remediationHealth,
      icon: Activity,
      description: 'Remediation plans on track',
    },
    {
      name: 'Process Maturity',
      value: defaultDrivers.processMaturity,
      icon: Shield,
      description: 'Overall process standardization',
    },
  ];

  return (
    <Card className="executive-card">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Maturity Level</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-muted-foreground hover:text-foreground">
                <Info className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p>Security maturity is calculated based on mapping completeness, policy validity, remediation health, and process standardization.</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Maturity Level Display */}
        <div className="flex items-center gap-6">
          {/* Circular Gauge */}
          <div className="relative">
            <svg className="h-28 w-28 -rotate-90 transform">
              {/* Background arc */}
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-muted/30"
              />
              {/* Filled arc based on level */}
              <circle
                cx="56"
                cy="56"
                r="48"
                fill="none"
                stroke={currentLevel.color}
                strokeWidth="12"
                strokeDasharray={`${(levelNumber / 5) * 301.6} 301.6`}
                strokeLinecap="round"
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" style={{ color: currentLevel.color }}>
                {levelNumber}
              </span>
              <span className="text-xs text-muted-foreground">/5</span>
            </div>
          </div>

          {/* Level Info */}
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="text-sm font-semibold"
                style={{
                  backgroundColor: currentLevel.bgColor,
                  color: currentLevel.color,
                }}
              >
                {currentLevel.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {currentLevel.description}
            </p>
          </div>
        </div>

        {/* Level Progress Indicator */}
        <div className="flex justify-between gap-1">
          {Object.entries(maturityLevels).map(([key, levelInfo]) => {
            const num = parseInt(key);
            const isActive = num <= levelNumber;
            const isCurrent = num === levelNumber;

            return (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <div
                    className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                      isCurrent ? 'ring-2 ring-offset-1' : ''
                    }`}
                    style={{
                      backgroundColor: isActive ? levelInfo.color : '#e5e7eb',
                      ['--tw-ring-color' as string]: isCurrent ? levelInfo.color : 'transparent',
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">Level {num}: {levelInfo.label}</p>
                  <p className="text-xs text-muted-foreground">{levelInfo.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Maturity Drivers */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-muted-foreground">Maturity Drivers</h4>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </div>

          <div className="space-y-2">
            {driverItems.map((driver) => (
              <div key={driver.name} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <driver.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{driver.name}</span>
                  </div>
                  <span className="font-medium">{driver.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${driver.value}%`,
                      backgroundColor:
                        driver.value >= 80
                          ? '#16a34a'
                          : driver.value >= 60
                          ? '#65a30d'
                          : driver.value >= 40
                          ? '#d97706'
                          : '#dc2626',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
