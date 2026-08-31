interface ProgressBarProps {
  percentage: number;
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  color?: "blue" | "green";
}

export function ProgressBar({ 
  percentage, 
  label = "Progress", 
  showLabel = true, 
  size = "md",
  color = "blue"
}: ProgressBarProps) {
  const heightClass = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-3"
  }[size];

  const colorClass = color === "green"
    ? "bg-emerald-600"
    : "bg-blue-600";

  const clampedPercentage = Math.max(0, Math.min(100, Math.round(percentage)));

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{label}</span>
          <span className="font-bold">{clampedPercentage}%</span>
        </div>
      )}
      <div className={`w-full bg-gray-200 rounded-full ${heightClass} overflow-hidden`}>
        <div 
          className={`${colorClass} ${heightClass} rounded-full transition-all duration-500`} 
          style={{ width: `${clampedPercentage}%` }}
        />
      </div>
    </div>
  );
}
