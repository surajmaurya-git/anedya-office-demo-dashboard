import React from "react";
import GaugeChart from "./GaugeChart";

interface GaugeChartProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit: string;
  color?: string;
  timestamp?: number;
}

const GaugeChartModern: React.FC<GaugeChartProps> = (props) => {
  return <GaugeChart {...props} showValue={true} />;
};

export default GaugeChartModern;
